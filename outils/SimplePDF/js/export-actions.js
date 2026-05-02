// export-actions.js — Exports PDF, PNG ZIP, JPG ZIP, TXT

import { state } from './state.js';
import { buildPdfFromRawPages } from './pdf-builder.js';
import { getRawBuffers, getExportPages, getSelectionPages } from './pdf-actions.js';
import { extractTextFromPages } from './text-actions.js';
import { compressPages } from './compression-actions.js';
import { downloadBlob, exportName, formatSize } from './utils.js';
import { renderPageToCanvas } from './pdf-renderer.js';

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

export async function exportPdf(selectionOnly = false) {
  await _withProcessing(async () => {
    const pages = selectionOnly ? getSelectionPages() : getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');

    const rawBuffers = getRawBuffers();
    const bytes = await buildPdfFromRawPages(pages, rawBuffers, pct => state.setProgress(pct));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const name = exportName(selectionOnly ? 'selection' : 'pdf');

    downloadBlob(blob, name);
    state.setLastExport({ type: 'pdf', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `Export PDF terminé : ${formatSize(blob.size)}` });
  });
}

export async function exportPngZip() {
  await _withProcessing(async () => {
    const JSZip = window.JSZip;
    if (!JSZip) throw new Error('JSZip non chargé. Vérifiez vendor/jszip/jszip.min.js.');

    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');

    const zip = new JSZip();
    const rawBuffers = getRawBuffers();
    const pdfjsLib = window.pdfjsLib;

    for (let i = 0; i < pages.length; i++) {
      state.setProgress(Math.round((i / pages.length) * 100));
      const page = pages[i];
      const canvas = await _renderPageCanvas(page, rawBuffers, pdfjsLib);
      const blob = await _canvasToBlob(canvas, 'image/png', 1);
      zip.file(`page_${String(i + 1).padStart(3, '0')}.png`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' }, meta => {
      state.setProgress(meta.percent | 0);
    });
    const name = exportName('pngzip');
    downloadBlob(zipBlob, name);
    state.setLastExport({ type: 'png-zip', name, size: zipBlob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `Export PNG ZIP terminé : ${formatSize(zipBlob.size)}` });
  });
}

export async function exportJpgZip() {
  await _withProcessing(async () => {
    const JSZip = window.JSZip;
    if (!JSZip) throw new Error('JSZip non chargé. Vérifiez vendor/jszip/jszip.min.js.');

    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');

    const quality = state.get().settings.jpgQuality;
    const zip = new JSZip();
    const rawBuffers = getRawBuffers();
    const pdfjsLib = window.pdfjsLib;

    for (let i = 0; i < pages.length; i++) {
      state.setProgress(Math.round((i / pages.length) * 100));
      const page = pages[i];
      const canvas = await _renderPageCanvas(page, rawBuffers, pdfjsLib);
      const blob = await _canvasToBlob(canvas, 'image/jpeg', quality);
      zip.file(`page_${String(i + 1).padStart(3, '0')}.jpg`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' }, meta => {
      state.setProgress(meta.percent | 0);
    });
    const name = exportName('jpgzip');
    downloadBlob(zipBlob, name);
    state.setLastExport({ type: 'jpg-zip', name, size: zipBlob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: `Export JPG ZIP terminé : ${formatSize(zipBlob.size)}` });
  });
}

export async function exportText() {
  await _withProcessing(async () => {
    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');

    const rawBuffers = getRawBuffers();
    const text = await extractTextFromPages(pages, rawBuffers);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const name = exportName('text');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'text', name, size: blob.size, date: new Date().toISOString() });
    state.dispatch('toast', { type: 'success', msg: 'Extraction texte terminée.' });
  });
}

export async function exportCompressed(quality) {
  await _withProcessing(async () => {
    const pages = getExportPages();
    if (!pages.length) throw new Error('Aucune page à exporter.');

    const rawBuffers = getRawBuffers();
    const bytes = await compressPages(pages, rawBuffers, quality, pct => state.setProgress(pct));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const name = exportName('compressed');
    downloadBlob(blob, name);
    state.setLastExport({ type: 'compressed', name, size: blob.size, date: new Date().toISOString() });

    const orig = state.get().stats.initialSize;
    const delta = orig > 0 ? Math.round(((blob.size - orig) / orig) * 100) : 0;
    const sign = delta > 0 ? '+' : '';
    state.dispatch('toast', { type: 'success', msg: `Compression terminée : ${formatSize(blob.size)} (${sign}${delta}%)` });
  });
}

async function _renderPageCanvas(page, rawBuffers, pdfjsLib) {
  if (page.fileType === 'pdf') {
    if (!pdfjsLib) throw new Error('PDF.js non chargé.');
    const buffer = rawBuffers[page.fileId];
    if (!buffer) throw new Error(`Buffer manquant pour ${page.fileName}`);
    const pdfDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
    return await renderPageToCanvas(pdfDoc, page.pageIndex + 1, page.rotation, 2.0);
  } else {
    return await _imageToCanvas(page.imageDataUrl, page.rotation);
  }
}

function _imageToCanvas(dataUrl, rotation = 0) {
  return new Promise((resolve) => {
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

function _canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Conversion canvas échouée.')), type, quality);
  });
}
