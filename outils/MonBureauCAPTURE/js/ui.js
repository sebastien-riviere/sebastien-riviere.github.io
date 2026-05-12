/* MonBureauCAPTURE — UI Manager */
const UI = {
  // ════════════════════════════════════════════════════
  //  HELPER : Icon SVG
  // ════════════════════════════════════════════════════
  icon(name, cls = 'icon') {
    return `<svg class="${cls}"><use href="#${name}"></use></svg>`;
  },

  // ════════════════════════════════════════════════════
  //  TOASTS
  // ════════════════════════════════════════════════════
  toast(msg, type = 'info', duration = 3000) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const iconMap = { success: 'i-check', error: 'i-x', warning: 'i-alert', info: 'i-info' };
    el.innerHTML = `${this.icon(iconMap[type] || 'i-info')}<span>${Utils.escapeHtml(msg)}</span>`;
    c.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  // ════════════════════════════════════════════════════
  //  NAVIGATION
  // ════════════════════════════════════════════════════
  goto(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(`page-${pageName}`);
    if (page) page.classList.add('active');

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${pageName}"]`)?.classList.add('active');

    State.set({ page: pageName });

    // Lazy refresh
    if (pageName === 'postprocess') this.refreshPostprocess();
    if (pageName === 'home') this.updateNavCounters();

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ════════════════════════════════════════════════════
  //  COCKPIT (Capture en cours)
  // ════════════════════════════════════════════════════
  showCockpit() {
    this.goto('cockpit');
    this.updateTimer(0);
    this.updateStats();
    document.getElementById('cockpitShotsGrid').innerHTML = `<div class="empty">${this.icon('i-camera')}Aucune capture pour l'instant</div>`;
  },

  updateTimer(seconds) {
    const t = document.getElementById('cockpitTimer');
    if (t) t.textContent = Utils.formatDuration(seconds);
    const big = document.getElementById('cockpitTimerLarge');
    if (big) big.textContent = Utils.formatDuration(seconds);
  },

  updateStats() {
    const s = Session.current();
    if (!s) return;
    const setIf = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    // Cockpit stats
    setIf('cockpitSegments', s.segments.length);
    setIf('cockpitShots', s.screenshots.length);
    setIf('cockpitMarkers', s.markers.length);

    // Postprocess stats
    setIf('ppDuration', Utils.formatDuration(s.duration));
    setIf('ppShots', s.screenshots.length);
    setIf('ppMarkers', s.markers.length);
    setIf('ppSegments', s.segments.length);

    this.updateNavCounters();
  },

  updateNavCounters() {
    const s = Session.current();
    const hasContent = s && (s.screenshots.length || s.markers.length || s.segments.length || s.notes);
    const ppCounter = document.getElementById('navPpCounter');
    if (ppCounter) {
      if (hasContent) {
        ppCounter.style.display = '';
        ppCounter.textContent = s.screenshots.length + s.markers.length;
      } else {
        ppCounter.style.display = 'none';
      }
    }
    // Sidebar group "Session en cours" : visible only when session active
    const navGroup = document.getElementById('navSessionGroup');
    if (navGroup) navGroup.style.display = s ? '' : 'none';

    // Disable postprocess if no session
    document.querySelectorAll('[data-page="postprocess"]').forEach(b => {
      b.disabled = !s;
    });

    // Show recent sessions on home if any
    Storage.list().then(list => {
      const card = document.getElementById('homeRecentCard');
      if (card) card.style.display = list.length > 0 ? '' : 'none';
    }).catch(() => {});
  },

  updateSegments() {
    this.updateStats();
    this.refreshSegments();
  },

  addShotToCockpit(shot) {
    const grid = document.getElementById('cockpitShotsGrid');
    if (!grid) return;
    if (grid.querySelector('.empty')) grid.innerHTML = '';
    grid.appendChild(this._buildShotCard(shot));
    grid.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // ════════════════════════════════════════════════════
  //  IMPORT
  // ════════════════════════════════════════════════════
  renderImportPreview(file, url, ext) {
    const root = document.getElementById('importPreviewWrap');
    if (!root) return;

    const isVideo = Utils.isVideoExt(ext);
    const isAudio = Utils.isAudioExt(ext);
    const isPlayable = ['webm','mp4','mp3','wav','m4a','ogg','aac'].includes(ext);

    const meta = `
      <div class="card">
        <div class="card-title">${this.icon('i-file')}Fichier chargé</div>
        <div class="kv-list">
          <div class="kv"><span class="kv-key">Fichier</span><span class="kv-val">${Utils.escapeHtml(file.name)}</span></div>
          <div class="kv"><span class="kv-key">Format</span><span class="kv-val">.${ext}</span></div>
          <div class="kv"><span class="kv-key">Taille</span><span class="kv-val">${Utils.formatBytes(file.size)}</span></div>
          <div class="kv"><span class="kv-key">Durée</span><span class="kv-val" id="importDuration">Détection…</span></div>
        </div>
      </div>
    `;

    let player = '';
    if (isPlayable && (isVideo || isAudio)) {
      const tag = isVideo ? 'video' : 'audio';
      const tip = isVideo
        ? 'Lisez le fichier, puis capturez (<span class="kbd">S</span>) ou posez un repère (<span class="kbd">M</span>) aux moments importants.'
        : 'Écoutez le fichier et posez des repères (<span class="kbd">M</span>) sur les passages à retenir.';
      player = `
        <div class="card">
          <div class="card-title">${this.icon('i-play')}Lecture — balisez pendant que vous lisez</div>
          <p style="font-size:0.82rem;color:var(--ink-3);margin:0 0 12px">${tip}</p>
          <div class="player-frame">
            <${tag} id="importPlayer" src="${url}" controls preload="metadata"></${tag}>
          </div>
          <div class="player-toolbar">
            <span class="player-time" id="importPlayerTime">00:00:00</span>
            ${isVideo ? `<button class="btn btn-primary btn-sm" id="btnImportShot">${this.icon('i-camera')}Capturer <span class="kbd">S</span></button>` : ''}
            <button class="btn btn-secondary btn-sm" id="btnImportMarker">${this.icon('i-flag')}Repère rapide <span class="kbd">M</span></button>
            <button class="btn btn-secondary btn-sm" id="btnImportMarkerLabel">${this.icon('i-edit')}Repère nommé</button>
          </div>
        </div>
      `;
    } else {
      player = `
        <div class="notice notice-warning">
          ${this.icon('i-alert')}
          <div class="notice-content">
            <strong>Format non lisible dans le navigateur (.${ext})</strong><br>
            Pas de problème — vous pouvez tout de même ajouter des repères manuellement et exporter la timeline. Pour lire le fichier, utilisez le script FFmpeg fourni à l'étape suivante pour le convertir en MP4 ou MP3.
          </div>
        </div>
      `;
    }

    const shotsCard = `
      <div class="card">
        <div class="card-title">
          ${this.icon('i-image')}Captures d'écran
          <span style="margin-left:auto;font-weight:400;color:var(--ink-3);font-size:0.8rem" id="importShotsCount">0 capture</span>
        </div>
        <p style="font-size:0.82rem;color:var(--ink-3);margin:0 0 12px">Ces images alimenteront votre rapport PDF. Plus elles sont nombreuses et bien nommées, plus le rapport est exploitable.</p>
        <div class="shots-grid" id="importShotsGrid">
          <div class="empty">${this.icon('i-image')}Aucune capture — appuyez sur <span class="kbd">S</span> pendant la lecture.</div>
        </div>
      </div>
    `;

    const notesCard = `
      <div class="card">
        <div class="card-title">${this.icon('i-edit')}Notes</div>
        <p style="font-size:0.82rem;color:var(--ink-3);margin:0 0 10px">Contexte, décisions, à retenir… Incluses dans le PDF, le ZIP et le pack NotebookLM.</p>
        <textarea class="textarea" id="notesArea" placeholder="Ex: Réunion du 12 mai — Participants : X, Y — Points clés : …"></textarea>
      </div>
    `;

    const actions = `
      <div class="toolbar">
        <button class="btn btn-success btn-lg" id="btnGoExport">${this.icon('i-arrow-right')}Générer les livrables</button>
        <button class="btn btn-secondary" data-page="import">${this.icon('i-upload')}Changer de fichier</button>
      </div>
    `;

    root.innerHTML = meta + player + shotsCard + notesCard + actions;

    this.goto('import-preview');
    this._bindImportPreviewEvents();
  },

  _bindImportPreviewEvents() {
    const player = document.getElementById('importPlayer');
    const timeEl = document.getElementById('importPlayerTime');

    if (player) {
      player.addEventListener('loadedmetadata', () => {
        if (player.duration && !isNaN(player.duration) && isFinite(player.duration)) {
          Session.setDuration(player.duration);
          const d = document.getElementById('importDuration');
          if (d) d.textContent = Utils.formatDuration(player.duration);
        } else {
          const d = document.getElementById('importDuration');
          if (d) d.textContent = 'Indéterminée';
        }
      });
      player.addEventListener('timeupdate', () => {
        if (timeEl) timeEl.textContent = Utils.formatDuration(player.currentTime);
      });
      player.addEventListener('error', () => {
        const wrap = document.getElementById('importPreviewWrap');
        wrap?.insertAdjacentHTML('afterbegin', `
          <div class="notice notice-danger">${this.icon('i-alert')}
            <div class="notice-content"><strong>Lecture impossible.</strong> Le navigateur ne peut pas décoder ce fichier.</div>
          </div>`);
      });
    }

    document.getElementById('btnImportShot')?.addEventListener('click', () => Importer.takeScreenshot());
    document.getElementById('btnImportMarker')?.addEventListener('click', () => {
      const m = Importer.addMarkerAtCurrent();
      if (m) UI.toast(`Marqueur à ${m.timeFormatted}`, 'success', 1500);
    });
    document.getElementById('btnImportMarkerLabel')?.addEventListener('click', () => {
      Modal.prompt('Nom du marqueur', 'Ex: Décision importante', '').then(label => {
        if (label !== null) {
          const m = Importer.addMarkerAtCurrent(label);
          if (m) UI.toast(`Marqueur ajouté : ${label}`, 'success', 1500);
        }
      });
    });
    document.getElementById('btnGoExport')?.addEventListener('click', () => {
      const notes = document.getElementById('notesArea')?.value || '';
      Session.setNotes(notes);
      this.goto('postprocess');
    });

    // Notes auto-save
    const notesArea = document.getElementById('notesArea');
    if (notesArea) {
      const s = Session.current();
      if (s?.notes) notesArea.value = s.notes;
      notesArea.addEventListener('input', Utils.debounce(() => {
        Session.setNotes(notesArea.value);
      }, 400));
    }
  },

  addShotToImport(shot) {
    const grid = document.getElementById('importShotsGrid');
    if (!grid) return;
    if (grid.querySelector('.empty')) grid.innerHTML = '';
    grid.appendChild(this._buildShotCard(shot));

    const c = document.getElementById('importShotsCount');
    if (c) c.textContent = Session.current()?.screenshots.length || 0;
  },

  // ════════════════════════════════════════════════════
  //  POSTPROCESS
  // ════════════════════════════════════════════════════
  refreshPostprocess() {
    const s = Session.current();
    if (!s) {
      this.goto('home');
      return;
    }

    // Title editable
    const titleInput = document.getElementById('ppTitle');
    if (titleInput) titleInput.value = s.title;

    // Stats
    this.updateStats();

    // Refresh sub-views (toutes visibles, plus de tabs)
    this.refreshShots();
    this.refreshMarkers();
    this.refreshSegments();
    this.refreshScripts();

    // Notes
    const notes = document.getElementById('ppNotes');
    if (notes) notes.value = s.notes || '';

    // Banner
    if (typeof App !== 'undefined') App._refreshSaveBanner();
  },

  refreshShots() {
    const s = Session.current();
    const grids = document.querySelectorAll('#ppShotsGrid');
    grids.forEach(grid => {
      grid.innerHTML = '';
      if (!s?.screenshots.length) {
        grid.innerHTML = `<div class="empty">${this.icon('i-image')}Aucune capture dans cette session</div>`;
        return;
      }
      s.screenshots.forEach(sh => grid.appendChild(this._buildShotCard(sh)));
    });
  },

  _buildShotCard(shot) {
    const card = document.createElement('div');
    card.className = 'shot';
    card.dataset.id = shot.id;
    card.innerHTML = `
      <div class="shot-img-wrap" onclick="Lightbox.open('${shot.id}')">
        <img src="${shot.dataUrl}" alt="${Utils.escapeHtml(shot.label)}" loading="lazy">
        <span class="shot-time-badge">${shot.timeFormatted}</span>
      </div>
      <div class="shot-meta">
        <input class="shot-label" type="text" value="${Utils.escapeHtml(shot.label)}"
          onblur="Shots.rename('${shot.id}', this.value)"
          onkeydown="if(event.key==='Enter')this.blur()">
        <div class="shot-actions">
          <button class="btn btn-ghost btn-icon-only" title="Télécharger" onclick="Shots.downloadOne('${shot.id}')">${this.icon('i-download', 'icon icon-sm')}</button>
          <button class="btn btn-ghost btn-icon-only" title="Supprimer" onclick="Shots.remove('${shot.id}')">${this.icon('i-trash', 'icon icon-sm')}</button>
        </div>
      </div>
    `;
    return card;
  },

  refreshMarkers() {
    const s = Session.current();
    const list = document.getElementById('ppMarkersList');
    if (!list) return;
    list.innerHTML = '';
    if (!s?.markers.length) {
      list.innerHTML = `<div class="empty">${this.icon('i-flag')}Aucun marqueur</div>`;
      return;
    }
    s.markers.forEach(m => {
      const row = document.createElement('div');
      row.className = 'marker';
      row.innerHTML = `
        <button class="marker-time" title="Aller à ce moment" onclick="Markers.jumpTo(${m.time})">${m.timeFormatted}</button>
        <input class="marker-label" type="text" value="${Utils.escapeHtml(m.label)}"
          onblur="Markers.rename('${m.id}', this.value)"
          onkeydown="if(event.key==='Enter')this.blur()">
        <button class="btn btn-ghost btn-icon-only" title="Supprimer" onclick="Markers.remove('${m.id}')">${this.icon('i-trash', 'icon icon-sm')}</button>
      `;
      list.appendChild(row);
    });
  },

  refreshSegments() {
    const s = Session.current();
    const list = document.getElementById('ppSegmentsList');
    if (!list) return;
    list.innerHTML = '';
    if (!s?.segments?.length) {
      list.innerHTML = `<div class="empty">${this.icon('i-folder')}Aucun segment enregistré</div>`;
      return;
    }
    s.segments.forEach((seg, i) => {
      const row = document.createElement('div');
      row.className = 'segment-row';
      row.innerHTML = `
        ${this.icon('i-file')}
        <strong>Segment ${i + 1}</strong>
        <span class="seg-meta">${Utils.formatBytes(seg.size)} · ${Utils.formatDurationShort(seg.duration)}</span>
        <div class="seg-actions">
          <button class="btn btn-secondary btn-sm" onclick="Segments.download(${i})">${this.icon('i-download', 'icon icon-sm')}WebM</button>
        </div>
      `;
      list.appendChild(row);
    });
  },

  refreshScripts() {
    const list = document.getElementById('ppScriptsList');
    if (!list) return;
    list.innerHTML = '';
    Scripts.list().forEach(sc => {
      const c = document.createElement('div');
      c.className = 'script-card';
      c.innerHTML = `
        <div class="script-head">
          <h4 class="script-title">${Utils.escapeHtml(sc.title)}</h4>
          <button class="btn btn-ghost btn-sm copy-cmd-btn">${this.icon('i-copy', 'icon icon-sm')}Copier</button>
        </div>
        <p class="script-desc">${Utils.escapeHtml(sc.desc)}</p>
        <code class="script-cmd">${Utils.escapeHtml(sc.cmd)}</code>
      `;
      const btn = c.querySelector('.copy-cmd-btn');
      btn.addEventListener('click', () => this.copyCmd(btn, sc.cmd));
      list.appendChild(c);
    });
  },

  copyCmd(btn, cmd) {
    Utils.copyToClipboard(cmd).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = `${this.icon('i-check', 'icon icon-sm')}Copié`;
      setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
  },

  updateZipProgress(percent) {
    const bar = document.getElementById('zipProgress');
    if (!bar) return;
    if (percent > 0 && percent < 100) {
      bar.style.display = '';
      bar.style.width = percent + '%';
    } else {
      bar.style.display = 'none';
      bar.style.width = '0%';
    }
  },

  // ════════════════════════════════════════════════════
  //  TABS (legacy - sections are now all visible)
  // ════════════════════════════════════════════════════
  switchPpTab(tabId) { /* no-op : sections are all visible now */ },
};

// ════════════════════════════════════════════════════
//  LIGHTBOX
// ════════════════════════════════════════════════════
const Lightbox = {
  open(shotId) {
    const s = Session.current();
    const shot = s?.screenshots.find(x => x.id === shotId);
    if (!shot) return;
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    if (!lb || !img) return;
    img.src = shot.dataUrl;
    img.alt = shot.label;
    lb.classList.add('show');
    document.body.style.overflow = 'hidden';
  },
  close() {
    document.getElementById('lightbox')?.classList.remove('show');
    document.body.style.overflow = '';
  },
};

// ════════════════════════════════════════════════════
//  MODAL (prompt / confirm)
// ════════════════════════════════════════════════════
const Modal = {
  prompt(title, placeholder = '', defaultValue = '') {
    return new Promise(resolve => {
      const bd = document.getElementById('modalBackdrop');
      bd.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <h3 class="modal-title">${Utils.escapeHtml(title)}</h3>
            <button class="btn btn-ghost btn-icon-only" data-close>${UI.icon('i-x')}</button>
          </div>
          <div class="modal-body">
            <input class="input" id="modalInput" type="text" placeholder="${Utils.escapeHtml(placeholder)}" value="${Utils.escapeHtml(defaultValue)}" autofocus>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" data-cancel>Annuler</button>
            <button class="btn btn-primary" data-ok>Valider</button>
          </div>
        </div>
      `;
      bd.classList.add('show');
      const input = bd.querySelector('#modalInput');
      setTimeout(() => input?.focus(), 50);
      input?.select?.();

      const close = (val) => {
        bd.classList.remove('show');
        bd.innerHTML = '';
        resolve(val);
      };
      bd.querySelector('[data-close]').onclick = () => close(null);
      bd.querySelector('[data-cancel]').onclick = () => close(null);
      bd.querySelector('[data-ok]').onclick = () => close(input.value);
      input.onkeydown = e => {
        if (e.key === 'Enter') close(input.value);
        if (e.key === 'Escape') close(null);
      };
    });
  },

  confirm(title, message, okLabel = 'Confirmer') {
    return new Promise(resolve => {
      const bd = document.getElementById('modalBackdrop');
      bd.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <h3 class="modal-title">${Utils.escapeHtml(title)}</h3>
            <button class="btn btn-ghost btn-icon-only" data-close>${UI.icon('i-x')}</button>
          </div>
          <div class="modal-body">
            <p>${Utils.escapeHtml(message)}</p>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" data-cancel>Annuler</button>
            <button class="btn btn-danger" data-ok>${Utils.escapeHtml(okLabel)}</button>
          </div>
        </div>
      `;
      bd.classList.add('show');
      const close = (val) => {
        bd.classList.remove('show');
        bd.innerHTML = '';
        resolve(val);
      };
      bd.querySelector('[data-close]').onclick = () => close(false);
      bd.querySelector('[data-cancel]').onclick = () => close(false);
      bd.querySelector('[data-ok]').onclick = () => close(true);
    });
  },
};
