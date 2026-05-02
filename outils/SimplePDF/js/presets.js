// presets.js — Presets rapides (V1.5)

import { state } from './state.js';
import { exportPdf, exportJpgZip, exportCompressed } from './export-actions.js';
import { getExportPages, getSelectionPages } from './pdf-actions.js';

export const PRESETS = [
  {
    id: 'email',
    label: 'Alléger pour email',
    description: 'Compression forte, idéal pour envoi par mail.',
    icon: '📧',
    action: () => exportCompressed(0.5),
  },
  {
    id: 'merge',
    label: 'Fusion propre',
    description: 'Exporter toutes les pages dans l\'ordre affiché.',
    icon: '🔗',
    action: () => exportPdf(false),
  },
  {
    id: 'extract',
    label: 'Extraire sélection',
    description: 'Exporter uniquement les pages sélectionnées.',
    icon: '✂️',
    action: () => {
      if (!state.getSelectedPages().length) {
        state.addError('Sélectionnez des pages avant d\'utiliser ce preset.');
        return;
      }
      exportPdf(true);
    },
  },
  {
    id: 'images',
    label: 'PDF vers images',
    description: 'Exporter chaque page en JPG dans un ZIP.',
    icon: '🖼️',
    action: () => exportJpgZip(),
  },
  {
    id: 'dossier',
    label: 'Dossier administratif',
    description: 'Fusion propre, qualité maximale.',
    icon: '📁',
    action: () => exportPdf(false),
  },
];

export function runPreset(presetId) {
  const preset = PRESETS.find(p => p.id === presetId);
  if (!preset) {
    state.addError(`Preset inconnu : ${presetId}`);
    return;
  }
  preset.action();
}
