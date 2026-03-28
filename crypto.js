/* ============================================
   crypto.js — Web Crypto API utilities
   E2EE simulation for Secure Messaging
============================================ */
const Crypto = {
  // SHA-256 hash (for passwords)
  async hash(text) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  },

  // Derive AES-GCM key from password
  async deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMat = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
      keyMat,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  // Encrypt text → base64 string
  async encrypt(plaintext, key) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    const combined = new Uint8Array(iv.length + buf.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(buf), iv.length);
    return btoa(String.fromCharCode(...combined));
  },

  // Decrypt base64 string → text
  async decrypt(cipherB64, key) {
    try {
      const combined = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const buf = combined.slice(12);
      const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, buf);
      return new TextDecoder().decode(dec);
    } catch { return '[Encrypted message]'; }
  },

  // Generate random 6-char alphanumeric code
  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => chars[b % chars.length]).join('');
  }
};
