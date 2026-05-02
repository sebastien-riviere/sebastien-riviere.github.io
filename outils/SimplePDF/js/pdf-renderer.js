// pdf-renderer.js — PDF.js, rendu miniatures canvas

import { state } from './state.js';
import { uniqueId } from './utils.js';

let _pdfjsLib = null;

function getPdfjsLib() {
  if (_pdfjsLib) return _pdfjsLib;
  if (window.pdfjsLib) {
    _pdfjsLib = window.pdfjsLib;
    return _pdfjsLib;
  }
  throw new Error('PDF.js non chargé. Vérifiez le fichier vendor/pdfjs/pdf.min.mjs.');
}

export async function renderPdfThumbnails(fileObj) {
  const pdfjsLib = getPdfjsLib();

  let pdfDoc;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: fileObj.raw.slice(0) });
    pdfDoc = await loadingTask.promise;
  } catch (err) {
    if (err.name === 'PasswordException') {
      throw new Error('Ce PDF est protégé par un mot de passe. SimplePDF ne supporte pas les PDF chiffrés.');
    }
    throw new Error(`Impossible d'ouvrir le PDF : ${err.message}`);
  }

  const numPages = pdfDoc.numPages;
  const pages = [];

  for (let i = 1; i <= numPages; i++) {
    state.setProgress(Math.round((i / numPages) * 100));
    const thumbDataUrl = await renderPageThumbnail(pdfDoc, i);
    pages.push({
      id: uniqueId('page'),
      fileId: fileObj.id,
      fileName: fileObj.name,
      fileType: 'pdf',
      pageIndex: i - 1,
      pageNumber: i,
      rotation: 0,
      modified: false,
      thumbDataUrl,
      pdfDoc,
    });
  }

  state.addPages(pages);
  state.setProgress(0);
}

async function renderPageThumbnail(pdfDoc, pageNum, scale = 0.35) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas.toDataURL('image/jpeg', 0.75);
}

export async function renderPageFull(pdfDoc, pageNum, rotation = 0, scale = 1.5) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale, rotation });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas;
}

export async function renderPageToCanvas(pdfDoc, pageNum, rotation = 0, scale = 2.0) {
  return renderPageFull(pdfDoc, pageNum, rotation, scale);
}

export async function getPdfPageCount(arrayBuffer) {
  const pdfjsLib = getPdfjsLib();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
  const pdfDoc = await loadingTask.promise;
  return pdfDoc.numPages;
}
