/* MonBureauRECORD — Utilitaires */
const Utils = {
  pad(n, len = 2) { return String(n).padStart(len, '0'); },

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00:00';
    seconds = Math.floor(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
  },

  formatDurationShort(seconds) {
    if (!seconds || isNaN(seconds)) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h${this.pad(m)}`;
    if (m > 0) return `${m}min`;
    return `${Math.floor(seconds)}s`;
  },

  formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  },

  formatDateTime(date = new Date()) {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  },

  slugDate(date = new Date()) {
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace(/[T:]/g, '-');
  },

  slug(str) {
    return String(str || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 60) || 'session';
  },

  fileExt(filename) {
    return String(filename || '').split('.').pop().toLowerCase();
  },

  isVideoExt(ext) {
    return ['webm','mp4','mov','mkv','avi'].includes(ext);
  },

  isAudioExt(ext) {
    return ['mp3','wav','m4a','aac','ogg','flac','opus'].includes(ext);
  },

  parseTimecode(str) {
    if (!str) return 0;
    const parts = String(str).trim().split(':').map(p => parseFloat(p) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseFloat(str) || 0;
  },

  getSupportedMime() {
    if (typeof MediaRecorder === 'undefined') return null;
    for (const t of CONFIG.PREFERRED_MIME_TYPES) {
      try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
    }
    return 'video/webm';
  },

  generateSessionId() {
    return 'mbc-' + this.slugDate() + '-' + Math.random().toString(36).slice(2, 6);
  },

  download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
  },

  downloadText(content, filename, mime = 'text/plain;charset=utf-8') {
    this.download(new Blob([content], { type: mime }), filename);
  },

  escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    return Promise.resolve();
  },

  // Snapshot d'un élément vidéo dans un canvas → dataURL JPEG
  snapshotVideo(videoEl, quality = 0.85) {
    if (!videoEl?.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  },

  dataUrlToBlob(dataUrl) {
    const [header, b64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const bin = atob(b64);
    const len = bin.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  },

  uid() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },

  debounce(fn, ms = 250) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  },
};
