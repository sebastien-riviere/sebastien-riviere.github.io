/* MonBureauCAPTURE — Captures utilities */
const Shots = {
  remove(id) {
    Session.removeScreenshot(id);
    UI.refreshShots();
    UI.updateStats();
    UI.toast('Capture supprimée', 'info', 1800);
  },

  rename(id, label) {
    if (!label || !label.trim()) return;
    Session.updateScreenshot(id, { label: label.trim().slice(0, 80) });
    UI.refreshShots();
  },

  downloadOne(id) {
    const s = Session.current(); if (!s) return;
    const idx = s.screenshots.findIndex(x => x.id === id);
    if (idx < 0) return;
    const sh = s.screenshots[idx];
    const blob = Utils.dataUrlToBlob(sh.dataUrl);
    Utils.download(blob, `capture_${Utils.pad(idx + 1)}_${sh.timeFormatted.replace(/:/g, '-')}.jpg`);
  },

  downloadAll() {
    const s = Session.current(); if (!s) return;
    if (!s.screenshots.length) return UI.toast('Aucune capture', 'warning');
    s.screenshots.forEach((sh, i) => {
      setTimeout(() => {
        const blob = Utils.dataUrlToBlob(sh.dataUrl);
        Utils.download(blob, `capture_${Utils.pad(i + 1)}_${sh.timeFormatted.replace(/:/g, '-')}.jpg`);
      }, i * 200);
    });
    UI.toast(`${s.screenshots.length} captures en téléchargement`, 'success');
  },

  // Déduplication par hash léger
  dedupe() {
    const s = Session.current(); if (!s) return;
    const seen = new Map();
    const before = s.screenshots.length;
    const kept = [];
    s.screenshots.forEach(sh => {
      const h = this._hash(sh.dataUrl);
      if (seen.has(h)) return;
      seen.set(h, true);
      kept.push(sh);
    });
    s.screenshots = kept;
    State.set({ session: s, canExport: kept.length > 0 || s.segments.length > 0 });
    Storage.save(s);
    UI.refreshShots();
    UI.updateStats();
    const removed = before - kept.length;
    UI.toast(removed > 0 ? `${removed} doublon(s) supprimé(s)` : 'Aucun doublon détecté', removed > 0 ? 'success' : 'info');
  },

  _hash(dataUrl) {
    const sample = dataUrl.slice(40, 240) + dataUrl.slice(-200);
    let h = 0;
    for (let i = 0; i < sample.length; i++) {
      h = ((h << 5) - h) + sample.charCodeAt(i);
      h |= 0;
    }
    return h;
  },
};

const Markers = {
  add(timeStr, label) {
    const time = Utils.parseTimecode(timeStr);
    if (time < 0) return UI.toast('Timecode invalide', 'warning');
    Session.addMarker(time, label);
    UI.refreshMarkers();
    UI.updateStats();
    UI.toast('Marqueur ajouté', 'success', 1500);
  },

  remove(id) {
    Session.removeMarker(id);
    UI.refreshMarkers();
    UI.updateStats();
  },

  rename(id, label) {
    if (!label || !label.trim()) return;
    Session.updateMarker(id, { label: label.trim().slice(0, 100) });
    UI.refreshMarkers();
  },

  jumpTo(time) {
    const player = document.getElementById('importPlayer');
    if (player && player.tagName === 'VIDEO' || player?.tagName === 'AUDIO') {
      player.currentTime = time;
      player.play().catch(() => {});
      player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
};

const Segments = {
  download(idx) {
    const s = Session.current(); if (!s) return;
    const seg = s.segments[idx];
    if (!seg) return;
    Utils.download(seg.blob, seg.filename);
    UI.toast(`Segment ${idx + 1} téléchargé`, 'success');
  },

  downloadAll() {
    const s = Session.current(); if (!s) return;
    if (!s.segments.length) return UI.toast('Aucun segment', 'warning');
    s.segments.forEach((seg, i) => {
      setTimeout(() => Utils.download(seg.blob, seg.filename), i * 400);
    });
    UI.toast(`${s.segments.length} segment(s) en téléchargement`, 'success');
  },
};
