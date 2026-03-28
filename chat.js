/* ============================================
   chat.js — WhatsApp-style Chat Logic
============================================ */
const Chat = {
  _msgs: [],
  _typingTimeout: null,
  _emojiOpen: false,
  _searchOpen: false,
  _emojis: ['😀','😂','😍','🥰','😘','❤️','🔥','✨','🎉','👍','🙏','😊','🤗','😎','🥳','💯','🌹','💖','💕','🫶','😢','😅','🤔','👋','🎶','💋','🌙','⭐','🍀','🦋','💌','🔐','🥂','🎁','💑','🌈'],

  init() {
    this._loadMessages();
    this._renderAll();
    this._buildEmojiPicker();
    this._scrollBottom();
  },

  _key() {
    const session = Auth.getSession();
    const conn    = Partner.getConnection();
    if (!session || !conn) return null;
    const ids = [session.uid, conn.partnerUid].sort();
    return 'sm_chat_' + ids.join('_');
  },

  _loadMessages() {
    const key = this._key();
    if (!key) return;
    this._msgs = JSON.parse(localStorage.getItem(key) || '[]');
    if (this._msgs.length === 0) this._seedDemo();
  },

  _seedDemo() {
    const session = Auth.getSession();
    const conn    = Partner.getConnection();
    if (!session || !conn) return;
    const now = Date.now();
    this._msgs = [
      { id: 1, from: conn.partnerUid, text: 'Hey! 👋 Finally on Secure Messaging!', ts: now - 3600000, type: 'text', read: true },
      { id: 2, from: session.uid, text: 'Yes! 🎉 Our chats are end-to-end encrypted now 🔐', ts: now - 3540000, type: 'text', read: true },
      { id: 3, from: conn.partnerUid, text: 'I love it ❤️ No one can read our messages!', ts: now - 3480000, type: 'text', read: true },
      { id: 4, from: session.uid, text: 'Exactly 💕 This is just for us', ts: now - 60000, type: 'text', read: true },
    ];
    this._save();
  },

  _save() {
    const key = this._key();
    if (key) localStorage.setItem(key, JSON.stringify(this._msgs));
  },

  _renderAll() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    // System message
    const sys = document.createElement('div');
    sys.className = 'sys-msg';
    sys.innerHTML = '<span>🔒 Messages are end-to-end encrypted. Only you and your partner can read them.</span>';
    container.appendChild(sys);

    let lastDate = null;
    this._msgs.forEach(m => {
      const d = new Date(m.ts).toDateString();
      if (d !== lastDate) {
        lastDate = d;
        container.appendChild(this._dateDivider(d));
      }
      container.appendChild(this._buildBubble(m));
    });
  },

  _dateDivider(label) {
    const el = document.createElement('div');
    el.className = 'date-divider';
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    el.textContent = label === today ? 'Today' : label === yesterday ? 'Yesterday' : label;
    return el;
  },

  _buildBubble(msg) {
    const session = Auth.getSession();
    const isSent  = msg.from === session.uid;
    const row = document.createElement('div');
    row.className = 'msg-row ' + (isSent ? 'sent' : 'received');
    row.dataset.id = msg.id;

    const conn = Partner.getConnection();
    const partnerInitial = conn ? conn.partnerName[0].toUpperCase() : '?';
    const myInitial = session.name[0].toUpperCase();

    const av = document.createElement('div');
    av.className = 'msg-av';
    av.textContent = isSent ? myInitial : partnerInitial;

    const bubble = document.createElement('div');
    if (msg.type === 'image') {
      bubble.className = 'bubble media-bubble';
      bubble.innerHTML = `<img src="${msg.src}" alt="Photo" loading="lazy">`;
    } else if (msg.type === 'video') {
      bubble.className = 'bubble media-bubble';
      bubble.innerHTML = `<video src="${msg.src}" controls preload="metadata"></video>`;
    } else {
      bubble.className = 'bubble';
      bubble.textContent = msg.text;
    }

    const time = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    meta.innerHTML = `<span>${time}</span>` + (isSent ? `<span class="read-tick ${msg.read ? 'read' : ''}">✓✓</span>` : '');

    const wrap = document.createElement('div');
    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    row.appendChild(av);
    row.appendChild(wrap);
    return row;
  },

  send() {
    const input = document.getElementById('msg-input');
    const text  = input.textContent.trim();
    if (!text) return;

    const session = Auth.getSession();
    const msg = {
      id: Date.now(),
      from: session.uid,
      text,
      ts: Date.now(),
      type: 'text',
      read: false
    };
    this._msgs.push(msg);
    this._save();

    const container = document.getElementById('chat-messages');
    const d = new Date(msg.ts).toDateString();
    const lastItems = container.querySelectorAll('.date-divider');
    const lastDiv = lastItems[lastItems.length - 1];
    if (!lastDiv || lastDiv.textContent !== 'Today') container.appendChild(this._dateDivider(d));
    container.appendChild(this._buildBubble(msg));

    input.textContent = '';
    input.dispatchEvent(new Event('input'));
    this._scrollBottom();

    // Simulate partner "read" after 1.5s
    setTimeout(() => {
      msg.read = true;
      this._save();
      const row = container.querySelector(`[data-id="${msg.id}"] .read-tick`);
      if (row) row.classList.add('read');
    }, 1500);

    // Simulate reply after 3-6s
    this._simulateReply();
  },

  _simulateReply() {
    const conn = Partner.getConnection();
    if (!conn) return;
    const replies = [
      '❤️', '😊', 'I love you!', 'Miss you 💕', 'Aww 🥰', 'Yes!', 'Haha 😂', '💋', 'You too! 😘', '✨✨'
    ];
    const delay = 3000 + Math.random() * 4000;

    // Show typing indicator
    setTimeout(() => {
      const container = document.getElementById('chat-messages');
      const ti = document.createElement('div');
      ti.className = 'typing-indicator';
      ti.id = 'typing-ind';
      const initial = conn.partnerName[0].toUpperCase();
      ti.innerHTML = `<div class="msg-av">${initial}</div><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
      container.appendChild(ti);
      this._scrollBottom();

      setTimeout(() => {
        ti.remove();
        const msg = {
          id: Date.now(),
          from: conn.partnerUid,
          text: replies[Math.floor(Math.random() * replies.length)],
          ts: Date.now(),
          type: 'text',
          read: true
        };
        this._msgs.push(msg);
        this._save();
        container.appendChild(this._buildBubble(msg));
        this._scrollBottom();
      }, 1500);
    }, delay);
  },

  uploadMedia(input) {
    const file = input.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video');
    const reader  = new FileReader();
    reader.onload = (e) => {
      const session = Auth.getSession();
      const msg = {
        id: Date.now(),
        from: session.uid,
        type: isVideo ? 'video' : 'image',
        src: e.target.result,
        ts: Date.now(),
        read: false
      };
      this._msgs.push(msg);
      this._save();
      const container = document.getElementById('chat-messages');
      container.appendChild(this._buildBubble(msg));
      this._scrollBottom();
      App.showToast(isVideo ? '🎥 Video sent' : '📷 Photo sent');
    };
    reader.readAsDataURL(file);
    input.value = '';
  },

  keydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  },

  typing() {
    clearTimeout(this._typingTimeout);
  },

  toggleEmoji() {
    this._emojiOpen = !this._emojiOpen;
    document.getElementById('emoji-picker').classList.toggle('hidden', !this._emojiOpen);
  },

  _buildEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    this._emojis.forEach(em => {
      const span = document.createElement('span');
      span.textContent = em;
      span.onclick = () => {
        const input = document.getElementById('msg-input');
        input.textContent += em;
        input.focus();
        this.toggleEmoji();
      };
      picker.appendChild(span);
    });
  },

  toggleSearch() {
    this._searchOpen = !this._searchOpen;
    document.getElementById('chat-search').classList.toggle('hidden', !this._searchOpen);
    if (this._searchOpen) document.getElementById('search-input').focus();
    else { document.getElementById('search-input').value = ''; this.search(''); }
  },

  search(query) {
    const rows = document.querySelectorAll('.msg-row');
    rows.forEach(row => {
      const bubble = row.querySelector('.bubble');
      if (!bubble) return;
      const text = bubble.textContent;
      if (!query || text.toLowerCase().includes(query.toLowerCase())) {
        row.style.display = '';
        if (query) {
          bubble.innerHTML = text.replace(new RegExp(query, 'gi'), m => `<span class="highlight">${m}</span>`);
        }
      } else {
        row.style.display = 'none';
      }
    });
  },

  _scrollBottom() {
    const el = document.getElementById('chat-messages');
    if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
  }
};
