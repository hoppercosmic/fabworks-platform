import { page } from "./layout";

export function loginPage(): string {
  return page("Login", `
    main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .login-card { width: 100%; max-width: 360px; }
    .login-card h2 { font-size: 1.6rem; margin-bottom: 4px; text-align: center; font-weight: 800; }
    .login-card .subtitle { font-size: 0.8rem; color: var(--muted); text-align: center; margin-bottom: 24px; }
    .login-card .field { margin-bottom: 16px; }
    .login-error { color: var(--error); font-size: 0.85rem; text-align: center; margin-top: 8px; display: none; }
    .pin-label { display: flex; justify-content: space-between; align-items: center; }
    .pin-row { display: flex; gap: 10px; justify-content: center; }
    .pin-dot {
      width: 48px; height: 56px; border-radius: 12px;
      background: var(--bg); border: 2px solid var(--border);
      font-size: 1.5rem; font-weight: 700; text-align: center; color: var(--text);
      caret-color: var(--accent); outline: none;
      transition: border-color 0.15s;
      -webkit-text-security: disc;
    }
    .pin-dot:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
    .pin-dot.filled { border-color: var(--accent); }
    .pin-toggle { font-size: 0.7rem; color: var(--accent); cursor: pointer; border: none; background: none; padding: 0; }
    .pin-shake { animation: shake 0.4s ease; }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
  `, `
  <main>
    <div class="card login-card">
      <h2>FabWorks</h2>
      <div class="subtitle">Shop Floor Tracker</div>
      <div class="field">
        <label>Email</label>
        <input type="text" id="email" placeholder="you@example.com" autocomplete="email" autocapitalize="none">
      </div>
      <div class="field">
        <div class="pin-label">
          <label style="margin-bottom:0">PIN</label>
          <button class="pin-toggle" id="pin-toggle">Show</button>
        </div>
        <div class="pin-row" id="pin-row">
          <input class="pin-dot" type="password" inputmode="numeric" maxlength="1" data-idx="0" autocomplete="off">
          <input class="pin-dot" type="password" inputmode="numeric" maxlength="1" data-idx="1" autocomplete="off">
          <input class="pin-dot" type="password" inputmode="numeric" maxlength="1" data-idx="2" autocomplete="off">
          <input class="pin-dot" type="password" inputmode="numeric" maxlength="1" data-idx="3" autocomplete="off">
        </div>
        <input type="hidden" id="pin" value="">
      </div>
      <button class="btn btn-primary" id="login-btn">Log In</button>
      <div class="login-error" id="error"></div>
    </div>
  </main>
  `, `
    var emailInput = document.getElementById('email');
    var pinInput = document.getElementById('pin');
    var loginBtn = document.getElementById('login-btn');
    var errorDiv = document.getElementById('error');
    var pinRow = document.getElementById('pin-row');
    var dots = Array.from(pinRow.querySelectorAll('.pin-dot'));
    var pinVisible = false;

    var savedEmail = localStorage.getItem('fw_email');
    if (savedEmail) {
      emailInput.value = savedEmail;
      setTimeout(function() { dots[0].focus(); }, 100);
    }

    function syncPin() {
      pinInput.value = dots.map(function(d) { return d.value; }).join('');
      dots.forEach(function(d) { d.classList.toggle('filled', d.value.length > 0); });
    }

    dots.forEach(function(dot, i) {
      dot.addEventListener('input', function() {
        dot.value = dot.value.replace(/[^0-9]/g, '').slice(-1);
        syncPin();
        if (dot.value && i < dots.length - 1) dots[i + 1].focus();
        if (pinInput.value.length === 4) doLogin();
      });
      dot.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && !dot.value && i > 0) {
          dots[i - 1].value = '';
          dots[i - 1].focus();
          syncPin();
        }
        if (e.key === 'Enter') doLogin();
      });
      dot.addEventListener('focus', function() { dot.select(); });
      dot.addEventListener('paste', function(e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 4);
        for (var j = 0; j < 4; j++) { dots[j].value = text[j] || ''; }
        syncPin();
        if (text.length >= 4) doLogin();
        else dots[Math.min(text.length, 3)].focus();
      });
    });

    document.getElementById('pin-toggle').addEventListener('click', function() {
      pinVisible = !pinVisible;
      this.textContent = pinVisible ? 'Hide' : 'Show';
      dots.forEach(function(d) { d.type = pinVisible ? 'text' : 'password'; });
    });

    function shakePin() {
      pinRow.classList.add('pin-shake');
      dots.forEach(function(d) { d.style.borderColor = 'var(--error)'; });
      setTimeout(function() {
        pinRow.classList.remove('pin-shake');
        dots.forEach(function(d) { d.value = ''; d.style.borderColor = ''; });
        syncPin();
        dots[0].focus();
      }, 500);
    }

    function doLogin() {
      errorDiv.style.display = 'none';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim(), pin: pinInput.value.trim() }),
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(r) {
        if (r.ok) {
          localStorage.setItem('fw_email', emailInput.value.trim());
          localStorage.setItem('fw_name', r.data.user.name);
          window.location.href = '/';
        } else {
          errorDiv.textContent = r.data.error;
          errorDiv.style.display = 'block';
          loginBtn.disabled = false;
          loginBtn.textContent = 'Log In';
          shakePin();
        }
      }).catch(function() {
        errorDiv.textContent = 'Network error';
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
      });
    }

    loginBtn.addEventListener('click', doLogin);
  `, null, "/login");
}
