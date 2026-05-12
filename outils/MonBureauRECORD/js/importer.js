/* MonBureauRECORD — Import fichier */
const Importer = {
  _objectUrl: null,

  validate(file) {
    if (!file) return { ok: false, error: 'Aucun fichier sélectionné.' };
    const ext = Utils.fileExt(file.name);
    if (!CONFIG.ACCEPTED_EXT.includes(ext)) {
      return {
        ok: false,
        error: `Format non supporté : .${ext}.\nFormats acceptés : ${CONFIG.ACCEPTED_EXT.join(', ')}`,
      };
    }
    if (file.size === 0) {
      return { ok: false, error: 'Fichier vide.' };
    }
    return { ok: true, ext };
  },

  load(file) {
    const v = this.validate(file);
    if (!v.ok) {
      UI.toast(v.error, 'error', 6000);
      return false;
    }

    if (this._objectUrl) URL.revokeObjectURL(this._objectUrl);
    this._objectUrl = URL.createObjectURL(file);

    Session.create('import', file);
    State.set({ importedFile: file, importedUrl: this._objectUrl, mode: 'import' });

    UI.renderImportPreview(file, this._objectUrl, v.ext);
    UI.toast(`Fichier chargé : ${file.name}`, 'success');
    return true;
  },

  takeScreenshot() {
    const video = document.getElementById('importPlayer');
    if (!video || video.tagName !== 'VIDEO') {
      UI.toast('Capture disponible uniquement pour les vidéos.', 'warning');
      return null;
    }
    if (!video.videoWidth) {
      UI.toast('Lecture en attente — démarrez la lecture une fois.', 'warning');
      return null;
    }
    const dataUrl = Utils.snapshotVideo(video, CONFIG.PDF_QUALITY);
    if (!dataUrl) return null;
    const t = video.currentTime;
    const shot = Session.addScreenshot(dataUrl, t);
    UI.addShotToImport(shot);
    UI.updateStats();
    return shot;
  },

  addMarkerAtCurrent(label = '') {
    const player = document.getElementById('importPlayer');
    const t = player ? player.currentTime : 0;
    const m = Session.addMarker(t, label);
    UI.refreshMarkers();
    UI.updateStats();
    return m;
  },
};
