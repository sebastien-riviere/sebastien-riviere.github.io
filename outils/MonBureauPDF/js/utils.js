// utils.js — Utilitaires partagés

export function formatSize(bytes) {
  if (bytes === 0) return '0 o';
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
}

export function formatDelta(before, after) {
  if (!before || !after) return null;
  const diff = after - before;
  const pct = Math.round((diff / before) * 100);
  const sign = diff > 0 ? '+' : '';
  return { bytes: diff, pct, label: `${sign}${formatSize(Math.abs(diff))} (${sign}${pct}%)` };
}

let _counter = 0;
export function uniqueId(prefix = 'id') {
  return `${prefix}_${++_counter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1000);
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function shortDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function exportName(type) {
  const map = {
    pdf:          'MonBureauPDF_export.pdf',
    selection:    'MonBureauPDF_selection.pdf',
    compressed:   'MonBureauPDF_compressed.pdf',
    pngzip:       'MonBureauPDF_pages_png.zip',
    jpgzip:       'MonBureauPDF_pages_jpg.zip',
    jpgzip_sel:   'MonBureauPDF_selection_jpg.zip',
    text:         'MonBureauPDF_text.txt',
    grayscale:    'MonBureauPDF_grayscale.pdf',
    numbered:     'MonBureauPDF_numbered.pdf',
    watermark:    'MonBureauPDF_watermark.pdf',
    stamp:        'MonBureauPDF_stamp.pdf',
    headerfooter: 'MonBureauPDF_headerfooter.pdf',
    metadata:     'MonBureauPDF_export.pdf',
    annotated:    'MonBureauPDF_annote.pdf',
    signed:       'MonBureauPDF_signe.pdf',
    split:        'MonBureauPDF_pages_split.zip',
  };
  return map[type] || `MonBureauPDF_${type}.pdf`;
}

export function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Impossible de lire le fichier : ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Impossible de lire le fichier : ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
