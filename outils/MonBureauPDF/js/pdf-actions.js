// pdf-actions.js — Extraction, suppression, rotation, fusion

import { state } from './state.js';

export function deleteSelectedPages() {
  const selected = state.getSelectedPages();
  if (!selected.length) return;
  state.removePages(selected.map(p => p.id));
}

export function rotatePageLeft(pageId) {
  const page = state.getPages().find(p => p.id === pageId);
  if (!page) return;
  const newRotation = ((page.rotation - 90) + 360) % 360;
  state.updatePage(pageId, { rotation: newRotation, modified: true });
}

export function rotatePageRight(pageId) {
  const page = state.getPages().find(p => p.id === pageId);
  if (!page) return;
  const newRotation = (page.rotation + 90) % 360;
  state.updatePage(pageId, { rotation: newRotation, modified: true });
}

export function rotateSelectedLeft() {
  state.getSelectedPages().forEach(p => rotatePageLeft(p.id));
}

export function rotateSelectedRight() {
  state.getSelectedPages().forEach(p => rotatePageRight(p.id));
}

export function getExportPages() {
  return state.getPages();
}

export function getSelectionPages() {
  return state.getSelectedPages();
}

// Retourne un map fileId → ArrayBuffer depuis state.files[]
export function getRawBuffers() {
  const s = state.get();
  const map = {};
  for (const f of s.files) {
    if (f.raw) map[f.id] = f.raw;
  }
  return map;
}
