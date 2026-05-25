// Web Push for Cloudflare Workers — VAPID + RFC 8291 payload encryption
// Uses Web Crypto API (crypto.subtle) — no Node.js dependencies

type PushSubscription = { endpoint: string; p256dh: string; auth: string };
type PushPayload = { title: string; body: string; icon?: string; url?: string };
type Env = { DB: D1Database; VAPID_PUBLIC_KEY: string; VAPID_PRIVATE_KEY: string; VAPID_SUBJECT: string };

function base64urlToBytes(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) { result.set(arr, offset); offset += arr.length; }
  return result;
}

async function signVapidJwt(audience: string, env: Env): Promise<{ token: string; publicKey: string }> {
  const header = bytesToBase64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToBase64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: env.VAPID_SUBJECT,
  })));

  const pubBytes = base64urlToBytes(env.VAPID_PUBLIC_KEY);
  const privBytes = base64urlToBytes(env.VAPID_PRIVATE_KEY);

  // Import private key as JWK — need x,y from the 65-byte uncompressed public key
  const x = bytesToBase64url(pubBytes.slice(1, 33));
  const y = bytesToBase64url(pubBytes.slice(33, 65));
  const d = bytesToBase64url(privBytes);

  const key = await crypto.subtle.importKey("jwk", {
    kty: "EC", crv: "P-256", x, y, d, ext: true,
  }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);

  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, signingInput);

  // Convert DER signature to raw r||s (64 bytes)
  const rawSig = derToRaw(new Uint8Array(sig));
  const token = `${header}.${payload}.${bytesToBase64url(rawSig)}`;
  return { token, publicKey: env.VAPID_PUBLIC_KEY };
}

function derToRaw(der: Uint8Array): Uint8Array {
  // Web Crypto may return raw 64-byte signature on some platforms, or DER
  if (der.length === 64) return der;
  // DER format: 0x30 <len> 0x02 <rlen> <r> 0x02 <slen> <s>
  const raw = new Uint8Array(64);
  let offset = 2;
  const rLen = der[offset + 1];
  const rStart = offset + 2 + (rLen > 32 ? rLen - 32 : 0);
  const rCopy = Math.min(rLen, 32);
  raw.set(der.slice(rStart, rStart + rCopy), 32 - rCopy);
  offset = offset + 2 + rLen;
  const sLen = der[offset + 1];
  const sStart = offset + 2 + (sLen > 32 ? sLen - 32 : 0);
  const sCopy = Math.min(sLen, 32);
  raw.set(der.slice(sStart, sStart + sCopy), 64 - sCopy);
  return raw;
}

async function encryptPayload(sub: PushSubscription, payload: string): Promise<Uint8Array> {
  const clientPubBytes = base64urlToBytes(sub.p256dh);
  const authSecret = base64urlToBytes(sub.auth);
  const plaintext = new TextEncoder().encode(payload);

  // Generate ephemeral ECDH key pair
  const localKey = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
  const localPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKey.publicKey) as ArrayBuffer);

  // Import subscriber's public key
  const clientPub = await crypto.subtle.importKey("raw", clientPubBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);

  // ECDH shared secret
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientPub } as any, localKey.privateKey, 256));

  // HKDF to derive IKM from auth secret
  const authInfo = concat(new TextEncoder().encode("WebPush: info\0"), clientPubBytes, localPubRaw);
  const ikm = await hkdf(authSecret, sharedSecret, authInfo, 32);

  // Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive content encryption key and nonce
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const prk = await hkdf(salt, ikm, cekInfo, 16);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Pad plaintext: delimiter 0x02 followed by padding zeros (we use minimal padding)
  const padded = concat(plaintext, new Uint8Array([2]));

  // AES-128-GCM encrypt
  const cekKey = await crypto.subtle.importKey("raw", prk, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, padded));

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, padded.length + 16); // record size (payload + tag)
  const header = concat(salt, rs, new Uint8Array([65]), localPubRaw);
  return concat(header, encrypted);
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8);
  return new Uint8Array(bits);
}

export async function sendPush(sub: PushSubscription, payload: PushPayload, env: Env): Promise<number> {
  const body = await encryptPayload(sub, JSON.stringify(payload));
  const url = new URL(sub.endpoint);
  const { token, publicKey } = await signVapidJwt(url.origin, env);

  const response = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${token}, k=${publicKey}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
    },
    body,
  });
  return response.status;
}

export async function notifyByRole(
  db: D1Database, env: Env, roles: string[], payload: PushPayload, excludeUserId?: number
): Promise<void> {
  const placeholders = roles.map(() => "?").join(",");
  const query = excludeUserId
    ? `SELECT ps.endpoint, ps.p256dh, ps.auth FROM push_subscriptions ps JOIN users u ON ps.user_id = u.id WHERE u.role IN (${placeholders}) AND u.active = 1 AND ps.user_id != ?`
    : `SELECT ps.endpoint, ps.p256dh, ps.auth FROM push_subscriptions ps JOIN users u ON ps.user_id = u.id WHERE u.role IN (${placeholders}) AND u.active = 1`;

  const binds = excludeUserId ? [...roles, excludeUserId] : roles;
  const subs = await db.prepare(query).bind(...binds).all<PushSubscription>();

  const expired: string[] = [];
  for (const sub of subs.results) {
    try {
      const status = await sendPush(sub, payload, env);
      if (status === 404 || status === 410) expired.push(sub.endpoint);
    } catch { /* push failed silently */ }
  }

  if (expired.length > 0) {
    const ph = expired.map(() => "?").join(",");
    await db.prepare(`DELETE FROM push_subscriptions WHERE endpoint IN (${ph})`).bind(...expired).run();
  }
}

export async function notifyUser(db: D1Database, env: Env, userId: number, payload: PushPayload): Promise<void> {
  const subs = await db.prepare(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?"
  ).bind(userId).all<PushSubscription>();

  const expired: string[] = [];
  for (const sub of subs.results) {
    try {
      const status = await sendPush(sub, payload, env);
      if (status === 404 || status === 410) expired.push(sub.endpoint);
    } catch { /* push failed silently */ }
  }

  if (expired.length > 0) {
    const ph = expired.map(() => "?").join(",");
    await db.prepare(`DELETE FROM push_subscriptions WHERE endpoint IN (${ph})`).bind(...expired).run();
  }
}
