/* MonBureauRECORD — Main controller */
const App = {
  init() {
    this._bindNavigation();
    this._bindHomePage();
    this._bindCapturePage();
    this._bindCockpit();
    this._bindImportPage();
    this._bindPostprocess();
    this._bindKeyboardShortcuts();
    this._bindLightbox();
    this._bindMobileMenu();
    this._loadPreferences();
    this._loadSavedSessions();
    this._bindSaveOnBeforeUnload();

    UI.updateNavCounters();
    UI.goto('home');

    console.log(`${CONFIG.APP_NAME} v${CONFIG.VERSION} — local-first, no upload, no AI.`);
  },

  // ──────────────────────────────────────────────────
  //  Navigation
  // ──────────────────────────────────────────────────
  _bindNavigation() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        const page = el.dataset.page;
        if (!page || el.disabled) return;
        e.preventDefault();
        UI.goto(page);
      });
    });
  },

  // ──────────────────────────────────────────────────
  //  Home (mode picker)
  // ──────────────────────────────────────────────────
  _bindHomePage() {
    document.getElementById('modeCapture')?.addEventListener('click', () => UI.goto('capture'));
    document.getElementById('modeImport')?.addEventListener('click', () => UI.goto('import'));
  },

  // ──────────────────────────────────────────────────
  //  Capture page (setup)
  // ──────────────────────────────────────────────────
  _bindCapturePage() {
    const startBtn = document.getElementById('btnStartCapture');
    if (!startBtn) return;

    startBtn.addEventListener('click', async () => {
      const opts = {
        bitrate: document.getElementById('captureBitrate').value,
        segmentMinutes: parseInt(document.getElementById('captureSegment').value, 10),
        withMic: document.getElementById('captureMic').checked,
        autoShot: document.getElementById('captureAutoShot').checked,
        autoShotInterval: parseInt(document.getElementById('captureShotInterval').value, 10),
      };

      // Save prefs
      Prefs.save({
        ...Prefs.load(),
        bitrate: opts.bitrate,
        segmentMinutes: opts.segmentMinutes,
        withMic: opts.withMic,
        autoShot: opts.autoShot,
        autoShotInterval: opts.autoShotInterval,
      });

      try {
        UI.showCockpit();
        const ok = await Recorder.start(opts);
        if (!ok) UI.goto('capture');

        // Attacher le live preview
        const video = document.getElementById('cockpitPreview');
        if (video && Recorder._stream) {
          video.srcObject = Recorder._stream;
          video.muted = true; // pas de larsen
          video.play().catch(() => {});
        }
      } catch (err) {
        UI.toast(err.message, 'error', 6000);
        UI.goto('capture');
      }
    });
  },

  // ──────────────────────────────────────────────────
  //  Cockpit (capture en cours)
  // ──────────────────────────────────────────────────
  _bindCockpit() {
    document.getElementById('btnCockpitStop')?.addEventListener('click', async () => {
      const ok = await Modal.confirm(
        'Arrêter la capture ?',
        'Le segment en cours sera finalisé et vous passerez aux exports.',
        'Arrêter'
      );
      if (ok) Recorder.stop();
    });

    document.getElementById('btnCockpitPause')?.addEventListener('click', () => {
      if (State.get('isPaused')) {
        Recorder.resume();
      } else {
        Recorder.pause();
      }
      this._updatePauseButton();
    });

    document.getElementById('btnCockpitShot')?.addEventListener('click', () => Recorder.takeScreenshot());

    document.getElementById('btnCockpitMarker')?.addEventListener('click', () => {
      const t = State.get('elapsed');
      const m = Session.addMarker(t);
      UI.updateStats();
      UI.toast(`Marqueur à ${m.timeFormatted}`, 'success', 1500);
    });

    document.getElementById('btnCockpitMarkerLabel')?.addEventListener('click', async () => {
      const label = await Modal.prompt('Nom du marqueur', 'Ex: Idée importante');
      if (label !== null) {
        const t = State.get('elapsed');
        const m = Session.addMarker(t, label);
        UI.updateStats();
        UI.toast(`Marqueur "${label}"`, 'success', 1800);
      }
    });

    State.subscribe((s, old) => {
      if (s.isPaused !== old.isPaused) this._updatePauseButton();
    });
  },

  _updatePauseButton() {
    const btn = document.getElementById('btnCockpitPause');
    if (!btn) return;
    const paused = State.get('isPaused');
    btn.innerHTML = paused
      ? `${UI.icon('i-play')}Reprendre`
      : `${UI.icon('i-pause')}Pause`;
    const ind = document.getElementById('cockpitRecIndicator');
    if (ind) {
      ind.querySelector('span:not(.pulse-dot)').textContent = paused ? 'En pause' : 'Enregistrement';
      ind.style.opacity = paused ? '0.6' : '1';
    }
  },

  // ──────────────────────────────────────────────────
  //  Import page (drag & drop)
  // ──────────────────────────────────────────────────
  _bindImportPage() {
    const dz = document.getElementById('dropzone');
    const input = document.getElementById('fileInput');
    if (!dz || !input) return;

    dz.addEventListener('click', () => input.click());

    dz.addEventListener('dragover', e => {
      e.preventDefault();
      dz.classList.add('drag-over');
    });

    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));

    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) Importer.load(file);
    });

    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) Importer.load(file);
      input.value = ''; // reset to allow same file again
    });
  },

  // ──────────────────────────────────────────────────
  //  Postprocess (exports)
  // ──────────────────────────────────────────────────
  _bindPostprocess() {
    // Title editable
    const titleInput = document.getElementById('ppTitle');
    if (titleInput) {
      titleInput.addEventListener('blur', () => Session.setTitle(titleInput.value));
      titleInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); titleInput.blur(); }
      });
    }

    // Notes auto-save
    const notesArea = document.getElementById('ppNotes');
    if (notesArea) {
      notesArea.addEventListener('input', Utils.debounce(() => {
        Session.setNotes(notesArea.value);
      }, 400));
    }

    // Add marker manually
    document.getElementById('btnAddMarker')?.addEventListener('click', () => {
      const tc = document.getElementById('newMarkerTime').value;
      const lbl = document.getElementById('newMarkerLabel').value;
      if (!tc) return UI.toast('Indiquez un timecode', 'warning');
      Markers.add(tc, lbl);
      document.getElementById('newMarkerTime').value = '';
      document.getElementById('newMarkerLabel').value = '';
    });

    // ═══ Export cards (gros boutons) ═══
    const bind = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);

    bind('exportZipMain', () => ZipExport.generate({
      includeSegments: true,
      includeScreenshots: true,
      includeNotebookLM: true,
      includeHtml: true,
    }));
    bind('exportPdfMain', () => PDFExport.generate());
    bind('exportNotebookLMMain', () => NotebookLM.download());
    bind('exportHtmlMain', () => Markdown.downloadHtmlTimeline());

    // ═══ Bannière de sauvegarde ═══
    bind('bannerDownload', () => {
      Segments.downloadAll();
      this._segmentsDownloaded = true;
      this._refreshSaveBanner();
    });

    // ═══ Individual exports (panel replié) ═══
    bind('btnExportTimeline', () => Markdown.downloadTimeline());
    bind('btnExportNotes', () => Markdown.downloadNotes());
    bind('btnExportReadme', () => Markdown.downloadReadme());
    bind('btnExportHtml', () => Markdown.downloadHtmlTimeline());
    bind('btnExportManifest', () => Manifest.download());
    bind('btnExportPdf', () => PDFExport.generate());
    bind('btnExportBat', () => Scripts.downloadBat());
    bind('btnExportSh', () => Scripts.downloadSh());
    bind('btnExportNotebookLM', () => NotebookLM.download());
    bind('btnExportShots', () => Shots.downloadAll());
    bind('btnDedupeShots', () => Shots.dedupe());

    // Segments DL : marquer comme téléchargés pour faire disparaître la bannière
    bind('btnDownloadSegments', () => {
      Segments.downloadAll();
      this._segmentsDownloaded = true;
      this._refreshSaveBanner();
    });

    // ZIP avancé
    bind('btnGenerateZip', () => {
      const opts = {
        includeSegments: document.getElementById('zipSegments').checked,
        includeScreenshots: document.getElementById('zipScreenshots').checked,
        includeNotebookLM: document.getElementById('zipNotebookLM').checked,
        includeHtml: document.getElementById('zipHtml').checked,
      };
      ZipExport.generate(opts).then(() => {
        if (opts.includeSegments) {
          this._segmentsDownloaded = true;
          this._refreshSaveBanner();
        }
      });
    });

    // Reset session
    bind('btnResetSession', async () => {
      const ok = await Modal.confirm(
        'Nouvelle session ?',
        'La session en cours sera remise à zéro. Pensez à exporter vos données avant.',
        'Réinitialiser'
      );
      if (ok) {
        State.reset();
        this._segmentsDownloaded = false;
        UI.goto('home');
        UI.toast('Nouvelle session prête', 'info');
        this._loadSavedSessions();
      }
    });

    // Beforeunload warning si segments non téléchargés
    window.addEventListener('beforeunload', e => {
      const s = Session.current();
      if (State.get('isRecording')) {
        e.preventDefault();
        e.returnValue = 'Une capture est en cours.';
        return e.returnValue;
      }
      if (s?.segments?.length && !this._segmentsDownloaded) {
        e.preventDefault();
        e.returnValue = 'Vos vidéos ne sont pas encore téléchargées.';
        return e.returnValue;
      }
    });
  },

  // Affichage de la bannière selon état segments
  _refreshSaveBanner() {
    const banner = document.getElementById('saveBanner');
    if (!banner) return;
    const s = Session.current();
    const needs = s?.segments?.length > 0 && !this._segmentsDownloaded;
    banner.style.display = needs ? '' : 'none';
  },

  _segmentsDownloaded: false,

  // ──────────────────────────────────────────────────
  //  Keyboard shortcuts
  // ──────────────────────────────────────────────────
  _bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore in form fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && e.target.type !== 'checkbox') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      // Lightbox close
      if (e.key === 'Escape') {
        if (document.getElementById('lightbox')?.classList.contains('show')) {
          Lightbox.close(); return;
        }
        const md = document.getElementById('modalBackdrop');
        if (md?.classList.contains('show')) {
          md.classList.remove('show'); md.innerHTML = ''; return;
        }
      }

      const isRecording = State.get('isRecording');
      const page = State.get('page');

      // Cockpit shortcuts
      if (page === 'cockpit' && isRecording) {
        if (e.key === 's' || e.key === 'S') { e.preventDefault(); Recorder.takeScreenshot(); }
        if (e.key === 'm' || e.key === 'M') { e.preventDefault(); document.getElementById('btnCockpitMarker')?.click(); }
        if (e.code === 'Space') { e.preventDefault(); document.getElementById('btnCockpitPause')?.click(); }
      }

      // Import preview shortcuts
      if (page === 'import-preview') {
        if (e.key === 's' || e.key === 'S') { e.preventDefault(); Importer.takeScreenshot(); }
        if (e.key === 'm' || e.key === 'M') { e.preventDefault(); document.getElementById('btnImportMarker')?.click(); }
      }
    });
  },

  // ──────────────────────────────────────────────────
  //  Lightbox
  // ──────────────────────────────────────────────────
  _bindLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.addEventListener('click', () => Lightbox.close());
  },

  // ──────────────────────────────────────────────────
  //  Mobile menu
  // ──────────────────────────────────────────────────
  _bindMobileMenu() {
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });
  },

  // ──────────────────────────────────────────────────
  //  Preferences load
  // ──────────────────────────────────────────────────
  _loadPreferences() {
    const p = Prefs.load();
    const setIf = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    const checkIf = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.checked = val; };
    setIf('captureBitrate', p.bitrate);
    setIf('captureSegment', p.segmentMinutes);
    setIf('captureShotInterval', p.autoShotInterval);
    checkIf('captureMic', p.withMic);
    checkIf('captureAutoShot', p.autoShot);
  },

  // ──────────────────────────────────────────────────
  //  Saved sessions (IndexedDB)
  // ──────────────────────────────────────────────────
  async _loadSavedSessions() {
    const list = await Storage.list();
    this._renderSavedSessions(list);
  },

  _renderSavedSessions(list) {
    // Home recent
    const home = document.getElementById('homeRecentSessions');
    if (home) {
      if (!list.length) {
        home.innerHTML = `<div class="empty">${UI.icon('i-database')}Aucune session précédente</div>`;
      } else {
        home.innerHTML = list.slice(0, 5).map(s => `
          <div class="segment-row">
            ${UI.icon('i-folder')}
            <strong>${Utils.escapeHtml(s.title)}</strong>
            <span class="seg-meta">${Utils.formatDateTime(s.updatedAt || s.createdAt)} · ${Utils.formatDuration(s.duration || 0)}</span>
            <div class="seg-actions">
              <button class="btn btn-secondary btn-sm" onclick="App.restoreSession('${s.id}')">${UI.icon('i-refresh', 'icon icon-sm')}Reprendre</button>
              <button class="btn btn-ghost btn-icon-only" title="Supprimer" onclick="App.deleteSession('${s.id}')">${UI.icon('i-trash', 'icon icon-sm')}</button>
            </div>
          </div>
        `).join('');
      }
    }

    // Library full
    const lib = document.getElementById('libraryList');
    if (lib) {
      if (!list.length) {
        lib.innerHTML = `<div class="empty">${UI.icon('i-database')}La bibliothèque est vide</div>`;
      } else {
        lib.innerHTML = list.map(s => `
          <div class="segment-row">
            ${UI.icon('i-folder')}
            <strong>${Utils.escapeHtml(s.title)}</strong>
            <span class="seg-meta">
              ${Utils.formatDateTime(s.updatedAt || s.createdAt)}
              · ${Utils.formatDuration(s.duration || 0)}
              · ${s.screenshots?.length || 0} captures
              · ${s.markers?.length || 0} marqueurs
            </span>
            <div class="seg-actions">
              <button class="btn btn-secondary btn-sm" onclick="App.restoreSession('${s.id}')">${UI.icon('i-refresh', 'icon icon-sm')}Reprendre</button>
              <button class="btn btn-ghost btn-icon-only" title="Supprimer" onclick="App.deleteSession('${s.id}')">${UI.icon('i-trash', 'icon icon-sm')}</button>
            </div>
          </div>
        `).join('');
      }
    }
  },

  async restoreSession(id) {
    const s = await Storage.load(id);
    if (!s) return UI.toast('Session introuvable', 'error');
    // Note: les segments WebM ne sont pas conservés en IDB (trop volumineux)
    s.segments = [];
    State.set({ session: s, canExport: (s.screenshots.length + s.markers.length) > 0 });
    UI.toast(`Session "${s.title}" rechargée`, 'success');
    UI.goto('postprocess');
  },

  async deleteSession(id) {
    const ok = await Modal.confirm('Supprimer cette session ?', 'Cette action est irréversible.', 'Supprimer');
    if (!ok) return;
    await Storage.remove(id);
    UI.toast('Session supprimée', 'info');
    this._loadSavedSessions();
  },

  // Save current on close (avoid losing work)
  _bindSaveOnBeforeUnload() {
    // (handled in _bindPostprocess)
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
