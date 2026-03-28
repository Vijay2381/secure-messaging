/* ============================================
   partner.js — Partner Connection Logic
============================================ */
const Partner = {
  _code: null,
  _timerInterval: null,
  _timerSecs: 600,

  generate() {
    this._code = Crypto.generateCode();
    const session = Auth.getSession();
    if (!session) return;

    // Store the code in localStorage so partner can retrieve it
    const codes = JSON.parse(localStorage.getItem('sm_codes') || '{}');
    codes[this._code] = { uid: session.uid, name: session.name, ts: Date.now() };
    localStorage.setItem('sm_codes', JSON.stringify(codes));

    // Display
    const el = document.getElementById('my-passcode');
    el.innerHTML = this._code.split('').map(c => `<span class="pc-char">${c}</span>`).join('');
    el.classList.add('active');
    document.getElementById('copy-btn').classList.remove('hidden');

    // Timer
    clearInterval(this._timerInterval);
    this._timerSecs = 600;
    document.getElementById('pc-timer').classList.remove('hidden');
    this._timerInterval = setInterval(() => {
      this._timerSecs--;
      const m = String(Math.floor(this._timerSecs / 60)).padStart(2,'0');
      const s = String(this._timerSecs % 60).padStart(2,'0');
      document.getElementById('pc-countdown').textContent = `${m}:${s}`;
      if (this._timerSecs <= 0) {
        clearInterval(this._timerInterval);
        this._cleanup(this._code);
        this._code = null;
        el.innerHTML = '<span class="pc-dash">— — — — — —</span>';
        el.classList.remove('active');
        document.getElementById('copy-btn').classList.add('hidden');
        document.getElementById('pc-timer').classList.add('hidden');
        App.showToast('Code expired. Generate a new one.');
      }
    }, 1000);
    App.showToast('Code generated! Share it with your partner.');
  },

  copy() {
    if (!this._code) return;
    navigator.clipboard.writeText(this._code).then(() => App.showToast('Code copied to clipboard! 📋'));
  },

  next(inp, nextId) {
    inp.value = inp.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-1);
    inp.classList.toggle('filled', inp.value !== '');
    if (inp.value && nextId) document.getElementById(nextId).focus();
  },

  back(e, prevId, curId) {
    if (e.key === 'Backspace') {
      const cur = document.getElementById(curId);
      if (!cur.value && prevId) {
        const prev = document.getElementById(prevId);
        prev.value = '';
        prev.classList.remove('filled');
        prev.focus();
      }
    }
  },

  connect() {
    const digits = ['cd1','cd2','cd3','cd4','cd5','cd6'].map(id => document.getElementById(id).value.trim().toUpperCase());
    const code = digits.join('');
    const msgEl = document.getElementById('connect-msg');

    if (code.length < 6) {
      this._showMsg(msgEl, 'error', 'Please enter the complete 6-digit code.');
      return;
    }

    const codes = JSON.parse(localStorage.getItem('sm_codes') || '{}');
    const session = Auth.getSession();

    // Check code exists and is not expired (10 min)
    if (!codes[code]) {
      this._showMsg(msgEl, 'error', '❌ Invalid code. Please check and try again.');
      return;
    }
    if (Date.now() - codes[code].ts > 600000) {
      this._showMsg(msgEl, 'error', '⏰ This code has expired. Ask your partner to generate a new one.');
      return;
    }
    if (codes[code].uid === session.uid) {
      this._showMsg(msgEl, 'error', '⚠️ You cannot connect with yourself.');
      return;
    }

    // Connect!
    const partner = codes[code];
    const conn = { partnerUid: partner.uid, partnerName: partner.name, connectedAt: Date.now() };
    localStorage.setItem('sm_connection_' + session.uid, JSON.stringify(conn));

    this._cleanup(code);
    this._showMsg(msgEl, 'success', `💞 Connected with ${partner.name}!`);
    setTimeout(() => this._showConnectedState(partner.name), 800);
    App.showToast(`Connected with ${partner.name}! 💑`);
  },

  _showConnectedState(name) {
    document.getElementById('connected-state').classList.remove('hidden');
    document.getElementById('cp-name').textContent = name;
    this._updateSidebarBanner(name);
    Dashboard.refreshPartnerState();
  },

  getConnection() {
    const session = Auth.getSession();
    if (!session) return null;
    return JSON.parse(localStorage.getItem('sm_connection_' + session.uid) || 'null');
  },

  disconnect() {
    const session = Auth.getSession();
    if (!session) return;
    localStorage.removeItem('sm_connection_' + session.uid);
    document.getElementById('connected-state').classList.add('hidden');
    this._updateSidebarBanner(null);
    Dashboard.refreshPartnerState();
    App.showToast('Disconnected from partner.');
  },

  _updateSidebarBanner(name) {
    const banner = document.getElementById('partner-banner');
    const title  = document.getElementById('pb-title');
    const sub    = document.getElementById('pb-sub');
    if (name) {
      title.textContent = name;
      sub.textContent = 'Connected ✓';
      banner.classList.add('connected');
    } else {
      title.textContent = 'Not Connected';
      sub.textContent = 'Connect with partner';
      banner.classList.remove('connected');
    }
  },

  _cleanup(code) {
    const codes = JSON.parse(localStorage.getItem('sm_codes') || '{}');
    delete codes[code];
    localStorage.setItem('sm_codes', JSON.stringify(codes));
  },

  _showMsg(el, type, text) {
    el.textContent = text;
    el.className = 'connect-msg ' + type;
    el.classList.remove('hidden');
  },

  load() {
    const conn = this.getConnection();
    if (conn) {
      this._showConnectedState(conn.partnerName);
    }
  }
};
