// compression-actions.js — Compression visuelle canvas

import { renderPageToCanvas } from './pdf-renderer.js';
import { state } from './state.js';

// Compresse toutes les pages en images JPEG puis reconstruit un PDF
export async function compressPages(pages, rawBuffers, quality, onProgress) {
  const PDFLib = window.PDFLib;
  if (!PDFLib) throw new Error('pdf-lib non chargé.');

  const { PDFDocument, degrees } = PDFLib;
  const outputDoc = await PDFDocument.create();
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error('PDF.js non chargé.');

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    onProgress?.(Math.round((i / pages.length) * 100));

    try {
      let canvas;

      if (page.fileType === 'pdf') {
        const buffer = rawBuffers[page.fileId];
        if (!buffer) continue;
        const pdfDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
        canvas = await renderPageToCanvas(pdfDoc, page.pageIndex + 1, page.rotation, 1.5);
      } else {
        canvas = await _imageToCanvas(page.imageDataUrl, page.rotation);
      }

      const jpegBlob = await _canvasToJpegBlob(canvas, quality);
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const jpgImage = await outputDoc.embedJpg(jpegBytes);

      const pdfPage = outputDoc.addPage([canvas.width, canvas.height]);
      pdfPage.drawImage(jpgImage, { x: 0, y: 0, width: canvas.width, height: canvas.height });
    } catch (err) {
      const blank = outputDoc.addPage([595, 842]);
      blank.drawText(`[Erreur compression page ${i + 1}]`, { x: 50, y: 400, size: 11 });
    }
  }

  onProgress?.(100);
  return await outputDoc.save();
}

function _canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Impossible de convertir la page en image.'));
    }, 'image/jpeg', quality);
  });
}

function _imageToCanvas(dataUrl, rotation = 0) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const canvas = document.createElement('canvas');

      if (rotation === 90 || rotation === 270) {
        canvas.width = h;
        canvas.height = w;
      } else {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2);
      resolve(canvas);
    };
    img.src = dataUrl;
  });
}
