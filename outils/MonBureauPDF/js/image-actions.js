// image-actions.js — Conversion images vers pages PDF

import { state } from './state.js';
import { uniqueId, readFileAsDataURL } from './utils.js';

// Taille max pour le stockage en mémoire (export complet conserve la résolution d'origine)
const THUMB_MAX_W = 160;
const THUMB_MAX_H = 200;
const STORAGE_MAX_W = 3000; // résolution de stockage raisonnable pour fichiers très grands

export async function imageToPage(fileObj, file) {
  const dataUrl = await readFileAsDataURL(file);

  // Miniature (petite, pour la grille)
  const thumb = await _resizeDataUrl(dataUrl, THUMB_MAX_W, THUMB_MAX_H, 0.78);

  // Version stockée : résolution complète si raisonnable, sinon réduite à STORAGE_MAX_W
  // On vérifie les dimensions avant de décider
  const dims = await _getDimensions(dataUrl);
  const storageUrl = dims.w > STORAGE_MAX_W
    ? await _resizeDataUrl(dataUrl, STORAGE_MAX_W, Infinity, 0.92)
    : dataUrl;

  const page = {
    id:           uniqueId('page'),
    fileId:       fileObj.id,
    fileName:     fileObj.name,
    fileType:     'image',
    pageIndex:    0,
    pageNumber:   1,
    rotation:     0,
    modified:     false,
    thumbDataUrl: thumb,
    imageDataUrl: storageUrl,
    pdfDoc:       null,
  };

  state.addPages([page]);
}

// Redimensionne une image (dataUrl) en conservant le ratio
function _resizeDataUrl(dataUrl, maxW, maxH, quality = 0.85) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(
        maxW  === Infinity ? 1 : maxW  / img.width,
        maxH  === Infinity ? 1 : maxH  / img.height,
        1, // ne pas agrandir
      );
      const w = Math.max(1, Math.round(img.width  * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      // PNG pour les images avec transparence (PNG/SVG/GIF), JPEG sinon
      const isPng = dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/svg') || dataUrl.startsWith('data:image/gif');
      resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback : retourner l'original
    img.src = dataUrl;
  });
}

function _getDimensions(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve({ w: img.width,  h: img.height });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = dataUrl;
  });
}

// Convertit une image dataUrl en bytes JPEG pour pdf-lib
// Pas de limite de résolution — on utilise la taille réelle de l'image stockée
export async function imageDataUrlToJpegBytes(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(
        blob => blob.arrayBuffer().then(buf => resolve({ buf: new Uint8Array(buf), w: img.width, h: img.height })),
        'image/jpeg',
        0.92,
      );
    };
    img.src = dataUrl;
  });
}

// Dimensions naturelles d'une image dataUrl
export function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 595, height: 842 });
    img.src = dataUrl;
  });
}
