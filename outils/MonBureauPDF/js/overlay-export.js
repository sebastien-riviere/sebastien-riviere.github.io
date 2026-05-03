// overlay-export.js — Exports avec overlays PDF (V1.5)

import { state } from './state.js';
import { buildPdfFromRawPages } from './pdf-builder.js';
import { getRawBuffers, getExportPages } from './pdf-actions.js';
import { renderPageToCanvas } from './pdf-renderer.js';
import { downloadBlob, exportName, formatSize } from './utils.js';
import {
  applyPageNumbers, applyWatermark, applyStamp,
  applyHeaderFooter, applyMetadata, toGrayscaleCanvas,
} from './overlay-actions.js';

async function _withProcessing(fn) {
  state.setMode('exporting');
  state.update({ isProcessing: true });
  try {
    await fn();
    state.setMode('done');
  } catch (err) {
    state.addError(err.message);
    state.setMode('error');
  } finally {
    state.update({ isProcessing: false });
    state.setProgress(0);
  }
}

// ─── Niveaux de gris ──────────────────────────────────────────────────

export async function exportGrayscale() {
  await _withProcessing(async () => {
    const { PDFDocument } = window.PDFLib;
    if (!PDFDocument) throw new Error('pdf-lib non chargé.');
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) throw new Error('PDF.js non chargé.');

    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');
    const rawBuffers = getRawBuffers();

    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < pages.length; i++) {
      state.setProgress(Math.round((i / pages.length) * 100));
      const page = pages[i];
      let canvas;
      if (page.fileType === 'pdf') {
        const buffer = rawBuffers[page.fileId];
        if (!buffer) throw new Error(`Buffer manquant pour ${page.fileName}`);
        const pdfSrc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        canvas = await renderPageToCanvas(pdfSrc, page.pageIndex + 1, page.rotation, 2.0);
      } else {
        canvas = await _imageToCanvas(page.imageDataUrl, page.rotation);
      }
      await toGrayscaleCanvas(canvas);
      const jpegBytes = await _canvasToBytes(canvas, 'image/jpeg', 0.92);
      const img = await pdfDoc.embedJpg(jpegBytes);
      const { width, height } = img.scale(1);
      const newPage = pdfDoc.addPage([width, height]);
      newPage.drawImage(img, { x: 0, y: 0, width, height });
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const name = exportName('grayscale');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'grayscale', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `Niveaux de gris : ${formatSize(blob.size)}` });
  });
}

// ─── Numérotation des pages ───────────────────────────────────────────

export async function exportWithPageNumbers(options = {}) {
  await _withProcessing(async () => {
    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');
    const rawBuffers = getRawBuffers();

    const bytes = await buildPdfFromRawPages(pages, rawBuffers, pct => state.setProgress(pct));
    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(bytes);
    await applyPageNumbers(pdfDoc, options);

    const out = await pdfDoc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    const name = exportName('numbered');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'numbered', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `Numérotation appliquée : ${formatSize(blob.size)}` });
  });
}

// ─── Filigrane ────────────────────────────────────────────────────────

export async function exportWithWatermark(text, options = {}) {
  await _withProcessing(async () => {
    if (!text?.trim()) throw new Error('Texte du filigrane vide.');
    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');
    const rawBuffers = getRawBuffers();

    const bytes = await buildPdfFromRawPages(pages, rawBuffers, pct => state.setProgress(pct));
    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(bytes);
    await applyWatermark(pdfDoc, { text, ...options });

    const out = await pdfDoc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    const name = exportName('watermark');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'watermark', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `Filigrane appliqué : ${formatSize(blob.size)}` });
  });
}

// ─── Tampon ───────────────────────────────────────────────────────────

export async function exportWithStamp(stampText) {
  await _withProcessing(async () => {
    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');
    const rawBuffers = getRawBuffers();

    const bytes = await buildPdfFromRawPages(pages, rawBuffers, pct => state.setProgress(pct));
    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(bytes);
    await applyStamp(pdfDoc, stampText);

    const out = await pdfDoc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    const name = exportName('stamp');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'stamp', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `Tampon "${stampText}" appliqué.` });
  });
}

// ─── En-tête / Pied de page ───────────────────────────────────────────

export async function exportWithHeaderFooter(options) {
  await _withProcessing(async () => {
    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');
    const rawBuffers = getRawBuffers();

    const bytes = await buildPdfFromRawPages(pages, rawBuffers, pct => state.setProgress(pct));
    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(bytes);
    await applyHeaderFooter(pdfDoc, options);

    const out = await pdfDoc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    const name = exportName('headerfooter');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'headerfooter', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `En-tête/pied appliqués : ${formatSize(blob.size)}` });
  });
}

// ─── Métadonnées ──────────────────────────────────────────────────────

export async function exportWithMetadata(meta) {
  await _withProcessing(async () => {
    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');
    const rawBuffers = getRawBuffers();

    const bytes = await buildPdfFromRawPages(pages, rawBuffers, pct => state.setProgress(pct));
    const { PDFDocument } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(bytes);
    applyMetadata(pdfDoc, meta);

    const out = await pdfDoc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    const name = exportName('pdf');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'pdf', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: 'Métadonnées appliquées.' });
  });
}

// ─── Séparer (1 PDF par page) ─────────────────────────────────────────

export async function exportSplit() {
  await _withProcessing(async () => {
    const JSZip = window.JSZip;
    if (!JSZip) throw new Error('JSZip non chargé.');
    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');
    const rawBuffers = getRawBuffers();

    const zip = new JSZip();
    for (let i = 0; i < pages.length; i++) {
      state.setProgress(Math.round((i / pages.length) * 100));
      const bytes = await buildPdfFromRawPages([pages[i]], rawBuffers);
      zip.file(`page_${String(i + 1).padStart(3, '0')}.pdf`, bytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' }, meta => {
      state.setProgress(meta.percent | 0);
    });
    const name = exportName('split');
    downloadBlob(zipBlob, name);
    state.setLastExport({ type: 'split', name, size: zipBlob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `${pages.length} PDF séparés : ${formatSize(zipBlob.size)}` });
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────

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

function _canvasToBytes(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas → bytes échoué.'));
      blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
    }, type, quality);
  });
}
