// overlay-actions.js — Numérotation, filigrane, tampons, en-tête/pied (V1.5)
// Architecture prête — fonctions actives en V1.5

export const STAMPS = ['BROUILLON', 'CONFIDENTIEL', 'VALIDÉ', 'À SIGNER', 'URGENT'];

// Applique la numérotation sur toutes les pages d'un PDFDocument pdf-lib
export async function applyPageNumbers(pdfDoc, options = {}) {
  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
  const {
    format = 'Page {n} / {total}',
    fontSize = 10,
    color = [0.2, 0.2, 0.2],
  } = options;

  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const total = pages.length;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const text = format.replace('{n}', i + 1).replace('{total}', total);
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: 18,
      size: fontSize,
      font,
      color: rgb(...color),
    });
  }
}

// Applique un filigrane texte centré sur toutes les pages
export async function applyWatermark(pdfDoc, options = {}) {
  const { rgb, degrees, StandardFonts } = window.PDFLib;
  const {
    text = 'CONFIDENTIEL',
    opacity = 0.15,
    diagonal = true,
    fontSize = 48,
    color = [0.5, 0.5, 0.5],
  } = options;

  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: (height - fontSize) / 2,
      size: fontSize,
      font,
      color: rgb(...color),
      opacity,
      rotate: diagonal ? degrees(45) : degrees(0),
    });
  }
}

// Applique un tampon prédéfini
export async function applyStamp(pdfDoc, stampText, options = {}) {
  const stampColors = {
    'BROUILLON': [0.6, 0.6, 0.6],
    'CONFIDENTIEL': [0.7, 0, 0],
    'VALIDÉ': [0, 0.5, 0.2],
    'À SIGNER': [0, 0.3, 0.7],
    'URGENT': [0.85, 0.2, 0],
  };

  const color = stampColors[stampText] || [0.4, 0.4, 0.4];
  return applyWatermark(pdfDoc, {
    text: stampText,
    opacity: options.opacity || 0.18,
    diagonal: true,
    fontSize: 56,
    color,
  });
}

// Applique en-tête et pied de page
export async function applyHeaderFooter(pdfDoc, options = {}) {
  const { rgb, StandardFonts } = window.PDFLib;
  const {
    headerLeft = '', headerCenter = '', headerRight = '',
    footerLeft = '', footerCenter = '', footerRight = '',
    fontSize = 9,
    color = [0.3, 0.3, 0.3],
  } = options;

  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const margin = 20;

    const drawRow = (left, center, right, y) => {
      if (left) page.drawText(left, { x: margin, y, size: fontSize, font, color: rgb(...color) });
      if (center) {
        const tw = font.widthOfTextAtSize(center, fontSize);
        page.drawText(center, { x: (width - tw) / 2, y, size: fontSize, font, color: rgb(...color) });
      }
      if (right) {
        const tw = font.widthOfTextAtSize(right, fontSize);
        page.drawText(right, { x: width - margin - tw, y, size: fontSize, font, color: rgb(...color) });
      }
    };

    drawRow(headerLeft, headerCenter, headerRight, height - margin - fontSize);
    drawRow(footerLeft, footerCenter, footerRight, margin);
  }
}

// Définit les métadonnées PDF
export function applyMetadata(pdfDoc, meta = {}) {
  if (meta.title) pdfDoc.setTitle(meta.title);
  if (meta.author) pdfDoc.setAuthor(meta.author);
  if (meta.subject) pdfDoc.setSubject(meta.subject);
  if (meta.keywords) pdfDoc.setKeywords(meta.keywords.split(',').map(k => k.trim()));
}

// Convertit les pages en niveaux de gris (approximation via canvas)
export async function toGrayscaleCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
