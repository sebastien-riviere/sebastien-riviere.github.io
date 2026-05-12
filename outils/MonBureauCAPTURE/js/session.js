/* MonBureauCAPTURE — Session média */
const Session = {
  create(mode, file = null) {
    const id = Utils.generateSessionId();
    const session = {
      id,
      mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: file ? file.name.replace(/\.[^.]+$/, '') : `Session du ${Utils.formatDateTime()}`,
      file: file ? {
        name: file.name,
        size: file.size,
        type: file.type,
        ext: Utils.fileExt(file.name),
      } : null,
      duration: 0,
      segments: [],
      screenshots: [],
      markers: [],
      notes: '',
      tags: [],
    };
    State.set({ session, canExport: false });
    Storage.save(session).catch(() => {});
    return session;
  },

  current() { return State.get('session'); },

  setTitle(title) {
    const s = this.current(); if (!s) return;
    s.title = (title || '').trim() || s.title;
    State.set({ session: s }); Storage.save(s);
  },

  setDuration(seconds) {
    const s = this.current(); if (!s) return;
    s.duration = seconds;
    State.set({ session: s }); Storage.save(s);
  },

  setNotes(notes) {
    const s = this.current(); if (!s) return;
    s.notes = notes || '';
    State.set({ session: s });
    this._scheduleSave();
  },

  _saveTimer: null,
  _scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => Storage.save(this.current()), 600);
  },

  addMarker(time, label = '') {
    const s = this.current(); if (!s) return null;
    const m = {
      id: Utils.uid(),
      time: Math.max(0, time || 0),
      timeFormatted: Utils.formatDuration(time || 0),
      label: label || `Marqueur ${s.markers.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    s.markers.push(m);
    s.markers.sort((a, b) => a.time - b.time);
    State.set({ session: s }); Storage.save(s);
    return m;
  },

  updateMarker(id, patch) {
    const s = this.current(); if (!s) return;
    const m = s.markers.find(x => x.id === id);
    if (!m) return;
    Object.assign(m, patch);
    if (patch.time !== undefined) m.timeFormatted = Utils.formatDuration(patch.time);
    s.markers.sort((a, b) => a.time - b.time);
    State.set({ session: s }); Storage.save(s);
  },

  removeMarker(id) {
    const s = this.current(); if (!s) return;
    s.markers = s.markers.filter(m => m.id !== id);
    State.set({ session: s }); Storage.save(s);
  },

  addScreenshot(dataUrl, time, label = '') {
    const s = this.current(); if (!s) return null;
    const shot = {
      id: Utils.uid(),
      dataUrl,
      time: Math.max(0, time || 0),
      timeFormatted: Utils.formatDuration(time || 0),
      label: label || `Capture ${s.screenshots.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    s.screenshots.push(shot);
    State.set({ session: s, canExport: true });
    Storage.save(s);
    return shot;
  },

  updateScreenshot(id, patch) {
    const s = this.current(); if (!s) return;
    const shot = s.screenshots.find(x => x.id === id);
    if (!shot) return;
    Object.assign(shot, patch);
    State.set({ session: s }); Storage.save(s);
  },

  removeScreenshot(id) {
    const s = this.current(); if (!s) return;
    s.screenshots = s.screenshots.filter(x => x.id !== id);
    State.set({ session: s, canExport: s.screenshots.length > 0 || s.segments.length > 0 });
    Storage.save(s);
  },

  addSegment(blob, index, duration) {
    const s = this.current(); if (!s) return null;
    const seg = {
      index,
      blob,
      size: blob.size,
      duration,
      filename: `segment_${Utils.pad(index + 1)}.webm`,
    };
    s.segments.push(seg);
    State.set({ session: s, canExport: true });
    return seg;
  },
};
