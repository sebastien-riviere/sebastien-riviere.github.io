// app.js — Initialisation générale, wiring modules

import { state } from './state.js';
import { initDropzone, initGlobalDrop, loadFiles } from './file-loader.js';
import {
  deleteSelectedPages, rotateSelectedLeft, rotateSelectedRight,
} from './pdf-actions.js';
import {
  exportPdf, exportPngZip, exportJpgZip, exportText, exportCompressed,
} from './export-actions.js';
import {
  exportGrayscale, exportWithPageNumbers, exportWithWatermark,
  exportWithStamp, exportWithHeaderFooter, exportWithMetadata, exportSplit,
} from './overlay-export.js';
import { openTextModal, openSignatureModal, initEditorView } from './editor-modal.js';
import {
  renderGrid, renderStats, renderLastExport, renderProgress,
  updateActionButtons, setStatus, showToast,
  initCompressionSlider, initJpgQualitySlider, renderPresets, renderErrors,
  setViewMode,
} from './ui.js';
function init() {
  state.loadSettings();
  _wireDOMEvents();
  _wireStateEvents();
  _initSortable();
  renderPresets();
  initCompressionSlider();
  initJpgQualitySlider();
  initEditorView();
  _initWatermarkSliders();
  _initCompressionHint();
  _initViewToggle();
  updateActionButtons();
  setStatus('ready');

  const fileInput = document.getElementById('file-input');
  const dropzone = document.getElementById('dropzone');
  initDropzone(dropzone, fileInput);
  initGlobalDrop();

  console.log('MonBureauPDF initialisé.');
}

function _wireDOMEvents() {
  // Bouton importer
  _on('btn-import', 'click', () => document.getElementById('file-input')?.click());

  // Toggles sidebars mobile
  _on('btn-sidebar-left',  'click', () => _toggleSidebar('left'));
  _on('btn-sidebar-right', 'click', () => _toggleSidebar('right'));
  document.getElementById('sidebar-overlay')?.addEventListener('click', _closeAllSidebars);

  // Sélection
  _on('btn-select-all', 'click', () => state.selectAll());
  _on('btn-clear-selection', 'click', () => state.clearSelection());

  // Actions pages
  _on('btn-delete-selection', 'click', () => deleteSelectedPages());
  _on('btn-rotate-left-sel', 'click', () => rotateSelectedLeft());
  _on('btn-rotate-right-sel', 'click', () => rotateSelectedRight());

  // Exports
  _on('btn-export-pdf', 'click', () => exportPdf(false));
  _on('btn-extract-selection', 'click', () => exportPdf(true));
  _on('btn-export-png', 'click', () => exportPngZip());
  _on('btn-export-jpg', 'click', () => exportJpgZip());
  _on('btn-export-text', 'click', () => exportText());
  _on('btn-export-compressed', 'click', () => {
    const q = state.get().settings.compressionQuality;
    exportCompressed(q);
  });

  // Éditeur texte + signature
  _on('btn-add-text',  'click', () => openTextModal());
  _on('btn-signature', 'click', () => openSignatureModal());

  // Outils V1.5
  _on('btn-grayscale',    'click', () => exportGrayscale());
  _on('btn-split',        'click', () => exportSplit());
  _on('btn-page-numbers', 'click', () => exportWithPageNumbers());
  _on('btn-watermark',    'click', () => {
    const text     = document.getElementById('wm-text')?.value?.trim() || 'CONFIDENTIEL';
    const opacity  = (parseInt(document.getElementById('wm-opacity')?.value) || 15) / 100;
    const fontSize = parseInt(document.getElementById('wm-size')?.value) || 48;
    const color    = document.getElementById('wm-color')?.value || '#808080';
    const diagonal = document.getElementById('wm-diagonal')?.checked ?? true;
    exportWithWatermark(text, { opacity, fontSize, color, diagonal });
  });
  _on('btn-stamp', 'click', () => {
    const sel = document.getElementById('stamp-select');
    if (sel) exportWithStamp(sel.value);
  });
  _on('btn-header-footer', 'click', () => {
    const header = prompt('Texte en-tête (centre) :', '');
    if (header === null) return;
    const footer = prompt('Texte pied de page (centre) :', '');
    if (footer === null) return;
    exportWithHeaderFooter({ headerCenter: header, footerCenter: footer });
  });
  _on('btn-metadata', 'click', () => {
    const title  = prompt('Titre du document :', '');
    if (title === null) return;
    const author = prompt('Auteur :', '');
    if (author === null) return;
    exportWithMetadata({ title, author });
  });

  // Vider espace
  _on('btn-clear-workspace', 'click', () => {
    if (!state.getPages().length) return;
    if (confirm('Vider l\'espace de travail ? Toutes les pages seront supprimées.')) {
      state.clearWorkspace();
    }
  });
}

function _wireStateEvents() {
  document.addEventListener('MonBureauPDF:pages:changed', () => {
    renderGrid();
    renderStats();
    updateActionButtons();
  });

  document.addEventListener('MonBureauPDF:selection:changed', () => {
    renderGrid();
    renderStats();
    updateActionButtons();
  });

  document.addEventListener('MonBureauPDF:mode:changed', e => {
    setStatus(e.detail.mode);
    updateActionButtons();
  });

  document.addEventListener('MonBureauPDF:progress:changed', e => {
    renderProgress(e.detail.pct);
  });

  document.addEventListener('MonBureauPDF:export:done', () => {
    renderLastExport();
    renderStats();
  });

  document.addEventListener('MonBureauPDF:error:added', () => {
    renderErrors();
  });

  document.addEventListener('MonBureauPDF:workspace:cleared', () => {
    renderGrid();
    renderStats();
    renderLastExport();
    updateActionButtons();
    setStatus('ready');
  });

  document.addEventListener('MonBureauPDF:toast', e => {
    showToast(e.detail.msg, e.detail.type);
  });
}

function _initSortable() {
  const grid = document.getElementById('pages-grid');
  if (!grid) return;

  // SortableJS chargé en global (vendor)
  if (typeof Sortable === 'undefined' && typeof window.Sortable === 'undefined') {
    console.warn('SortableJS non disponible — drag & drop désactivé.');
    return;
  }

  const SortableLib = typeof Sortable !== 'undefined' ? Sortable : window.Sortable;

  SortableLib.create(grid, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    draggable: '.page-card',
    onEnd: () => {
      const newOrder = [];
      grid.querySelectorAll('.page-card').forEach(card => {
        const pageId = card.dataset.pageId;
        const page = state.getPages().find(p => p.id === pageId);
        if (page) newOrder.push(page);
      });
      state.reorderPages(newOrder);
      renderStats();
    },
  });
}

function _on(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

function _toggleSidebar(side) {
  const sidebar = document.querySelector(`.sidebar-${side}`);
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  const isOpen = sidebar.classList.toggle('open');
  const otherSide = side === 'left' ? 'right' : 'left';
  document.querySelector(`.sidebar-${otherSide}`)?.classList.remove('open');
  if (overlay) overlay.classList.toggle('visible', isOpen);
}

function _closeAllSidebars() {
  document.querySelector('.sidebar-left')?.classList.remove('open');
  document.querySelector('.sidebar-right')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('visible');
}

// ─── Filigrane sliders ────────────────────────────────────────────────

function _initWatermarkSliders() {
  const bindSlider = (id, valId, suffix) => {
    const sl = document.getElementById(id);
    const vl = document.getElementById(valId);
    if (!sl || !vl) return;
    sl.addEventListener('input', () => { vl.textContent = sl.value + suffix; });
  };
  bindSlider('wm-opacity', 'wm-opacity-val', '%');
  bindSlider('wm-size',    'wm-size-val',    'pt');
}

// ─── Indice qualité compression ───────────────────────────────────────

const _compressionHints = [
  [10, 30, 'Compression maximale — texte flou, scans uniquement'],
  [31, 55, 'Compression forte — qualité réduite visible'],
  [56, 75, 'Équilibre taille / qualité — recommandé'],
  [76, 88, 'Haute qualité — fichier légèrement plus grand'],
  [89, 95, 'Qualité maximale — gain minimal'],
];

function _initCompressionHint() {
  const sl   = document.getElementById('compression-slider');
  const hint = document.getElementById('compression-hint');
  if (!sl || !hint) return;
  const update = () => {
    const v = parseInt(sl.value);
    const found = _compressionHints.find(([min, max]) => v >= min && v <= max);
    hint.textContent = found ? found[2] : '';
  };
  sl.addEventListener('input', update);
  update();
}

// ─── Bascule vue grille ───────────────────────────────────────────────

function _initViewToggle() {
  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setViewMode(btn.dataset.view);
    });
  });
}

// Démarrage
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
