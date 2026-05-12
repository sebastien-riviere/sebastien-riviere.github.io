# MonBureauRECORD

> Outil local de capture vidéo/audio et de post-traitement — par [Sébastien Rivière](https://www.linkedin.com/in/s%C3%A9bastien-riviere-conseil/).

**Tout reste sur votre ordinateur.** Pas de compte. Pas d'upload. Pas d'IA. Pas de tracking.

Capturez votre écran (ou importez un fichier vidéo/audio existant), annotez la session avec des marqueurs et des captures, ajoutez vos notes, puis exportez tout en un seul ZIP : timeline Markdown, manifest JSON, rapport PDF illustré, scripts FFmpeg de conversion, pack NotebookLM prêt à l'emploi.

---

## Fonctionnalités v1.6

### Capture live
- Enregistrement écran + son système (via `getDisplayMedia`)
- Mixage micro optionnel (combinaison `AudioContext`)
- 3 niveaux de qualité (légère / standard / haute)
- Découpage automatique en segments (5 min → 1 h)
- Captures d'écran pendant l'enregistrement (raccourci `S`)
- Marqueurs temporels (raccourci `M`) avec libellé
- Pause / reprise (raccourci `Espace`)
- Capture automatique périodique (5 s → 2 min)
- Aperçu vidéo live dans un cockpit unifié

### Import fichier
- Drag & drop ou parcours
- Formats acceptés : `webm` `mp4` `mov` `mkv` `avi` `mp3` `wav` `m4a` `aac` `ogg` `flac` `opus`
- Lecteur intégré avec captures à la volée
- Marqueurs au timecode courant ou manuel

### Post-traitement
- Édition inline du titre, des libellés de captures et de marqueurs
- Suppression des doublons de captures (déduplication par hash)
- Galerie en lightbox plein écran
- Notes auto-sauvegardées en IndexedDB
- 8 commandes FFmpeg prêtes à copier/coller
- Scripts `.bat` (Windows) et `.sh` (Mac/Linux) interactifs avec menu numéroté

### Exports
- `timeline.md` — Chronologie complète Markdown
- `notes.md` — Vos notes en Markdown
- `README.md` — Description structurée de la session
- `timeline.html` — Page interactive autonome (offline-friendly)
- `manifest.json` — Données structurées (id, marqueurs, captures, métadonnées)
- Rapport PDF illustré — Couverture, page de marqueurs, captures plein format, notes, pagination
- Pack NotebookLM — 6 fichiers Markdown pour import manuel sur notebooklm.google.com
- Scripts FFmpeg — Windows et Mac/Linux interactifs
- Captures JPEG individuelles
- Archive ZIP complète avec tout

### Bibliothèque
- Sessions sauvegardées automatiquement dans IndexedDB
- Reprise d'une session précédente (métadonnées + captures + marqueurs + notes)
- Suppression individuelle

---

## Démarrage rapide

1. Ouvrez `index.html` dans Chrome, Edge ou Brave (recommandés)
2. Choisissez **Capture live** ou **Import fichier**
3. Une fois la session terminée, allez dans **Post-traitement**
4. Cliquez sur le preset **ZIP complet** pour tout récupérer

---

## Architecture

```
monbureaurecord/
├── index.html              Structure et entry point
├── assets/
│   ├── icons.svg           Sprite d'icônes (Lucide-style)
│   └── favicon.svg
├── css/
│   └── styles.css          Design system aligné MonBureauPDF
└── js/
    ├── config.js           Constantes globales
    ├── utils.js            Helpers (format, dates, blob, snapshot…)
    ├── state.js            Store réactif + Prefs localStorage
    ├── storage.js          Persistance IndexedDB
    ├── session.js          Modèle de session
    ├── recorder.js         Capture live (MediaRecorder + AudioContext)
    ├── importer.js         Import fichier + drag&drop
    ├── markdown.js         Export Markdown + HTML
    ├── manifest.js         Export JSON
    ├── pdf.js              Génération PDF (jsPDF)
    ├── scripts.js          Génération scripts FFmpeg
    ├── notebooklm.js       Pack NotebookLM (6 fichiers)
    ├── zip.js              Archive ZIP (JSZip)
    ├── shots-markers.js    Gestion captures, marqueurs, segments
    ├── presets.js          Presets d'export en un clic
    ├── ui.js               Rendu UI, toasts, modales, lightbox
    └── app.js              Contrôleur principal + raccourcis
```

Aucun build, aucun bundler, aucune dépendance NPM. Deux libs externes via CDN : [jsPDF](https://github.com/parallax/jsPDF) et [JSZip](https://stuk.github.io/jszip/).

---

## Compatibilité navigateurs

| Navigateur | Capture | Import | Export PDF/ZIP |
|---|---|---|---|
| Chrome 100+ | ✅ | ✅ | ✅ |
| Edge 100+ | ✅ | ✅ | ✅ |
| Brave | ✅ | ✅ | ✅ |
| Firefox | ⚠️ Limité | ✅ | ✅ |
| Safari | ❌ | ✅ | ✅ |

La capture d'écran nécessite l'API `getDisplayMedia`, pleinement supportée sur les navigateurs Chromium.

---

## Déploiement GitHub Pages

```bash
git clone https://github.com/votre-compte/monbureaurecord.git
cd monbureaurecord
git push
# Activer GitHub Pages dans Settings → Pages → main branch
```

L'app est statique, aucune configuration serveur n'est requise.

---

## Limitations connues

- Les segments WebM ne sont **pas conservés en IndexedDB** (trop volumineux). Téléchargez-les avant fermeture.
- Le **navigateur n'exécute pas FFmpeg** — les scripts générés doivent être lancés manuellement dans un terminal.
- L'**import dans NotebookLM est manuel** — l'app ne contacte aucune API Google.
- Certains formats vidéo (`.mkv`, `.avi`, `.flac`) ne se lisent pas dans tous les navigateurs : utilisez les scripts FFmpeg pour convertir d'abord.

---

## Confidentialité

- ❌ Aucun fichier envoyé sur un serveur
- ❌ Aucun cookie, aucun analytics, aucun tracking
- ❌ Aucune IA embarquée
- ❌ Aucune connexion réseau hors chargement initial des CDN
- ✅ Stockage local IndexedDB uniquement (effaçable depuis votre navigateur)
- ✅ Code source intégralement auditable

---

## Outils complémentaires

- **MonBureauPDF** — manipulation PDF locale : <https://sebastien-riviere.github.io/outils/MonBureauPDF/>
- **MD Convert** — conversion en Markdown : <https://sebastien-riviere.github.io/outils/MD-Convert/>
- **FFmpeg** — conversion média : <https://ffmpeg.org/download.html>
- **Whisper** — transcription locale : <https://github.com/openai/whisper>

---

## Licence

Voir le projet sur GitHub. Code conçu pour être audité, forké et adapté.

---

*MonBureauRECORD v1.6.0 · 2026 · [Sébastien Rivière](https://www.linkedin.com/in/s%C3%A9bastien-riviere-conseil/)*
