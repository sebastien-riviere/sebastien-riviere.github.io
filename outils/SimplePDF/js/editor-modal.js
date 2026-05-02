// editor-modal.js — Modals annotation texte et signature

import { state } from './state.js';
import { buildPdfFromRawPages } from './pdf-builder.js';
import { getRawBuffers, getExportPages } from './pdf-actions.js';
import { downloadBlob, exportName, formatSize } from './utils.js';

// ─── Helpers modal ────────────────────────────────────────────────────

function _createModal(title, bodyHtml, onApply) {
  // Supprimer modal existante
  document.getElementById('editor-modal')?.remove();
  document.getElementById('editor-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'editor-overlay';
  overlay.className = 'editor-overlay';

  const modal = document.createElement('div');
  modal.id = 'editor-modal';
  modal.className = 'editor-modal';
  modal.innerHTML = `
    <div class="editor-modal-header">
      <span class="editor-modal-title">${title}</span>
      <button class="btn btn-ghost btn-icon editor-modal-close" aria-label="Fermer">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
        </svg>
      </button>
    </div>
    <div class="editor-modal-body">${bodyHtml}</div>
    <div class="editor-modal-footer">
      <button class="btn btn-ghost editor-modal-cancel">Annuler</button>
      <button class="btn btn-primary editor-modal-apply">Appliquer et télécharger</button>
    </div>
  `;

  const close = () => { overlay.remove(); modal.remove(); };
  overlay.addEventListener('click', close);
  modal.querySelector('.editor-modal-close').addEventListener('click', close);
  modal.querySelector('.editor-modal-cancel').addEventListener('click', close);
  modal.querySelector('.editor-modal-apply').addEventListener('click', async () => {
    try {
      modal.querySelector('.editor-modal-apply').disabled = true;
      modal.querySelector('.editor-modal-apply').textContent = 'Traitement…';
      await onApply();
      close();
    } catch (err) {
      state.addError(err.message);
      modal.querySelector('.editor-modal-apply').disabled = false;
      modal.querySelector('.editor-modal-apply').textContent = 'Appliquer et télécharger';
    }
  });

  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  return modal;
}

function _getPageThumb() {
  const pages = state.getPages();
  const selected = state.getSelectedPages();
  return (selected[0] || pages[0]) || null;
}

// ─── MODAL TEXTE ──────────────────────────────────────────────────────

export function openTextModal() {
  const page = _getPageThumb();
  if (!page) { state.addError('Importez des pages avant d\'ajouter du texte.'); return; }

  const thumbSrc = page.thumbDataUrl || '';
  let clickPos = { xPct: 0.1, yPct: 0.9 }; // défaut : bas gauche

  const body = `
    <div class="editor-section">
      <div class="editor-label">Cliquez sur la page pour positionner le texte</div>
      <div class="editor-thumb-wrap" id="text-thumb-wrap">
        <img id="text-thumb-img" src="${thumbSrc}" class="editor-thumb-img" draggable="false">
        <div id="text-cursor" class="editor-cursor" style="left:10%;top:90%"></div>
      </div>
    </div>
    <div class="editor-section">
      <div class="editor-row">
        <div class="input-group" style="flex:1">
          <label class="input-label">Texte</label>
          <input id="text-content" class="input-field" type="text" placeholder="Votre texte…" value="">
        </div>
      </div>
      <div class="editor-row">
        <div class="input-group" style="width:80px">
          <label class="input-label">Taille</label>
          <input id="text-size" class="input-field" type="number" min="6" max="120" value="14">
        </div>
        <div class="input-group" style="width:80px">
          <label class="input-label">Couleur</label>
          <input id="text-color" class="input-field" type="color" value="#000000" style="padding:2px 4px;height:32px">
        </div>
        <div class="input-group" style="flex:1">
          <label class="input-label">Appliquer sur</label>
          <select id="text-pages" class="input-field">
            <option value="all">Toutes les pages</option>
            <option value="first">1ère page seulement</option>
            <option value="selection">Sélection</option>
          </select>
        </div>
      </div>
    </div>
  `;

  const modal = _createModal('Ajouter du texte', body, async () => {
    const text = modal.querySelector('#text-content').value.trim();
    if (!text) throw new Error('Texte vide.');
    const fontSize = parseInt(modal.querySelector('#text-size').value) || 14;
    const colorHex = modal.querySelector('#text-color').value;
    const scope = modal.querySelector('#text-pages').value;
    await _applyTextToPdf(text, clickPos, fontSize, colorHex, scope);
  });

  // Clic sur miniature → position
  const thumbWrap = modal.querySelector('#text-thumb-wrap');
  const cursor = modal.querySelector('#text-cursor');
  thumbWrap.addEventListener('click', e => {
    const rect = thumbWrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    clickPos = { xPct: x / rect.width, yPct: y / rect.height };
    cursor.style.left = (clickPos.xPct * 100) + '%';
    cursor.style.top  = (clickPos.yPct * 100) + '%';
  });
}

async function _applyTextToPdf(text, pos, fontSize, colorHex, scope) {
  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
  if (!PDFDocument) throw new Error('pdf-lib non chargé.');

  const allPages = getExportPages();
  if (!allPages.length) throw new Error('Aucune page.');
  const rawBuffers = getRawBuffers();
  const bytes = await buildPdfFromRawPages(allPages, rawBuffers, () => {});
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const color = _hexToRgb(colorHex);
  const pdfPages = pdfDoc.getPages();

  // Déterminer les indices de pages cibles
  let targetIndices;
  if (scope === 'first') {
    targetIndices = [0];
  } else if (scope === 'selection') {
    const selIds = state.get().selectedPageIds;
    targetIndices = allPages
      .map((p, i) => selIds.includes(p.id) ? i : -1)
      .filter(i => i >= 0);
  } else {
    targetIndices = pdfPages.map((_, i) => i);
  }

  for (const idx of targetIndices) {
    const page = pdfPages[idx];
    if (!page) continue;
    const { width, height } = page.getSize();
    const x = pos.xPct * width;
    const y = height - pos.yPct * height; // PDF = origine bas-gauche
    page.drawText(text, {
      x: Math.max(0, x),
      y: Math.max(0, y),
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  const out = await pdfDoc.save();
  const blob = new Blob([out], { type: 'application/pdf' });
  const name = exportName('annotated');
  downloadBlob(blob, name);
  state.setLastExport({ type: 'annotated', name, size: blob.size, date: new Date().toISOString() });
  state.dispatch('toast', { type: 'success', msg: `Texte ajouté : ${formatSize(blob.size)}` });
}

// ─── MODAL SIGNATURE ──────────────────────────────────────────────────

export function openSignatureModal() {
  const page = _getPageThumb();
  if (!page) { state.addError('Importez des pages avant d\'ajouter une signature.'); return; }

  const thumbSrc = page.thumbDataUrl || '';
  let sigClickPos = { xPct: 0.5, yPct: 0.85 };

  const body = `
    <div class="editor-section">
      <div class="editor-label">Dessinez votre signature</div>
      <div class="sig-pad-wrap">
        <canvas id="sig-canvas" class="sig-canvas"></canvas>
      </div>
      <button class="btn btn-ghost btn-sm" id="sig-clear" style="margin-top:6px">Effacer</button>
    </div>
    <div class="editor-section">
      <div class="editor-label">Cliquez sur la page pour positionner la signature</div>
      <div class="editor-thumb-wrap" id="sig-thumb-wrap">
        <img src="${thumbSrc}" class="editor-thumb-img" draggable="false">
        <div id="sig-cursor" class="editor-cursor editor-cursor-sig" style="left:50%;top:85%"></div>
      </div>
      <div class="editor-row" style="margin-top:8px">
        <div class="input-group" style="width:120px">
          <label class="input-label">Largeur (px PDF)</label>
          <input id="sig-width" class="input-field" type="number" min="30" max="400" value="150">
        </div>
        <div class="input-group" style="flex:1">
          <label class="input-label">Appliquer sur</label>
          <select id="sig-pages" class="input-field">
            <option value="first">1ère page seulement</option>
            <option value="all">Toutes les pages</option>
            <option value="selection">Sélection</option>
          </select>
        </div>
      </div>
    </div>
  `;

  const modal = _createModal('Signature', body, async () => {
    const canvas = modal.querySelector('#sig-canvas');
    if (_isCanvasBlank(canvas)) throw new Error('Dessinez votre signature avant d\'appliquer.');
    const sigDataUrl = canvas.toDataURL('image/png');
    const sigWidth = parseInt(modal.querySelector('#sig-width').value) || 150;
    const scope = modal.querySelector('#sig-pages').value;
    await _applySignatureToPdf(sigDataUrl, sigClickPos, sigWidth, scope);
  });

  // Init canvas signature
  const canvas = modal.querySelector('#sig-canvas');
  _initSigPad(canvas);
  modal.querySelector('#sig-clear').addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Clic sur miniature → position
  const thumbWrap = modal.querySelector('#sig-thumb-wrap');
  const cursor = modal.querySelector('#sig-cursor');
  thumbWrap.addEventListener('click', e => {
    const rect = thumbWrap.getBoundingClientRect();
    sigClickPos = {
      xPct: (e.clientX - rect.left) / rect.width,
      yPct: (e.clientY - rect.top)  / rect.height,
    };
    cursor.style.left = (sigClickPos.xPct * 100) + '%';
    cursor.style.top  = (sigClickPos.yPct * 100) + '%';
  });
}

function _initSigPad(canvas) {
  canvas.width  = canvas.offsetWidth  || 400;
  canvas.height = canvas.offsetHeight || 140;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let drawing = false;
  let last = null;

  const getPos = e => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const start = e => {
    e.preventDefault();
    drawing = true;
    last = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
  };
  const move = e => {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last = pos;
  };
  const stop = () => { drawing = false; last = null; };

  canvas.addEventListener('mousedown',  start);
  canvas.addEventListener('mousemove',  move);
  canvas.addEventListener('mouseup',    stop);
  canvas.addEventListener('mouseleave', stop);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove',  move,  { passive: false });
  canvas.addEventListener('touchend',   stop);
}

function _isCanvasBlank(canvas) {
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return !data.some(v => v !== 0);
}

async function _applySignatureToPdf(sigDataUrl, pos, sigWidthPdf, scope) {
  const { PDFDocument } = window.PDFLib;
  if (!PDFDocument) throw new Error('pdf-lib non chargé.');

  const allPages = getExportPages();
  if (!allPages.length) throw new Error('Aucune page.');
  const rawBuffers = getRawBuffers();
  const bytes = await buildPdfFromRawPages(allPages, rawBuffers, () => {});
  const pdfDoc = await PDFDocument.load(bytes);

  // Embed signature PNG
  const sigResp = await fetch(sigDataUrl);
  const sigBuf  = await sigResp.arrayBuffer();
  const sigImg  = await pdfDoc.embedPng(new Uint8Array(sigBuf));
  const { width: imgW, height: imgH } = sigImg;
  const ratio = imgH / imgW;
  const sigH = sigWidthPdf * ratio;

  const pdfPages = pdfDoc.getPages();
  let targetIndices;
  if (scope === 'first') {
    targetIndices = [0];
  } else if (scope === 'selection') {
    const selIds = state.get().selectedPageIds;
    targetIndices = allPages.map((p, i) => selIds.includes(p.id) ? i : -1).filter(i => i >= 0);
  } else {
    targetIndices = pdfPages.map((_, i) => i);
  }

  for (const idx of targetIndices) {
    const page = pdfPages[idx];
    if (!page) continue;
    const { width, height } = page.getSize();
    const x = pos.xPct * width  - sigWidthPdf / 2;
    const y = height - pos.yPct * height - sigH / 2;
    page.drawImage(sigImg, {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width:  sigWidthPdf,
      height: sigH,
    });
  }

  const out = await pdfDoc.save();
  const blob = new Blob([out], { type: 'application/pdf' });
  const name = exportName('signed');
  downloadBlob(blob, name);
  state.setLastExport({ type: 'signed', name, size: blob.size, date: new Date().toISOString() });
  state.dispatch('toast', { type: 'success', msg: `Signature ajoutée : ${formatSize(blob.size)}` });
}

// ─── Utilitaires ─────────────────────────────────────────────────────

function _hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
