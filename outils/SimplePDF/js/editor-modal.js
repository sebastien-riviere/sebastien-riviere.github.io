// editor-modal.js — Éditeur plein écran (Texte + Signature)

import { state } from './state.js';
import { buildPdfFromRawPages } from './pdf-builder.js';
import { getRawBuffers, getExportPages } from './pdf-actions.js';
import { downloadBlob, exportName, formatSize } from './utils.js';

// ─── État interne ─────────────────────────────────────────────────────

let _tool = 'text';       // 'text' | 'signature'
let _annotations = [];    // [{id, pageIdx, type, xPct, yPct, data}]
let _sigDataUrl = null;   // Signature dessinée ou importée
let _pages = [];          // Pages courantes
let _canvasMap = {};      // pageIdx → HTMLElement (canvasWrap)

// ─── Points d'entrée publics ──────────────────────────────────────────

export function openTextModal() {
  _openEditor('text');
}

export function openSignatureModal() {
  _openEditor('signature');
}

// ─── Ouverture / fermeture ────────────────────────────────────────────

function _openEditor(defaultTool = 'text') {
  _pages = getExportPages();
  if (!_pages.length) {
    state.addError('Importez des pages avant d\'éditer.');
    return;
  }
  _tool = defaultTool;
  _annotations = [];
  _sigDataUrl = null;
  _canvasMap = {};

  _buildContent();

  const view = document.getElementById('editor-view');
  if (view) {
    view.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

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
  // Miniatures
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
      const label = document.createElement('div');
      label.className = 'editor-thumb-label';
      label.textContent = idx + 1;
      thumb.appendChild(label);
      thumb.addEventListener('click', () => _scrollToPage(idx));
      thumbsEl.appendChild(thumb);
    });
  }

  // Pages
  const pagesEl = document.getElementById('editor-pages');
  if (pagesEl) {
    pagesEl.innerHTML = '';
    _canvasMap = {};
    _pages.forEach((page, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'editor-page-wrap';
      wrapper.id = `editor-page-${idx}`;

      const label = document.createElement('div');
      label.className = 'editor-page-label';
      label.textContent = `Page ${idx + 1}  ·  ${page.fileName}`;

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'editor-canvas-wrap';
      canvasWrap.dataset.pageIdx = idx;

      const placeholder = document.createElement('div');
      placeholder.className = 'editor-canvas-placeholder skeleton';
      canvasWrap.appendChild(placeholder);

      canvasWrap.addEventListener('click', e => _onCanvasClick(e, idx, canvasWrap));

      wrapper.appendChild(label);
      wrapper.appendChild(canvasWrap);
      pagesEl.appendChild(wrapper);
      _canvasMap[idx] = canvasWrap;
    });
  }

  // Reset undo
  const undoBtn = document.getElementById('editor-undo');
  if (undoBtn) undoBtn.disabled = true;
  const applyBtn = document.getElementById('editor-apply');
  if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Appliquer & Télécharger'; }
}

// ─── Rendu des pages ──────────────────────────────────────────────────

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
        const pdfSrc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        const pdfPage = await pdfSrc.getPage(page.pageIndex + 1);
        const viewport = pdfPage.getViewport({ scale: 1.5, rotation: page.rotation || 0 });
        canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      } else {
        canvas = await _imageToCanvas(page.imageDataUrl || page.thumbDataUrl, page.rotation || 0);
      }

      canvas.className = 'editor-canvas';
      const placeholder = wrap.querySelector('.editor-canvas-placeholder');
      if (placeholder) placeholder.remove();
      wrap.appendChild(canvas);
      _renderAnnotationsForPage(idx, wrap);
    } catch (err) {
      console.error(`Erreur rendu page ${idx}:`, err);
    }
  }
}

// ─── Gestion des clics sur les pages ─────────────────────────────────

function _onCanvasClick(e, pageIdx, wrap) {
  const rect = wrap.getBoundingClientRect();
  const xPct = (e.clientX - rect.left) / rect.width;
  const yPct = (e.clientY - rect.top) / rect.height;

  if (_tool === 'text') {
    const textEl = document.getElementById('editor-text-input');
    const text = textEl?.value?.trim();
    if (!text) {
      if (textEl) {
        textEl.focus();
        textEl.classList.add('input-error-flash');
        setTimeout(() => textEl.classList.remove('input-error-flash'), 600);
      }
      state.dispatch('toast', { type: 'warning', msg: 'Saisissez d\'abord le texte à placer.' });
      return;
    }
    const fontSize = parseInt(document.getElementById('editor-text-size')?.value) || 14;
    const color = document.getElementById('editor-text-color')?.value || '#000000';
    _addAnnotation({ pageIdx, type: 'text', xPct, yPct, data: { text, fontSize, color } });

  } else if (_tool === 'signature') {
    if (!_sigDataUrl) {
      state.dispatch('toast', { type: 'warning', msg: 'Dessinez ou importez votre signature d\'abord.' });
      return;
    }
    const sigWidth = parseInt(document.getElementById('editor-sig-width')?.value) || 150;
    _addAnnotation({ pageIdx, type: 'signature', xPct, yPct, data: { sigDataUrl: _sigDataUrl, sigWidth } });
  }
}

// ─── Annotations ─────────────────────────────────────────────────────

function _addAnnotation(ann) {
  ann.id = Date.now() + Math.random();
  _annotations.push(ann);
  _renderAnnotationsForPage(ann.pageIdx, _canvasMap[ann.pageIdx]);
  const undoBtn = document.getElementById('editor-undo');
  if (undoBtn) undoBtn.disabled = false;
  _scrollToPage(ann.pageIdx);
}

function _renderAnnotationsForPage(pageIdx, wrap) {
  if (!wrap) return;
  wrap.querySelectorAll('.editor-annotation-marker').forEach(el => el.remove());

  _annotations
    .filter(a => a.pageIdx === pageIdx)
    .forEach(ann => {
      const marker = document.createElement('div');
      marker.className = `editor-annotation-marker editor-ann-${ann.type}`;
      marker.style.left = (ann.xPct * 100) + '%';
      marker.style.top = (ann.yPct * 100) + '%';

      if (ann.type === 'text') {
        marker.textContent = ann.data.text;
        marker.style.fontSize = Math.max(9, Math.min(ann.data.fontSize * 0.55, 18)) + 'px';
        marker.style.color = ann.data.color;
      } else {
        // Icône signature
        marker.innerHTML = `<svg viewBox="0 0 32 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 11c2-5 4-9 5-9s1 4 3 4 3-3 4-3 1 3 3 3 2-2 4-2"/>
          <line x1="0" y1="15" x2="32" y2="15"/>
        </svg>`;
      }

      wrap.appendChild(marker);
    });
}

function _undo() {
  if (!_annotations.length) return;
  const removed = _annotations.pop();
  _renderAnnotationsForPage(removed.pageIdx, _canvasMap[removed.pageIdx]);
  const undoBtn = document.getElementById('editor-undo');
  if (undoBtn) undoBtn.disabled = !_annotations.length;
}

// ─── Application et export ────────────────────────────────────────────

async function _applyAnnotations() {
  if (!_annotations.length) {
    state.dispatch('toast', { type: 'info', msg: 'Aucune annotation à appliquer. Cliquez sur une page pour placer du texte ou une signature.' });
    return;
  }

  const btn = document.getElementById('editor-apply');
  if (btn) { btn.disabled = true; btn.textContent = 'Traitement…'; }

  try {
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    if (!PDFDocument) throw new Error('pdf-lib non chargé.');

    const rawBuffers = getRawBuffers();
    const bytes = await buildPdfFromRawPages(_pages, rawBuffers, () => {});
    const pdfDoc = await PDFDocument.load(bytes);
    const pdfPages = pdfDoc.getPages();

    // Police selon sélection utilisateur
    const fontName = document.getElementById('editor-text-font')?.value || 'Helvetica';
    const isBold   = document.getElementById('editor-text-bold')?.checked || false;
    const fontKey  = _resolveFontKey(fontName, isBold, StandardFonts);
    const font = await pdfDoc.embedFont(fontKey);

    const scopeEl = document.getElementById('editor-scope');
    const sigScopeEl = document.getElementById('editor-sig-scope');

    for (const ann of _annotations) {
      const scope = ann.type === 'text'
        ? (scopeEl?.value || 'this')
        : (sigScopeEl?.value || 'this');

      let targetIndices;
      if (scope === 'all') {
        targetIndices = pdfPages.map((_, i) => i);
      } else if (scope === 'selection') {
        const selIds = state.get().selectedPageIds;
        targetIndices = _pages
          .map((p, i) => selIds.includes(p.id) ? i : -1)
          .filter(i => i >= 0);
      } else {
        targetIndices = [ann.pageIdx];
      }

      for (const idx of targetIndices) {
        const page = pdfPages[idx];
        if (!page) continue;
        const { width, height } = page.getSize();
        const x = ann.xPct * width;
        const y = height - ann.yPct * height;

        if (ann.type === 'text') {
          const c = _hexToRgb(ann.data.color);
          page.drawText(ann.data.text, {
            x: Math.max(0, x),
            y: Math.max(4, y),
            size: ann.data.fontSize,
            font,
            color: rgb(c.r, c.g, c.b),
          });
        } else if (ann.type === 'signature' && ann.data.sigDataUrl) {
          try {
            const resp = await fetch(ann.data.sigDataUrl);
            const buf = await resp.arrayBuffer();
            // Tenter PNG, fallback JPEG
            let sigImg;
            try {
              sigImg = await pdfDoc.embedPng(new Uint8Array(buf));
            } catch {
              sigImg = await pdfDoc.embedJpg(new Uint8Array(buf));
            }
            const { width: imgW, height: imgH } = sigImg;
            const ratio = imgH / imgW;
            const w = ann.data.sigWidth;
            const h = w * ratio;
            page.drawImage(sigImg, {
              x: Math.max(0, x - w / 2),
              y: Math.max(0, y - h / 2),
              width: w,
              height: h,
            });
          } catch (err) {
            console.warn('Signature embed error:', err);
          }
        }
      }
    }

    const out = await pdfDoc.save();
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

// ─── Interface ────────────────────────────────────────────────────────

function _updateToolUI() {
  const view = document.getElementById('editor-view');
  if (!view) return;

  view.querySelectorAll('.editor-tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === _tool);
  });

  const textOpts = document.getElementById('editor-text-options');
  const sigOpts  = document.getElementById('editor-sig-options');
  const sigPanel = document.getElementById('editor-sig-panel');

  if (textOpts) textOpts.style.display = _tool === 'text' ? 'flex' : 'none';
  if (sigOpts)  sigOpts.style.display  = _tool === 'signature' ? 'flex' : 'none';
  if (sigPanel) sigPanel.style.display = _tool === 'signature' ? 'flex' : 'none';

  if (_tool === 'signature') {
    setTimeout(() => {
      const canvas = document.getElementById('editor-sig-canvas');
      if (canvas && !canvas._initDone) _initSigPad(canvas);
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

// ─── Signature pad ────────────────────────────────────────────────────

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
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const start = e => {
    e.preventDefault();
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = e => {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const stop = () => {
    drawing = false;
    // Mettre à jour _sigDataUrl avec le dessin actuel
    const blank = !canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some(v => v !== 0);
    if (!blank) _sigDataUrl = canvas.toDataURL('image/png');
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

function _imageToCanvas(dataUrl, rotation = 0) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const w = img.width, h = img.height;
      const canvas = document.createElement('canvas');
      if (rotation === 90 || rotation === 270) { canvas.width = h; canvas.height = w; }
      else { canvas.width = w; canvas.height = h; }
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2);
      resolve(canvas);
    };
    img.src = dataUrl;
  });
}

function _resolveFontKey(name, bold, StandardFonts) {
  const map = {
    'Helvetica':  { normal: StandardFonts.Helvetica,   bold: StandardFonts.HelveticaBold },
    'TimesRoman': { normal: StandardFonts.TimesRoman,  bold: StandardFonts.TimesRomanBold },
    'Courier':    { normal: StandardFonts.Courier,     bold: StandardFonts.CourierBold },
  };
  const entry = map[name] || map['Helvetica'];
  return bold ? entry.bold : entry.normal;
}

function _hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

// ─── Initialisation (appelé depuis app.js) ────────────────────────────

export function initEditorView() {
  const view = document.getElementById('editor-view');
  if (!view) return;

  document.getElementById('editor-close')?.addEventListener('click', _closeEditor);
  document.getElementById('editor-apply')?.addEventListener('click', _applyAnnotations);
  document.getElementById('editor-undo')?.addEventListener('click', _undo);

  document.getElementById('editor-sig-clear')?.addEventListener('click', () => {
    const canvas = document.getElementById('editor-sig-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    _sigDataUrl = null;
  });

  document.getElementById('editor-sig-import')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      _sigDataUrl = ev.target.result;
      // Afficher l'aperçu sur le canvas
      const canvas = document.getElementById('editor-sig-canvas');
      if (canvas) {
        canvas.width  = canvas.offsetWidth  || 600;
        canvas.height = canvas.offsetHeight || 140;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
          const w = img.width * scale, h = img.height * scale;
          ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        };
        img.src = _sigDataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  view.querySelectorAll('.editor-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _tool = btn.dataset.tool;
      _updateToolUI();
    });
  });
}
