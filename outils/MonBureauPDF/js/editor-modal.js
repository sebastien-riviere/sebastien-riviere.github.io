// editor-modal.js — Éditeur plein écran avec annotations interactives

import { state } from './state.js';
import { buildPdfFromRawPages } from './pdf-builder.js';
import { getRawBuffers, getExportPages } from './pdf-actions.js';
import { downloadBlob, exportName, formatSize } from './utils.js';

// ─── État interne ─────────────────────────────────────────────────────

let _tool        = 'text';
let _annotations = [];          // [{id, pageIdx, type, xPct, yPct, widthPct, data}]
let _annElements = new Map();   // id → HTMLElement
let _sigDataUrl  = null;
let _pages       = [];
let _canvasMap   = {};          // pageIdx → canvasWrap HTMLElement

// ─── API publique ─────────────────────────────────────────────────────

export function openTextModal()      { _openEditor('text'); }
export function openSignatureModal() { _openEditor('signature'); }

// ─── Ouverture / fermeture ────────────────────────────────────────────

function _openEditor(defaultTool = 'text') {
  _pages = getExportPages();
  if (!_pages.length) {
    state.addError('Importez des pages avant d\'éditer.');
    return;
  }
  _tool = defaultTool;
  // Nettoyer les éléments précédents
  _annElements.forEach(el => el.remove());
  _annElements.clear();
  _annotations = [];
  _sigDataUrl  = null;
  _canvasMap   = {};

  _buildContent();

  const view = document.getElementById('editor-view');
  if (view) { view.style.display = 'flex'; document.body.style.overflow = 'hidden'; }

  _updateToolUI();
  _renderAllPages();
}

function _closeEditor() {
  const view = document.getElementById('editor-view');
  if (view) view.style.display = 'none';
  document.body.style.overflow = '';
}

// ─── Construction du contenu ──────────────────────────────────────────

function _buildContent() {
  // Miniatures gauche
  const thumbsEl = document.getElementById('editor-thumbs');
  if (thumbsEl) {
    thumbsEl.innerHTML = '';
    _pages.forEach((page, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'editor-thumb';
      thumb.dataset.idx = idx;
      if (page.thumbDataUrl) {
        const img = document.createElement('img');
        img.src = page.thumbDataUrl;
        img.className = 'editor-thumb-img';
        img.alt = `Page ${idx + 1}`;
        thumb.appendChild(img);
      }
      const lbl = document.createElement('div');
      lbl.className = 'editor-thumb-label';
      lbl.textContent = idx + 1;
      thumb.appendChild(lbl);
      thumb.addEventListener('click', () => _scrollToPage(idx));
      thumbsEl.appendChild(thumb);
    });
  }

  // Zone des pages
  const pagesEl = document.getElementById('editor-pages');
  if (pagesEl) {
    pagesEl.innerHTML = '';
    _canvasMap = {};
    _pages.forEach((page, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'editor-page-wrap';
      wrapper.id = `editor-page-${idx}`;

      const lbl = document.createElement('div');
      lbl.className = 'editor-page-label';
      lbl.textContent = `Page ${idx + 1}  ·  ${page.fileName}`;

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'editor-canvas-wrap';
      canvasWrap.dataset.pageIdx = idx;

      const ph = document.createElement('div');
      ph.className = 'editor-canvas-placeholder skeleton';
      canvasWrap.appendChild(ph);

      canvasWrap.addEventListener('click', e => _onCanvasClick(e, idx, canvasWrap));

      wrapper.appendChild(lbl);
      wrapper.appendChild(canvasWrap);
      pagesEl.appendChild(wrapper);
      _canvasMap[idx] = canvasWrap;
    });
  }

  const undoBtn  = document.getElementById('editor-undo');
  const applyBtn = document.getElementById('editor-apply');
  if (undoBtn)  undoBtn.disabled  = true;
  if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Appliquer & Télécharger'; }
}

// ─── Rendu des pages ─────────────────────────────────────────────────

async function _renderAllPages() {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) { state.addError('PDF.js non chargé.'); return; }
  const rawBuffers = getRawBuffers();

  for (let idx = 0; idx < _pages.length; idx++) {
    const page = _pages[idx];
    const wrap = _canvasMap[idx];
    if (!wrap) continue;

    try {
      let canvas;
      if (page.fileType === 'pdf') {
        const buffer = rawBuffers[page.fileId];
        if (!buffer) continue;
        const pdfSrc  = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        const pdfPage = await pdfSrc.getPage(page.pageIndex + 1);
        const vp      = pdfPage.getViewport({ scale: 1.5, rotation: page.rotation || 0 });
        canvas        = document.createElement('canvas');
        canvas.width  = vp.width;
        canvas.height = vp.height;
        await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      } else {
        canvas = await _imageToCanvas(page.imageDataUrl || page.thumbDataUrl, page.rotation || 0);
      }
      canvas.className = 'editor-canvas';
      const ph = wrap.querySelector('.editor-canvas-placeholder');
      if (ph) ph.remove();
      wrap.appendChild(canvas);
    } catch (err) {
      console.error(`Rendu page ${idx}:`, err);
    }
  }
}

// ─── Clic → placement annotation ─────────────────────────────────────

function _onCanvasClick(e, pageIdx, wrap) {
  // Ignorer si clic sur un élément existant
  if (e.target.closest('.ann-el')) return;

  const rect     = wrap.getBoundingClientRect();
  const DEF_W    = 0.28; // largeur par défaut : 28% de la page
  const xPct     = Math.max(0, Math.min(1 - DEF_W, (e.clientX - rect.left) / rect.width));
  const yPct     = Math.max(0, Math.min(0.93,       (e.clientY - rect.top)  / rect.height - 0.02));

  if (_tool === 'text') {
    const textEl = document.getElementById('editor-text-input');
    const text   = textEl?.value?.trim();
    if (!text) {
      textEl?.focus();
      textEl?.classList.add('input-error-flash');
      setTimeout(() => textEl?.classList.remove('input-error-flash'), 600);
      state.dispatch('toast', { type: 'warning', msg: 'Saisissez d\'abord le texte à placer.' });
      return;
    }
    _addAnnotation({
      pageIdx, type: 'text', xPct, yPct, widthPct: DEF_W,
      data: {
        text,
        fontSize: parseInt(document.getElementById('editor-text-size')?.value) || 14,
        color:    document.getElementById('editor-text-color')?.value || '#000000',
        fontName: document.getElementById('editor-text-font')?.value  || 'Helvetica',
        bold:     document.getElementById('editor-text-bold')?.checked || false,
      },
    });
  } else if (_tool === 'signature') {
    if (!_sigDataUrl) {
      state.dispatch('toast', { type: 'warning', msg: 'Dessinez ou importez votre signature d\'abord.' });
      return;
    }
    _addAnnotation({
      pageIdx, type: 'signature', xPct, yPct, widthPct: DEF_W,
      data: { sigDataUrl: _sigDataUrl },
    });
  }
}

// ─── Annotations ─────────────────────────────────────────────────────

function _addAnnotation(ann) {
  ann.id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  _annotations.push(ann);

  const wrap = _canvasMap[ann.pageIdx];
  if (wrap) {
    const el = _createAnnotationElement(ann, wrap);
    _annElements.set(ann.id, el);
  }

  const undoBtn = document.getElementById('editor-undo');
  if (undoBtn) undoBtn.disabled = false;
  _scrollToPage(ann.pageIdx);
}

function _removeAnnotation(id) {
  const el = _annElements.get(id);
  if (el) { el.remove(); _annElements.delete(id); }
  _annotations = _annotations.filter(a => a.id !== id);
  const undoBtn = document.getElementById('editor-undo');
  if (undoBtn) undoBtn.disabled = !_annotations.length;
}

function _undo() {
  if (!_annotations.length) return;
  _removeAnnotation(_annotations[_annotations.length - 1].id);
}

// ─── Élément interactif ───────────────────────────────────────────────

function _createAnnotationElement(ann, wrap) {
  const el = document.createElement('div');
  el.className    = `ann-el ann-${ann.type}`;
  el.dataset.annId = ann.id;
  el.style.left   = (ann.xPct * 100) + '%';
  el.style.top    = (ann.yPct * 100) + '%';
  el.style.width  = (ann.widthPct * 100) + '%';

  // ── Bouton supprimer ──────────────────────
  const delBtn = document.createElement('button');
  delBtn.className = 'ann-delete-btn';
  delBtn.innerHTML = '×';
  delBtn.title     = 'Supprimer';
  delBtn.addEventListener('mousedown', e => e.stopPropagation());
  delBtn.addEventListener('touchstart', e => e.stopPropagation());
  delBtn.addEventListener('click', e => { e.stopPropagation(); _removeAnnotation(ann.id); });
  el.appendChild(delBtn);

  // ── Contenu ───────────────────────────────
  if (ann.type === 'text') {
    const content = document.createElement('div');
    content.className     = 'ann-text-content';
    content.contentEditable = 'true';
    content.spellcheck    = false;
    content.textContent   = ann.data.text;
    content.style.color      = ann.data.color;
    content.style.fontSize   = ann.data.fontSize + 'px';
    content.style.fontFamily = _cssFontFamily(ann.data.fontName);
    content.style.fontWeight = ann.data.bold ? 'bold' : 'normal';
    // Sync modifs en temps réel
    content.addEventListener('input', () => { ann.data.text = content.textContent || ''; });
    // Empêcher le drag quand on édite
    content.addEventListener('mousedown', e => e.stopPropagation());
    content.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    el.appendChild(content);
  } else {
    const img = document.createElement('img');
    img.className = 'ann-sig-img';
    img.src       = ann.data.sigDataUrl;
    img.draggable = false;
    el.appendChild(img);
  }

  // ── Handle de redimensionnement ───────────
  const rh = document.createElement('div');
  rh.className = 'ann-resize-handle';
  rh.title     = 'Redimensionner';
  el.appendChild(rh);

  wrap.appendChild(el);
  _makeDraggable(el, ann, wrap);
  _makeResizable(rh, el, ann, wrap);

  return el;
}

function _cssFontFamily(name) {
  if (name === 'TimesRoman') return 'Times New Roman, Times, serif';
  if (name === 'Courier')    return 'Courier New, Courier, monospace';
  return 'Helvetica Neue, Helvetica, Arial, sans-serif';
}

// ─── Drag ─────────────────────────────────────────────────────────────

function _makeDraggable(el, ann, wrap) {
  el.addEventListener('mousedown',  e => _startDrag(e, el, ann, wrap));
  el.addEventListener('touchstart', e => _startDrag(e, el, ann, wrap), { passive: false });
}

function _startDrag(e, el, ann, wrap) {
  if (e.target.closest('.ann-delete-btn') ||
      e.target.closest('.ann-resize-handle') ||
      e.target.closest('.ann-text-content')) return;

  e.preventDefault();
  e.stopPropagation();

  const src   = e.touches ? e.touches[0] : e;
  const startX = src.clientX, startY = src.clientY;
  const origX  = ann.xPct,    origY  = ann.yPct;

  el.classList.add('ann-dragging');

  const onMove = ev => {
    ev.preventDefault();
    const s = ev.touches ? ev.touches[0] : ev;
    const r = wrap.getBoundingClientRect();
    ann.xPct = Math.max(0, Math.min(1 - ann.widthPct, origX + (s.clientX - startX) / r.width));
    ann.yPct = Math.max(0, Math.min(0.97,              origY + (s.clientY - startY) / r.height));
    el.style.left = (ann.xPct * 100) + '%';
    el.style.top  = (ann.yPct * 100) + '%';
  };

  const onEnd = () => {
    el.classList.remove('ann-dragging');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend',  onEnd);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onEnd);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend',  onEnd);
}

// ─── Resize ───────────────────────────────────────────────────────────

function _makeResizable(rh, el, ann, wrap) {
  rh.addEventListener('mousedown',  e => _startResize(e, el, ann, wrap));
  rh.addEventListener('touchstart', e => _startResize(e, el, ann, wrap), { passive: false });
}

function _startResize(e, el, ann, wrap) {
  e.preventDefault();
  e.stopPropagation();

  const src    = e.touches ? e.touches[0] : e;
  const startX = src.clientX;
  const origW  = ann.widthPct;

  const onMove = ev => {
    ev.preventDefault();
    const s = ev.touches ? ev.touches[0] : ev;
    const r = wrap.getBoundingClientRect();
    ann.widthPct = Math.max(0.05, Math.min(1 - ann.xPct, origW + (s.clientX - startX) / r.width));
    el.style.width = (ann.widthPct * 100) + '%';
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend',  onEnd);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onEnd);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend',  onEnd);
}

// ─── Application et export ────────────────────────────────────────────

async function _applyAnnotations() {
  if (!_annotations.length) {
    state.dispatch('toast', { type: 'info', msg: 'Cliquez sur une page pour placer une annotation.' });
    return;
  }

  const btn = document.getElementById('editor-apply');
  if (btn) { btn.disabled = true; btn.textContent = 'Traitement…'; }

  try {
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    if (!PDFDocument) throw new Error('pdf-lib non chargé.');

    const rawBuffers = getRawBuffers();
    const bytes      = await buildPdfFromRawPages(_pages, rawBuffers, () => {});
    const pdfDoc     = await PDFDocument.load(bytes);
    const pdfPages   = pdfDoc.getPages();

    const scopeEl    = document.getElementById('editor-scope');
    const sigScopeEl = document.getElementById('editor-sig-scope');

    // Cache des polices pour éviter les re-embeddings
    const fontCache = {};
    const getFont = async key => {
      if (!fontCache[key]) fontCache[key] = await pdfDoc.embedFont(key);
      return fontCache[key];
    };

    for (const ann of _annotations) {
      const scope = ann.type === 'text'
        ? (scopeEl?.value || 'this')
        : (sigScopeEl?.value || 'this');

      let targets;
      if (scope === 'all') {
        targets = pdfPages.map((_, i) => i);
      } else if (scope === 'selection') {
        const selIds = state.get().selectedPageIds;
        targets = _pages.map((p, i) => selIds.includes(p.id) ? i : -1).filter(i => i >= 0);
      } else {
        targets = [ann.pageIdx];
      }

      for (const idx of targets) {
        const page = pdfPages[idx];
        if (!page) continue;
        const { width, height } = page.getSize();

        if (ann.type === 'text') {
          const fontKey = _resolveFontKey(ann.data.fontName || 'Helvetica', ann.data.bold || false, StandardFonts);
          const font    = await getFont(fontKey);
          const c       = _hexToRgb(ann.data.color);
          const sz      = ann.data.fontSize;
          page.drawText(ann.data.text || '', {
            x:     Math.max(0, ann.xPct * width),
            y:     Math.max(sz, height - ann.yPct * height - sz),
            size:  sz,
            font,
            color: rgb(c.r, c.g, c.b),
          });
        } else if (ann.type === 'signature' && ann.data.sigDataUrl) {
          try {
            const resp = await fetch(ann.data.sigDataUrl);
            const buf  = await resp.arrayBuffer();
            let sigImg;
            try   { sigImg = await pdfDoc.embedPng(new Uint8Array(buf)); }
            catch { sigImg = await pdfDoc.embedJpg(new Uint8Array(buf)); }
            const { width: imgW, height: imgH } = sigImg;
            const sigW = ann.widthPct * width;
            const sigH = sigW * (imgH / imgW);
            page.drawImage(sigImg, {
              x:      Math.max(0, ann.xPct * width),
              y:      Math.max(0, height - ann.yPct * height - sigH),
              width:  sigW,
              height: sigH,
            });
          } catch (err) {
            console.warn('Embed signature:', err);
          }
        }
      }
    }

    const out  = await pdfDoc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    const name = exportName('annotated');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'annotated', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `PDF annoté : ${formatSize(blob.size)}` });
    _closeEditor();
  } catch (err) {
    state.addError(err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Appliquer & Télécharger'; }
  }
}

// ─── UI ───────────────────────────────────────────────────────────────

function _updateToolUI() {
  const view = document.getElementById('editor-view');
  if (!view) return;

  view.querySelectorAll('.editor-tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === _tool);
  });

  const textOpts = document.getElementById('editor-text-options');
  const sigOpts  = document.getElementById('editor-sig-options');
  const sigPanel = document.getElementById('editor-sig-panel');

  if (textOpts) textOpts.style.display = _tool === 'text'      ? 'flex' : 'none';
  if (sigOpts)  sigOpts.style.display  = _tool === 'signature' ? 'flex' : 'none';
  if (sigPanel) sigPanel.style.display = _tool === 'signature' ? 'flex' : 'none';

  if (_tool === 'signature') {
    setTimeout(() => {
      const c = document.getElementById('editor-sig-canvas');
      if (c && !c._initDone) _initSigPad(c);
    }, 60);
  }
}

function _scrollToPage(idx) {
  const el = document.getElementById(`editor-page-${idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.editor-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });
}

// ─── Pad signature ────────────────────────────────────────────────────

function _initSigPad(canvas) {
  canvas._initDone = true;
  canvas.width  = canvas.offsetWidth  || 600;
  canvas.height = canvas.offsetHeight || 140;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  let drawing = false;
  const getPos = e => {
    const r = canvas.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x: s.clientX - r.left, y: s.clientY - r.top };
  };
  const start = e => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move  = e => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const stop  = () => {
    drawing = false;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    if (data.some(v => v !== 0)) _sigDataUrl = canvas.toDataURL('image/png');
  };

  canvas.addEventListener('mousedown',  start);
  canvas.addEventListener('mousemove',  move);
  canvas.addEventListener('mouseup',    stop);
  canvas.addEventListener('mouseleave', stop);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove',  move,  { passive: false });
  canvas.addEventListener('touchend',   stop);
}

// ─── Utilitaires ─────────────────────────────────────────────────────

function _resolveFontKey(name, bold, SF) {
  const map = {
    Helvetica:  { n: SF.Helvetica,  b: SF.HelveticaBold },
    TimesRoman: { n: SF.TimesRoman, b: SF.TimesRomanBold },
    Courier:    { n: SF.Courier,    b: SF.CourierBold },
  };
  const e = map[name] || map.Helvetica;
  return bold ? e.b : e.n;
}

function _hexToRgb(hex) {
  const h = (hex || '#000000').replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

function _imageToCanvas(dataUrl, rotation = 0) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const w = img.width, h = img.height;
      const c = document.createElement('canvas');
      if (rotation === 90 || rotation === 270) { c.width = h; c.height = w; }
      else { c.width = w; c.height = h; }
      const ctx = c.getContext('2d');
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2);
      resolve(c);
    };
    img.src = dataUrl;
  });
}

// ─── Initialisation ───────────────────────────────────────────────────

export function initEditorView() {
  const view = document.getElementById('editor-view');
  if (!view) return;

  document.getElementById('editor-close')?.addEventListener('click', _closeEditor);
  document.getElementById('editor-apply')?.addEventListener('click', _applyAnnotations);
  document.getElementById('editor-undo')?.addEventListener('click', _undo);

  document.getElementById('editor-sig-clear')?.addEventListener('click', () => {
    const c = document.getElementById('editor-sig-canvas');
    if (c) { c.getContext('2d').clearRect(0, 0, c.width, c.height); }
    _sigDataUrl = null;
  });

  document.getElementById('editor-sig-import')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      _sigDataUrl = ev.target.result;
      const c = document.getElementById('editor-sig-canvas');
      if (!c) return;
      c.width  = c.offsetWidth  || 600;
      c.height = c.offsetHeight || 140;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(c.width / img.width, c.height / img.height, 1);
        ctx.drawImage(img, (c.width - img.width * scale) / 2, (c.height - img.height * scale) / 2,
                      img.width * scale, img.height * scale);
      };
      img.src = _sigDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  view.querySelectorAll('.editor-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => { _tool = btn.dataset.tool; _updateToolUI(); });
  });
}
