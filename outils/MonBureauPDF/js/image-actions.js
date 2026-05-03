// image-actions.js — Conversion images vers pages PDF

import { state } from './state.js';
import { uniqueId, readFileAsDataURL } from './utils.js';

export async function imageToPage(fileObj, file) {
  const dataUrl = await readFileAsDataURL(file);
  const thumb = await resizeImageDataUrl(dataUrl, 140, 180);

  const page = {
    id: uniqueId('page'),
    fileId: fileObj.id,
    fileName: fileObj.name,
    fileType: 'image',
    pageIndex: 0,
    pageNumber: 1,
    rotation: 0,
    modified: false,
    thumbDataUrl: thumb,
    imageDataUrl: dataUrl,
    pdfDoc: null,
  };

  state.addPages([page]);
}

function resizeImageDataUrl(dataUrl, maxW, maxH) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Convertit une image dataUrl en bytes JPEG pour pdf-lib
export async function imageDataUrlToJpegBytes(dataUrl, maxW = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxW) {
        h = Math.round(h * maxW / w);
        w = maxW;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        blob.arrayBuffer().then(buf => resolve({ buf: new Uint8Array(buf), w, h }));
      }, 'image/jpeg', 0.9);
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
