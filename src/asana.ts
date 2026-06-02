// Asana integration — stub. See the main fabworks repo for the full implementation.
// To enable: configure ASANA_PAT wrangler secret and replace with the full asana.ts.

export type AsanaWebhookPayload = { events?: unknown[] };

export async function verifyWebhookSignature(_body: unknown, _signature: string, _secret: string | null): Promise<boolean> { return false; }
export async function storeWebhook(_db: D1Database, _id: string, _resourceId: string, _secret: string): Promise<void> {}
export async function getWebhookSecret(_db: D1Database): Promise<string | null> { return null; }
export async function enqueueEvents(_db: D1Database, _id: string, _events: unknown[]): Promise<void> {}
export async function processEventQueue(_db: D1Database): Promise<void> {}
export async function getQueueStatus(_db: D1Database): Promise<object> { return { queue: 0 }; }
export async function syncScanToAsana(_db: D1Database, _pat: string, _type: string, _id: number): Promise<void> {}
export async function syncFixitToAsana(_db: D1Database, _pat: string, _jobId: number, _label: string, _rootCause: string, _description: string): Promise<void> {}
export async function registerAsanaWebhook(_pat: string, _projectGid: string, _targetUrl: string): Promise<{ gid?: string }> { return {}; }
export async function getWebhookStatus(_db: D1Database): Promise<object> { return {}; }
export async function storeMapping(_db: D1Database, _fwType: string, _fwId: number, _asanaId: string, _asanaType: string): Promise<void> {}
