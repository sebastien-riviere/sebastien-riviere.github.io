// pdf-builder.js — Assemblage PDF final depuis les pages (pdf-lib)

import { imageDataUrlToJpegBytes, getImageDimensions } from './image-actions.js';
import { renderPageToCanvas } from './pdf-renderer.js';

function getPdfLib() {
  if (window.PDFLib) return window.PDFLib;
  throw new Error('pdf-lib non chargé. Vérifiez le fichier vendor/pdf-lib/pdf-lib.min.js.');
}

// Construit un PDF à partir des pages dans l'ordre donné
export async function buildPdfFromPages(pages, onProgress) {
  const PDFLib = getPdfLib();
  const { PDFDocument, degrees } = PDFLib;

  const outputDoc = await PDFDocument.create();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    onProgress?.(Math.round((i / pages.length) * 100));

    if (page.fileType === 'pdf') {
      await _copyPdfPage(outputDoc, page, PDFLib);
    } else {
      await _addImagePage(outputDoc, page, PDFLib);
    }
  }

  onProgress?.(100);
  const bytes = await outputDoc.save();
  return bytes;
}

async function _copyPdfPage(outputDoc, page, PDFLib) {
  const { degrees } = PDFLib;
  try {
    const srcDoc = await PDFLib.PDFDocument.load(page.pdfDoc._transport._networkStream?.getReader
      ? new Uint8Array(await _getPdfRawBytes(page))
      : await _getPdfRawBytes(page)
    );
    const [copied] = await outputDoc.copyPages(srcDoc, [page.pageIndex]);
    if (page.rotation !== 0) {
      const existing = copied.getRotation().angle;
      copied.setRotation(degrees((existing + page.rotation) % 360));
    }
    outputDoc.addPage(copied);
  } catch (err) {
    // Fallback : ajouter une page vide avec message si la copie échoue
    const blank = outputDoc.addPage([595, 842]);
    blank.drawText(`[Erreur page ${page.pageNumber} — ${page.fileName}]`, {
      x: 50, y: 400, size: 12,
    });
  }
}

async function _getPdfRawBytes(page) {
  // Récupère les bytes bruts depuis le fileObj via state
  // On passe par le pdfDoc chargé en mémoire : on reconstruit depuis le fichier original
  // Le fileObj.raw est un ArrayBuffer stocké par file-loader
  return page._rawBuffer || page.pdfDoc._pdfInfo?.rawData || new Uint8Array(0);
}

async function _addImagePage(outputDoc, page, PDFLib) {
  const { degrees } = PDFLib;
  const dataUrl = page.imageDataUrl;
  const { buf, w, h } = await imageDataUrlToJpegBytes(dataUrl);

  const jpgImage = await outputDoc.embedJpg(buf);
  const pdfPage = outputDoc.addPage([w, h]);

  if (page.rotation !== 0) {
    pdfPage.setRotation(degrees(page.rotation));
  }
  pdfPage.drawImage(jpgImage, { x: 0, y: 0, width: w, height: h });
}

// Builds a PDF à partir des bytes bruts des pages PDF originales
export async function buildPdfFromRawPages(pages, rawBuffers, onProgress) {
  const PDFLib = getPdfLib();
  const { PDFDocument, degrees } = PDFLib;

  const outputDoc = await PDFDocument.create();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    onProgress?.(Math.round((i / pages.length) * 100));

    if (page.fileType === 'pdf') {
      const rawBuffer = rawBuffers[page.fileId];
      if (!rawBuffer) continue;

      try {
        const srcDoc = await PDFDocument.load(new Uint8Array(rawBuffer));
        const [copied] = await outputDoc.copyPages(srcDoc, [page.pageIndex]);
        if (page.rotation !== 0) {
          const existing = copied.getRotation().angle;
          copied.setRotation(degrees((existing + page.rotation) % 360));
        }
        outputDoc.addPage(copied);
      } catch (err) {
        const blank = outputDoc.addPage([595, 842]);
        blank.drawText(`[Erreur — ${page.fileName} p.${page.pageNumber}]`, {
          x: 50, y: 400, size: 11,
        });
      }
    } else {
      await _addImagePage(outputDoc, page, PDFLib);
    }
  }

  onProgress?.(100);
  return await outputDoc.save();
}

// Ajoute une page blanche A4
export async function buildBlankPage() {
  const PDFLib = getPdfLib();
  const { PDFDocument } = PDFLib;
  const doc = await PDFDocument.create();
  doc.addPage([595.28, 841.89]);
  return await doc.save();
}
