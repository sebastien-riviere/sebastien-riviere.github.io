// state.js — État central, getters/setters, événements

const _state = {
  files: [],
  pages: [],
  selectedPageIds: [],
  currentMode: 'ready',
  isProcessing: false,
  progress: 0,
  stats: {
    fileCount: 0,
    pageCount: 0,
    selectedCount: 0,
    initialSize: 0,
    lastExportSize: 0,
  },
  settings: {
    jpgQuality: 0.85,
    compressionQuality: 0.7,
    exportMode: 'pdf',
  },
  lastExport: null,
  errors: [],
};

function dispatch(eventName, detail = {}) {
  document.dispatchEvent(new CustomEvent(`MonBureauPDF:${eventName}`, { detail }));
}

function update(partial) {
  Object.assign(_state, partial);
  dispatch('state:update', { keys: Object.keys(partial) });
}

function getState() {
  return _state;
}

function getPages() {
  return _state.pages;
}

function getSelectedPages() {
  return _state.pages.filter(p => _state.selectedPageIds.includes(p.id));
}

function addFile(fileObj) {
  _state.files.push(fileObj);
  _recalcStats();
  dispatch('files:changed');
}

function addPages(pageObjs) {
  _state.pages.push(...pageObjs);
  _recalcStats();
  dispatch('pages:changed');
}

function removePages(ids) {
  _state.pages = _state.pages.filter(p => !ids.includes(p.id));
  _state.selectedPageIds = _state.selectedPageIds.filter(id => !ids.includes(id));
  _recalcStats();
  dispatch('pages:changed');
  dispatch('selection:changed');
}

function reorderPages(newOrder) {
  _state.pages = newOrder;
  dispatch('pages:changed');
}

function updatePage(id, partial) {
  const page = _state.pages.find(p => p.id === id);
  if (page) Object.assign(page, partial);
  dispatch('pages:changed');
}

function selectPage(id, mode = 'single') {
  if (mode === 'single') {
    _state.selectedPageIds = _state.selectedPageIds.includes(id)
      ? _state.selectedPageIds.filter(i => i !== id)
      : [id];
  } else if (mode === 'multi') {
    if (_state.selectedPageIds.includes(id)) {
      _state.selectedPageIds = _state.selectedPageIds.filter(i => i !== id);
    } else {
      _state.selectedPageIds.push(id);
    }
  } else if (mode === 'range') {
    const allIds = _state.pages.map(p => p.id);
    const clickedIdx = allIds.indexOf(id);
    const lastIdx = _state.selectedPageIds.length
      ? allIds.indexOf(_state.selectedPageIds[_state.selectedPageIds.length - 1])
      : clickedIdx;
    const start = Math.min(clickedIdx, lastIdx);
    const end = Math.max(clickedIdx, lastIdx);
    const rangeIds = allIds.slice(start, end + 1);
    rangeIds.forEach(rid => {
      if (!_state.selectedPageIds.includes(rid)) _state.selectedPageIds.push(rid);
    });
  }
  _recalcStats();
  dispatch('selection:changed');
}

function selectAll() {
  _state.selectedPageIds = _state.pages.map(p => p.id);
  _recalcStats();
  dispatch('selection:changed');
}

function clearSelection() {
  _state.selectedPageIds = [];
  _recalcStats();
  dispatch('selection:changed');
}

function setMode(mode) {
  _state.currentMode = mode;
  dispatch('mode:changed', { mode });
}

function setProgress(pct) {
  _state.progress = pct;
  dispatch('progress:changed', { pct });
}

function addError(msg) {
  _state.errors.push({ msg, ts: Date.now() });
  dispatch('error:added', { msg });
}

function clearErrors() {
  _state.errors = [];
}

function setLastExport(info) {
  _state.lastExport = info;
  _state.stats.lastExportSize = info?.size || 0;
  dispatch('export:done', info);
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('MonBureauPDF_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(_state.settings, parsed);
    }
  } catch (_) {}
}

function saveSettings() {
  try {
    localStorage.setItem('MonBureauPDF_settings', JSON.stringify(_state.settings));
  } catch (_) {}
}

function updateSettings(partial) {
  Object.assign(_state.settings, partial);
  saveSettings();
  dispatch('settings:changed');
}

function clearWorkspace() {
  _state.files = [];
  _state.pages = [];
  _state.selectedPageIds = [];
  _state.currentMode = 'ready';
  _state.isProcessing = false;
  _state.progress = 0;
  _state.stats = { fileCount: 0, pageCount: 0, selectedCount: 0, initialSize: 0, lastExportSize: 0 };
  _state.lastExport = null;
  _state.errors = [];
  dispatch('workspace:cleared');
}

function _recalcStats() {
  _state.stats.fileCount = _state.files.length;
  _state.stats.pageCount = _state.pages.length;
  _state.stats.selectedCount = _state.selectedPageIds.length;
  _state.stats.initialSize = _state.files.reduce((acc, f) => acc + (f.size || 0), 0);
}

export const state = {
  get: getState,
  update,
  dispatch,
  getPages,
  getSelectedPages,
  addFile,
  addPages,
  removePages,
  reorderPages,
  updatePage,
  selectPage,
  selectAll,
  clearSelection,
  setMode,
  setProgress,
  addError,
  clearErrors,
  setLastExport,
  loadSettings,
  saveSettings,
  updateSettings,
  clearWorkspace,
};
