// file-loader.js — Import fichiers, drag & drop, parsing

import { state } from './state.js';
import { uniqueId, readFileAsArrayBuffer } from './utils.js';
import { renderPdfThumbnails } from './pdf-renderer.js';
import { imageToPage } from './image-actions.js';

// Tous les types MIME image que les navigateurs modernes supportent
const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/pjpeg',
  'image/png', 'image/webp', 'image/gif',
  'image/bmp', 'image/x-bmp', 'image/tiff', 'image/x-tiff',
  'image/avif', 'image/heic', 'image/heif',
  'image/svg+xml', 'image/jfif', 'image/x-jfif',
]);

const ACCEPTED_IMAGE_EXTS = new Set([
  '.jpg', '.jpeg', '.jfif', '.jpe',
  '.png', '.webp', '.gif',
  '.bmp', '.tiff', '.tif',
  '.avif', '.heic', '.heif',
  '.svg',
]);

function isAccepted(file) {
  if (file.type === 'application/pdf') return true;
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) return true;
  // Fallback extension (JFIF souvent reporté comme application/octet-stream)
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (ACCEPTED_IMAGE_EXTS.has(ext)) return true;
  // Toute image générique
  if (file.type.startsWith('image/')) return true;
  return false;
}

export async function loadFiles(files) {
  const fileArray = Array.from(files).filter(isAccepted);

  if (!fileArray.length) {
    state.addError('Aucun fichier compatible. Formats : PDF, JPG/JPEG/JFIF, PNG, WebP, GIF, BMP, TIFF, AVIF, SVG.');
    return;
  }

  state.setMode('loading');

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    // Progression globale du batch (barre + statut)
    state.setProgress(Math.round((i / fileArray.length) * 100));
    state.dispatch('mode:changed', { mode: 'loading', label: `${i + 1} / ${fileArray.length} — ${file.name}` });
    try {
      await loadSingleFile(file);
    } catch (err) {
      state.addError(`"${file.name}" : ${err.message}`);
    }
  }

  state.setProgress(0);
  state.setMode('ready');
  // Le dernier addPages() a déjà déclenché pages:changed, mais on force un refresh final
  state.dispatch('pages:changed');
}

async function loadSingleFile(file) {
  const fileId = uniqueId('file');
  const isPdf  = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const fileObj = {
    id:   fileId,
    name: file.name,
    type: isPdf ? 'pdf' : 'image',
    size: file.size,
    raw:  null,
  };

  if (isPdf) {
    // PDF : on a besoin du buffer brut pour pdf-lib et PDF.js
    const buffer = await readFileAsArrayBuffer(file);
    fileObj.raw  = buffer;
    state.addFile(fileObj);
    await renderPdfThumbnails(fileObj);
  } else {
    // Image : pas besoin du buffer brut (on passe par DataURL)
    // On n'alloue PAS d'ArrayBuffer → moins de mémoire consommée
    state.addFile(fileObj);
    await imageToPage(fileObj, file);
  }
}

export function initDropzone(dropEl, inputEl) {
  // Bouton import fichiers
  if (inputEl) {
    inputEl.addEventListener('change', e => {
      if (e.target.files?.length) {
        loadFiles(e.target.files);
        e.target.value = '';
      }
    });
  }

  if (!dropEl) return;

  // Drag & drop
  dropEl.addEventListener('dragover', e => {
    e.preventDefault();
    dropEl.classList.add('drag-over');
  });

  dropEl.addEventListener('dragleave', e => {
    if (!dropEl.contains(e.relatedTarget)) {
      dropEl.classList.remove('drag-over');
    }
  });

  dropEl.addEventListener('drop', e => {
    e.preventDefault();
    dropEl.classList.remove('drag-over');
    if (e.dataTransfer?.files?.length) {
      loadFiles(e.dataTransfer.files);
    }
  });

  // Clic sur la dropzone → ouvre le sélecteur
  // Exclure les clics sur les boutons (évite double ouverture du sélecteur)
  dropEl.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    if (e.target === dropEl || e.target.closest('.dropzone-inner')) {
      inputEl?.click();
    }
  });
}

// Drag & drop global sur la fenêtre
export function initGlobalDrop() {
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      loadFiles(e.dataTransfer.files);
    }
  });
}
