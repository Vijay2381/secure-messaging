/* ============================================
   auth.js — Authentication Logic
============================================ */
const Auth = {
  async handleSignup(e) {
    e.preventDefault();
    const name    = document.getElementById('su-name').value.trim();
    const email   = document.getElementById('su-email').value.trim().toLowerCase();
    const pass    = document.getElementById('su-pass').value;
    const confirm = document.getElementById('su-confirm').value;
    const errEl   = document.getElementById('su-error');

    errEl.classList.add('hidden');

    if (!name) return this._err(errEl, 'Please enter your name.');
    if (pass.length < 8) return this._err(errEl, 'Password must be at least 8 characters.');
    if (pass !== confirm) return this._err(errEl, 'Passwords do not match.');

    const users = JSON.parse(localStorage.getItem('sm_users') || '{}');
    if (users[email]) return this._err(errEl, 'An account with this email already exists.');

    const btn = document.getElementById('su-btn');
    btn.textContent = 'Creating...';
    btn.disabled = true;

    const hashed = await Crypto.hash(pass);
    const uid = 'user_' + Date.now();
    users[email] = { uid, name, email, hash: hashed, createdAt: Date.now() };
    localStorage.setItem('sm_users', JSON.stringify(users));

    // Auto-login
    this._createSession(users[email]);
    App.showToast('Account created! Welcome, ' + name + ' 🎉');
    App.navigate('dashboard');
    btn.textContent = 'Create Account';
    btn.disabled = false;
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('li-email').value.trim().toLowerCase();
    const pass  = document.getElementById('li-pass').value;
    const errEl = document.getElementById('li-error');

    errEl.classList.add('hidden');

    const users = JSON.parse(localStorage.getItem('sm_users') || '{}');
    const user  = users[email];
    if (!user) return this._err(errEl, 'No account found with this email.');

    const btn = document.getElementById('li-btn');
    btn.textContent = 'Verifying...';
    btn.disabled = true;

    const hashed = await Crypto.hash(pass);
    if (hashed !== user.hash) {
      this._err(errEl, 'Incorrect password. Please try again.');
      btn.textContent = 'Log In Securely';
      btn.disabled = false;
      return;
    }

    this._createSession(user);
    App.showToast('Welcome back, ' + user.name + '! 🔐');
    App.navigate('dashboard');
    btn.textContent = 'Log In Securely';
    btn.disabled = false;
  },

  logout() {
    localStorage.removeItem('sm_session');
    App.showToast('Logged out safely.');
    App.navigate('login');
  },

  _createSession(user) {
    const session = { uid: user.uid, name: user.name, email: user.email, loginAt: Date.now() };
    localStorage.setItem('sm_session', JSON.stringify(session));
  },

  getSession() {
    return JSON.parse(localStorage.getItem('sm_session') || 'null');
  },

  checkStrength(val) {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
    const colors = ['var(--danger)', '#f97316', '#eab308', 'var(--success)', 'var(--success)'];
    const lbl = document.getElementById('strength-lbl');
    if (lbl) {
      lbl.textContent = val ? labels[score] : 'Enter a password';
      lbl.style.color = val ? colors[score] : '';
    }
    for (let i = 1; i <= 4; i++) {
      const bar = document.getElementById('sb' + i);
      if (bar) bar.style.background = i <= score ? colors[score] : '';
    }
  },

  toggleEye(id, btn) {
    const inp = document.getElementById(id);
    if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
    else { inp.type = 'password'; btn.textContent = '👁'; }
  },

  _err(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }
};
