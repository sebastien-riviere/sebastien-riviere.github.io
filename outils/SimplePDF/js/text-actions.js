// text-actions.js — Extraction texte PDF

export async function extractTextFromPages(pages, rawBuffers) {
  let pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error('PDF.js non chargé.');

  const pdfPages = pages.filter(p => p.fileType === 'pdf');
  if (!pdfPages.length) throw new Error('Aucune page PDF dans la sélection. Les images ne contiennent pas de texte extractible.');

  // Grouper par fileId pour éviter de recharger le même PDF plusieurs fois
  const byFile = {};
  for (const p of pdfPages) {
    if (!byFile[p.fileId]) byFile[p.fileId] = [];
    byFile[p.fileId].push(p);
  }

  const textParts = [];

  for (const [fileId, filePages] of Object.entries(byFile)) {
    const buffer = rawBuffers[fileId];
    if (!buffer) continue;

    let pdfDoc;
    try {
      pdfDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
    } catch (err) {
      textParts.push(`[Erreur lecture fichier : ${filePages[0].fileName}]`);
      continue;
    }

    for (const page of filePages) {
      try {
        const pdfPage = await pdfDoc.getPage(page.pageIndex + 1);
        const content = await pdfPage.getTextContent();
        const lines = content.items.map(item => item.str).join(' ').trim();
        if (lines) {
          textParts.push(`--- Page ${page.pageNumber} (${page.fileName}) ---`);
          textParts.push(lines);
          textParts.push('');
        } else {
          textParts.push(`--- Page ${page.pageNumber} (${page.fileName}) ---`);
          textParts.push('[Page sans texte extractible — peut-être un scan ou une image]');
          textParts.push('');
        }
      } catch (_) {
        textParts.push(`[Erreur page ${page.pageNumber}]`);
      }
    }
  }

  if (!textParts.length) {
    throw new Error('Aucun texte extractible. Ce PDF est probablement un scan. L\'OCR n\'est pas inclus dans SimplePDF.');
  }

  return textParts.join('\n');
}
