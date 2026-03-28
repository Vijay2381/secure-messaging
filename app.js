/* ============================================
   app.js — Router, Dashboard, Particles
============================================ */
const App = {
  _views: ['landing','signup','login','dashboard'],

  init() {
    // Fade out loading screen
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('fade-out');
      // Check session
      const session = Auth.getSession();
      if (session) {
        this.navigate('dashboard');
      } else {
        this.navigate('landing');
      }
      // Init particles on landing
      this._initParticles();
    }, 1800);
  },

  navigate(view) {
    this._views.forEach(v => {
      const el = document.getElementById('view-' + v);
      if (el) el.classList.add('hidden');
    });
    const target = document.getElementById('view-' + view);
    if (target) target.classList.remove('hidden');

    if (view === 'dashboard') {
      this._initDashboard();
    }
  },

  _initDashboard() {
    const session = Auth.getSession();
    if (!session) { this.navigate('login'); return; }

    // Set user info in sidebar
    const nameEl = document.getElementById('sb-name');
    const avEl   = document.getElementById('sb-avatar');
    if (nameEl) nameEl.textContent = session.name;
    if (avEl)   avEl.textContent   = session.name[0].toUpperCase();

    // Load partner state
    Partner.load();
    Dashboard.refreshPartnerState();
    Dashboard.show('connect');
    Calls.renderCallHistory();
  },

  showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    msgEl.textContent = msg;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, duration);
  },

  _initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.5 + 0.2),
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '124,58,237' : '236,72,153'
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }
};

// ============================================
// Dashboard — Panel management
// ============================================
const Dashboard = {
  _current: 'connect',
  _mobileOpen: false,

  show(panel) {
    const panels = ['connect','chats','calls','video'];
    panels.forEach(p => {
      const el = document.getElementById('panel-' + p);
      if (el) el.classList.toggle('hidden', p !== panel);
      const nav = document.getElementById('nav-' + p);
      if (nav) nav.classList.toggle('active', p === panel);
    });
    this._current = panel;
    this.closeMobile();

    if (panel === 'chats') this._refreshChat();
    if (panel === 'calls') this._refreshCalls();
    if (panel === 'video') this._refreshVideo();
    if (panel === 'connect') this._refreshConnect();
  },

  _refreshConnect() {
    const conn = Partner.getConnection();
    const cs   = document.getElementById('connected-state');
    if (conn) {
      cs.classList.remove('hidden');
      document.getElementById('cp-name').textContent = conn.partnerName;
    } else {
      cs.classList.add('hidden');
    }
  },

  _refreshChat() {
    const conn   = Partner.getConnection();
    const noPart = document.getElementById('chats-np');
    const chatUI = document.getElementById('chat-ui');
    if (!conn) {
      noPart.classList.remove('hidden');
      chatUI.classList.add('hidden');
      return;
    }
    noPart.classList.add('hidden');
    chatUI.classList.remove('hidden');

    // Set partner info in chat header
    document.getElementById('chat-av').textContent   = conn.partnerName[0].toUpperCase();
    document.getElementById('chat-pname').textContent = conn.partnerName;

    Chat.init();
  },

  _refreshCalls() {
    const conn    = Partner.getConnection();
    const noPart  = document.getElementById('calls-np');
    const callsUI = document.getElementById('calls-ui');
    if (!conn) {
      noPart.classList.remove('hidden');
      callsUI.classList.add('hidden');
      return;
    }
    noPart.classList.add('hidden');
    callsUI.classList.remove('hidden');
    document.getElementById('call-av').textContent    = conn.partnerName[0].toUpperCase();
    document.getElementById('call-pname').textContent = conn.partnerName;
    Calls.renderCallHistory();
  },

  _refreshVideo() {
    const conn    = Partner.getConnection();
    const noPart  = document.getElementById('video-np');
    const videoUI = document.getElementById('video-ui');
    if (!conn) {
      noPart.classList.remove('hidden');
      videoUI.classList.add('hidden');
      return;
    }
    noPart.classList.add('hidden');
    videoUI.classList.remove('hidden');
    document.getElementById('video-av').textContent    = conn.partnerName[0].toUpperCase();
    document.getElementById('video-pname').textContent = conn.partnerName;
    Calls.renderCallHistory();
  },

  refreshPartnerState() {
    const conn = Partner.getConnection();
    const banner = document.getElementById('partner-banner');
    const pbTitle = document.getElementById('pb-title');
    const pbSub   = document.getElementById('pb-sub');
    if (conn) {
      pbTitle.textContent = conn.partnerName;
      pbSub.textContent   = '💑 Connected';
      banner.classList.add('connected');
    } else {
      pbTitle.textContent = 'Not Connected';
      pbSub.textContent   = 'Connect with partner';
      banner.classList.remove('connected');
    }
    // Refresh current panel if needed
    if (this._current !== 'connect') this.show(this._current);
  },

  toggleMobile() {
    this._mobileOpen = !this._mobileOpen;
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sb-overlay');
    sidebar.classList.toggle('mobile-open', this._mobileOpen);
    overlay.classList.toggle('hidden', !this._mobileOpen);
  },

  closeMobile() {
    this._mobileOpen = false;
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sb-overlay').classList.add('hidden');
  }
};

// ============================================
// Boot
// ============================================
document.addEventListener('DOMContentLoaded', () => App.init());

// Close emoji picker/search on outside click
document.addEventListener('click', (e) => {
  const picker  = document.getElementById('emoji-picker');
  const emojiBtn = document.querySelector('.ci-btn[onclick*="toggleEmoji"]');
  if (picker && !picker.classList.contains('hidden') && !picker.contains(e.target) && e.target !== emojiBtn) {
    picker.classList.add('hidden');
    Chat._emojiOpen = false;
  }
});
