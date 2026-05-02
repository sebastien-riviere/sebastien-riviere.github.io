// ui.js — Rendu interface, handlers, messages

import { state } from './state.js';
import { formatSize, formatDelta } from './utils.js';
import {
  deleteSelectedPages, rotatePageLeft, rotatePageRight,
  rotateSelectedLeft, rotateSelectedRight,
} from './pdf-actions.js';
import {
  exportPdf, exportPngZip, exportJpgZip, exportText, exportCompressed,
} from './export-actions.js';
import { runPreset, PRESETS } from './presets.js';

// ─── Status ───────────────────────────────────────────────────────────

const STATUS_LABELS = {
  ready: 'Prêt',
  loading: 'Chargement…',
  processing: 'Traitement…',
  exporting: 'Export en cours…',
  done: 'Terminé',
  error: 'Erreur',
};

export function setStatus(mode, label) {
  const el = document.getElementById('status-bar');
  if (!el) return;
  el.className = `status-bar status-${mode}`;
  const dot = el.querySelector('.status-dot');
  const txt = el.querySelector('.status-text');
  if (txt) txt.textContent = label || STATUS_LABELS[mode] || mode;
}

// ─── Toast ────────────────────────────────────────────────────────────

export function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 300ms';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ─── Grille pages ─────────────────────────────────────────────────────

export function renderGrid() {
  const grid = document.getElementById('pages-grid');
  const dropzone = document.getElementById('dropzone');
  if (!grid) return;

  const pages = state.getPages();
  const selectedIds = state.get().selectedPageIds;

  if (!pages.length) {
    grid.style.display = 'none';
    if (dropzone) dropzone.style.display = 'flex';
    return;
  }

  grid.style.display = 'flex';
  if (dropzone) dropzone.style.display = 'none';

  // Reconstruction partielle : ne re-créer que ce qui a changé
  const existingCards = new Map();
  grid.querySelectorAll('.page-card').forEach(el => {
    existingCards.set(el.dataset.pageId, el);
  });

  const newIds = new Set(pages.map(p => p.id));

  // Supprimer cartes obsolètes
  existingCards.forEach((el, id) => {
    if (!newIds.has(id)) el.remove();
  });

  // Ajouter/mettre à jour dans l'ordre
  pages.forEach((page, idx) => {
    let card = existingCards.get(page.id);
    if (!card) {
      card = _createPageCard(page);
      grid.appendChild(card);
    }
    // Mettre à jour état
    _updatePageCard(card, page, idx + 1, selectedIds.includes(page.id));
  });

  // Remettre dans le bon ordre DOM
  pages.forEach(page => {
    const card = grid.querySelector(`[data-page-id="${page.id}"]`);
    if (card) grid.appendChild(card);
  });
}

function _createPageCard(page) {
  const card = document.createElement('div');
  card.className = 'page-card';
  card.dataset.pageId = page.id;

  card.innerHTML = `
    <div class="page-card-checkbox">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="2,6 5,9 10,3"/>
      </svg>
    </div>
    <div class="page-card-badge">modifié</div>
    <div class="page-card-thumb-wrap">
      <div class="page-card-thumb-placeholder skeleton"></div>
    </div>
    <div class="page-card-footer">
      <div class="page-card-num"></div>
      <div class="page-card-source truncate"></div>
    </div>
    <div class="page-card-actions">
      <button class="btn btn-ghost btn-icon btn-sm" data-action="rotate-left" title="Rotation gauche">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 8a4 4 0 1 0 4-4H5"/>
          <polyline points="5,2 5,6 9,6"/>
        </svg>
      </button>
      <button class="btn btn-ghost btn-icon btn-sm" data-action="rotate-right" title="Rotation droite">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 8a4 4 0 1 1-4-4h3"/>
          <polyline points="11,2 11,6 7,6"/>
        </svg>
      </button>
      <button class="btn btn-ghost btn-icon btn-sm" data-action="delete" title="Supprimer">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="2,4 14,4"/>
          <path d="M5 4V2h6v2"/>
          <path d="M3 4l1 10h8l1-10"/>
        </svg>
      </button>
    </div>
  `;

  // Clic sur la carte → sélection
  card.addEventListener('click', e => {
    if (e.target.closest('[data-action]')) return;
    const mode = e.shiftKey ? 'range' : (e.ctrlKey || e.metaKey ? 'multi' : 'single');
    state.selectPage(page.id, mode);
  });

  // Actions boutons
  card.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.stopPropagation();
    const action = btn.dataset.action;
    if (action === 'rotate-left') rotatePageLeft(page.id);
    else if (action === 'rotate-right') rotatePageRight(page.id);
    else if (action === 'delete') {
      state.removePages([page.id]);
    }
  });

  return card;
}

function _updatePageCard(card, page, num, selected) {
  card.classList.toggle('selected', selected);
  card.classList.toggle('modified', page.modified);

  const numEl = card.querySelector('.page-card-num');
  const sourceEl = card.querySelector('.page-card-source');
  if (numEl) numEl.textContent = `Page ${num}`;
  if (sourceEl) sourceEl.textContent = page.fileName;

  // Miniature
  const thumbWrap = card.querySelector('.page-card-thumb-wrap');
  if (thumbWrap && page.thumbDataUrl && !thumbWrap.querySelector('img')) {
    const img = document.createElement('img');
    img.className = 'page-card-thumb';
    img.src = page.thumbDataUrl;
    img.style.transform = page.rotation ? `rotate(${page.rotation}deg)` : '';
    thumbWrap.innerHTML = '';
    thumbWrap.appendChild(img);
  } else if (thumbWrap && page.thumbDataUrl) {
    const img = thumbWrap.querySelector('img');
    if (img) img.style.transform = page.rotation ? `rotate(${page.rotation}deg)` : '';
  }
}

// ─── Stats ────────────────────────────────────────────────────────────

export function renderStats() {
  const s = state.get();
  const stats = s.stats;

  _setText('stat-files', stats.fileCount);
  _setText('stat-pages', stats.pageCount);
  _setText('stat-selected', stats.selectedCount);
  _setText('stat-size-in', formatSize(stats.initialSize));
  _setText('stat-size-out', stats.lastExportSize ? formatSize(stats.lastExportSize) : '—');

  const deltaEl = document.getElementById('stat-delta');
  if (deltaEl && stats.lastExportSize && stats.initialSize) {
    const d = formatDelta(stats.initialSize, stats.lastExportSize);
    if (d) {
      deltaEl.textContent = d.label;
      deltaEl.className = `stat-delta ${d.bytes < 0 ? 'positive' : 'negative'}`;
    }
  } else if (deltaEl) {
    deltaEl.textContent = '';
  }
}

// ─── Dernier export ───────────────────────────────────────────────────

export function renderLastExport() {
  const le = state.get().lastExport;
  const el = document.getElementById('last-export');
  if (!el) return;

  if (!le) {
    el.innerHTML = '<span class="text-muted text-xs">Aucun export pour cette session.</span>';
    return;
  }

  const d = new Date(le.date);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  el.innerHTML = `
    <div class="last-export">
      <div class="last-export-name">${le.name}</div>
      <div class="last-export-meta">${formatSize(le.size)} · ${time}</div>
    </div>
  `;
}

// ─── Progress ─────────────────────────────────────────────────────────

export function renderProgress(pct) {
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = pct + '%';
  const wrap = document.getElementById('progress-wrap');
  if (wrap) wrap.style.display = pct > 0 ? 'block' : 'none';
}

// ─── Boutons actifs/désactivés ─────────────────────────────────────────

export function updateActionButtons() {
  const s = state.get();
  const hasPages = s.pages.length > 0;
  const hasSelection = s.selectedPageIds.length > 0;
  const isProcessing = s.isProcessing;

  _setDisabled('btn-export-pdf', !hasPages || isProcessing);
  _setDisabled('btn-export-png', !hasPages || isProcessing);
  _setDisabled('btn-export-jpg', !hasPages || isProcessing);
  _setDisabled('btn-export-text', !hasPages || isProcessing);
  _setDisabled('btn-export-compressed', !hasPages || isProcessing);
  _setDisabled('btn-extract-selection', !hasSelection || isProcessing);
  _setDisabled('btn-delete-selection', !hasSelection || isProcessing);
  _setDisabled('btn-rotate-left-sel', !hasSelection || isProcessing);
  _setDisabled('btn-rotate-right-sel', !hasSelection || isProcessing);
  _setDisabled('btn-select-all', !hasPages);
  _setDisabled('btn-clear-selection', !hasSelection);
  _setDisabled('btn-clear-workspace', !hasPages);

  // Presets
  document.querySelectorAll('[data-preset]').forEach(el => {
    el.disabled = !hasPages || isProcessing;
  });
}

// ─── Slider compression ───────────────────────────────────────────────

export function initCompressionSlider() {
  const slider = document.getElementById('compression-slider');
  const valueEl = document.getElementById('compression-value');
  if (!slider) return;

  const q = state.get().settings.compressionQuality;
  slider.value = Math.round(q * 100);
  if (valueEl) valueEl.textContent = Math.round(q * 100) + '%';

  slider.addEventListener('input', () => {
    const val = parseInt(slider.value) / 100;
    if (valueEl) valueEl.textContent = slider.value + '%';
    state.updateSettings({ compressionQuality: val });
  });
}

export function initJpgQualitySlider() {
  const slider = document.getElementById('jpg-quality-slider');
  const valueEl = document.getElementById('jpg-quality-value');
  if (!slider) return;

  const q = state.get().settings.jpgQuality;
  slider.value = Math.round(q * 100);
  if (valueEl) valueEl.textContent = Math.round(q * 100) + '%';

  slider.addEventListener('input', () => {
    const val = parseInt(slider.value) / 100;
    if (valueEl) valueEl.textContent = slider.value + '%';
    state.updateSettings({ jpgQuality: val });
  });
}

// ─── Presets ──────────────────────────────────────────────────────────

export function renderPresets() {
  const container = document.getElementById('presets-container');
  if (!container) return;

  container.innerHTML = PRESETS.map(p => `
    <button class="btn btn-secondary btn-full" data-preset="${p.id}" title="${p.description}">
      ${p.label}
    </button>
  `).join('');

  container.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => runPreset(btn.dataset.preset));
  });
}

// ─── Erreurs ──────────────────────────────────────────────────────────

export function renderErrors() {
  const errors = state.get().errors;
  if (!errors.length) return;
  const latest = errors[errors.length - 1];
  showToast(latest.msg, 'error', 5000);
}

// ─── Helpers ──────────────────────────────────────────────────────────

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function _setDisabled(id, disabled) {
  const el = document.getElementById(id);
  if (el) el.disabled = disabled;
}
