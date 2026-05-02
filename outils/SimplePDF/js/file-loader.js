// file-loader.js — Import fichiers, drag & drop, parsing

import { state } from './state.js';
import { uniqueId, readFileAsArrayBuffer } from './utils.js';
import { renderPdfThumbnails } from './pdf-renderer.js';
import { imageToPage } from './image-actions.js';

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

function isAccepted(file) {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

export async function loadFiles(files) {
  const fileArray = Array.from(files).filter(isAccepted);

  if (!fileArray.length) {
    state.addError('Aucun fichier compatible. Formats acceptés : PDF, JPG, PNG, WebP.');
    return;
  }

  state.setMode('loading');

  for (const file of fileArray) {
    try {
      await loadSingleFile(file);
    } catch (err) {
      state.addError(`Impossible de charger "${file.name}" : ${err.message}`);
    }
  }

  state.setMode('ready');
  state.dispatch('pages:changed');
}

async function loadSingleFile(file) {
  const fileId = uniqueId('file');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const fileObj = {
    id: fileId,
    name: file.name,
    type: isPdf ? 'pdf' : 'image',
    size: file.size,
    raw: null,
  };

  const buffer = await readFileAsArrayBuffer(file);
  fileObj.raw = buffer;
  state.addFile(fileObj);

  if (isPdf) {
    await renderPdfThumbnails(fileObj);
  } else {
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
  dropEl.addEventListener('click', e => {
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
