// presets.js — Presets rapides

import { state } from './state.js';
import { exportPdf, exportJpgZip, exportCompressed } from './export-actions.js';

export const PRESETS = [
  {
    id: 'compress_light',
    label: 'Compresser — Légère',
    description: 'Légère compression (~85% qualité). Texte préservé.',
    action: () => exportCompressed(0.85),
  },
  {
    id: 'compress_medium',
    label: 'Compresser — Moyenne',
    description: 'Compression équilibrée (~55% qualité).',
    action: () => exportCompressed(0.55),
  },
  {
    id: 'compress_high',
    label: 'Compresser — Haute',
    description: 'Compression forte (~30% qualité). Fichier très léger.',
    action: () => exportCompressed(0.30),
  },
  {
    id: 'merge',
    label: 'Fusionner',
    description: 'Exporter toutes les pages dans l\'ordre affiché.',
    action: () => exportPdf(false),
  },
  {
    id: 'extract',
    label: 'Extraire sélection',
    description: 'Exporter uniquement les pages sélectionnées.',
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
    label: 'PDF → images',
    description: 'Exporter chaque page en JPG dans un ZIP.',
    action: () => exportJpgZip(),
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
