/* ============================================
   calls.js — Voice & Video Call UI Logic
============================================ */
const Calls = {
  _callTimer: null,
  _secs: 0,
  _muted: false,
  _speaker: true,
  _camOff: false,
  _vmuted: false,
  _sharing: false,

  startCall() {
    const conn = Partner.getConnection();
    if (!conn) { App.showToast('Connect with your partner first!'); return; }

    const overlay = document.getElementById('call-overlay');
    document.getElementById('call-ov-av').textContent = conn.partnerName[0].toUpperCase();
    document.getElementById('call-ov-name').textContent = conn.partnerName;
    document.getElementById('call-ov-status').textContent = 'Calling...';
    document.getElementById('call-dur').classList.add('hidden');
    document.getElementById('mute-icon').textContent = '🎤';
    document.getElementById('spk-icon').textContent = '🔊';
    this._muted = false;
    this._speaker = true;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Simulate connecting after 2s
    setTimeout(() => {
      document.getElementById('call-ov-status').textContent = 'Connected';
      document.getElementById('call-dur').classList.remove('hidden');
      this._secs = 0;
      clearInterval(this._callTimer);
      this._callTimer = setInterval(() => {
        this._secs++;
        document.getElementById('call-dur').textContent = this._formatTime(this._secs);
      }, 1000);
    }, 2000);
  },

  endCall() {
    clearInterval(this._callTimer);
    const dur = this._secs;
    document.getElementById('call-overlay').classList.add('hidden');
    document.body.style.overflow = '';
    this._addCallHistory('voice', dur);
    this._secs = 0;
    if (dur > 0) App.showToast('Call ended · ' + this._formatTime(dur));
    else App.showToast('Call cancelled');
    Calls.renderCallHistory();
  },

  startVideo() {
    const conn = Partner.getConnection();
    if (!conn) { App.showToast('Connect with your partner first!'); return; }

    const overlay = document.getElementById('video-overlay');
    document.getElementById('rv-av').textContent = conn.partnerName[0].toUpperCase();
    document.getElementById('rv-name').textContent = conn.partnerName;
    document.getElementById('vo-name').textContent = conn.partnerName;
    document.getElementById('vo-status').textContent = 'Connecting...';
    document.getElementById('vo-dur').textContent = '00:00';
    document.getElementById('vm-icon').textContent = '🎤';
    document.getElementById('vc-icon').textContent = '📷';
    this._vmuted = false;
    this._camOff = false;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      document.getElementById('vo-status').textContent = '';
      this._secs = 0;
      clearInterval(this._callTimer);
      this._callTimer = setInterval(() => {
        this._secs++;
        document.getElementById('vo-dur').textContent = this._formatTime(this._secs);
      }, 1000);
    }, 2500);
  },

  endVideo() {
    clearInterval(this._callTimer);
    const dur = this._secs;
    document.getElementById('video-overlay').classList.add('hidden');
    document.body.style.overflow = '';
    this._addCallHistory('video', dur);
    this._secs = 0;
    if (dur > 0) App.showToast('Video call ended · ' + this._formatTime(dur));
    else App.showToast('Video call cancelled');
    Calls.renderCallHistory();
  },

  toggleMute() {
    this._muted = !this._muted;
    const btn  = document.getElementById('mute-btn');
    const icon = document.getElementById('mute-icon');
    icon.textContent = this._muted ? '🔇' : '🎤';
    btn.classList.toggle('active-mute', this._muted);
    App.showToast(this._muted ? 'Microphone muted' : 'Microphone on');
  },

  toggleSpeaker() {
    this._speaker = !this._speaker;
    document.getElementById('spk-icon').textContent = this._speaker ? '🔊' : '🔈';
    App.showToast(this._speaker ? 'Speaker on' : 'Speaker off');
  },

  toggleVMute() {
    this._vmuted = !this._vmuted;
    const btn  = document.getElementById('vm-btn');
    const icon = document.getElementById('vm-icon');
    icon.textContent = this._vmuted ? '🔇' : '🎤';
    btn.classList.toggle('off', this._vmuted);
    App.showToast(this._vmuted ? 'Microphone muted' : 'Microphone on');
  },

  toggleCam() {
    this._camOff = !this._camOff;
    const btn  = document.getElementById('vc-btn');
    const icon = document.getElementById('vc-icon');
    icon.textContent = this._camOff ? '📵' : '📷';
    btn.classList.toggle('off', this._camOff);
    const lv = document.getElementById('lv-label');
    if (lv) lv.textContent = this._camOff ? 'Camera off' : 'You';
    App.showToast(this._camOff ? 'Camera off' : 'Camera on');
  },

  shareScreen() {
    this._sharing = !this._sharing;
    document.getElementById('ss-icon').textContent = this._sharing ? '🖥️' : '🖥';
    App.showToast(this._sharing ? 'Screen sharing started' : 'Screen sharing stopped');
  },

  _addCallHistory(type, dur) {
    const session = Auth.getSession();
    const conn    = Partner.getConnection();
    if (!session || !conn) return;
    const key     = 'sm_callhistory_' + session.uid;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.unshift({ type, dur, partnerName: conn.partnerName, ts: Date.now(), missed: dur === 0 });
    if (history.length > 50) history.pop();
    localStorage.setItem(key, JSON.stringify(history));
  },

  renderCallHistory() {
    const session = Auth.getSession();
    if (!session) return;
    const key     = 'sm_callhistory_' + session.uid;
    const history = JSON.parse(localStorage.getItem(key) || '[]');

    const voiceEl = document.getElementById('calls-list');
    const videoEl = document.getElementById('video-list');
    if (!voiceEl || !videoEl) return;

    const voiceCalls = history.filter(h => h.type === 'voice');
    const videoCalls = history.filter(h => h.type === 'video');

    voiceEl.innerHTML = voiceCalls.length ? '' : '<div class="empty-history">No calls yet. Make your first call! 📞</div>';
    videoEl.innerHTML = videoCalls.length ? '' : '<div class="empty-history">No video calls yet. Start one! 🎥</div>';

    voiceCalls.forEach(c => voiceEl.appendChild(this._historyItem(c)));
    videoCalls.forEach(c => videoEl.appendChild(this._historyItem(c)));
  },

  _historyItem(c) {
    const el   = document.createElement('div');
    el.className = 'history-item';
    const icon = c.type === 'video' ? '🎥' : (c.missed ? '📵' : '📞');
    const time = new Date(c.ts).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    el.innerHTML = `
      <div class="hi-icon ${c.missed ? 'missed' : ''}">${icon}</div>
      <div class="hi-info">
        <div class="hi-name">${c.partnerName}</div>
        <div class="hi-details ${c.missed ? 'missed' : ''}">${c.missed ? 'Missed' : 'Outgoing'} ${c.type === 'video' ? 'video ' : ''}call</div>
      </div>
      <div>
        <div class="hi-time">${time}</div>
        ${!c.missed ? `<div class="hi-dur">${this._formatTime(c.dur)}</div>` : ''}
      </div>`;
    return el;
  },

  _formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2,'0');
    const s = String(secs % 60).padStart(2,'0');
    return `${m}:${s}`;
  }
};
