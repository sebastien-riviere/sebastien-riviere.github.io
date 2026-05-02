# TECHNICAL_SCOPE.md — SimplePDF

## Stack

| Rôle | Bibliothèque | Version cible |
|---|---|---|
| Création/modification PDF | pdf-lib | 1.17.x |
| Rendu miniatures | PDF.js | 4.x (pdfjs-dist) |
| Export ZIP (PNG/JPG) | JSZip | 3.10.x |
| Drag & drop grille | SortableJS | 1.15.x |
| UI | CSS custom + vanilla JS | — |

## Architecture fichiers

```
index.html          — Point d'entrée unique
css/
  main.css          — Variables, reset, typographie
  layout.css        — Structure header/sidebar/zone centrale
  components.css    — Cartes, boutons, modals, états
js/
  app.js            — Initialisation, wiring modules
  state.js          — État central, getters/setters
  file-loader.js    — Import fichiers, drag & drop
  pdf-renderer.js   — PDF.js, miniatures canvas
  pdf-builder.js    — Assemblage PDF final (pdf-lib)
  pdf-actions.js    — Extraction, suppression, rotation, fusion
  image-actions.js  — Conversion images → pages PDF
  export-actions.js — Exports PDF, PNG ZIP, JPG ZIP, TXT
  text-actions.js   — Extraction texte PDF
  compression-actions.js — Compression visuelle canvas
  overlay-actions.js     — Numérotation, filigrane, tampons (V1.5)
  presets.js             — Presets rapides (V1.5)
  ui.js             — Rendu interface, handlers, messages
  utils.js          — Utilitaires partagés
vendor/
  pdf-lib/          — pdf-lib.min.js
  pdfjs/            — pdf.min.mjs + pdf.worker.min.mjs
  jszip/            — jszip.min.js
  sortable/         — Sortable.min.js
```

## État central (state.js)

```js
{
  files: [],           // fichiers importés {id, name, type, size, raw}
  pages: [],           // pages {id, fileId, pageIndex, rotation, modified, canvas}
  selectedPageIds: [], // ids des pages sélectionnées
  currentMode: 'ready',// ready|loading|processing|exporting|done|error
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
  lastExport: null,    // {type, name, size, date}
  errors: [],
}
```

## Choix techniques

### Compression visuelle
- Rendu page → canvas via PDF.js.
- Réduction qualité via canvas.toBlob('image/jpeg', quality).
- Reconstruction PDF via pdf-lib depuis images JPEG.
- **Avertissement obligatoire** : "peut réduire la netteté du texte".

### Miniatures
- PDF.js render à résolution réduite (scale 0.3–0.5).
- Canvas converti en dataURL pour affichage <img>.
- Worker PDF.js en /vendor/pdfjs/.

### Extraction texte
- PDF.js getTextContent() page par page.
- Concaténation simple avec sauts de page.
- Fonctionne uniquement sur PDF textuels (pas scannés).

### Export ZIP
- JSZip : ajouter chaque page comme blob PNG/JPG.
- Téléchargement via URL.createObjectURL.

### Nommage exports
- `simplepdf_export.pdf`
- `simplepdf_selection.pdf`
- `simplepdf_compressed.pdf`
- `simplepdf_pages_png.zip`
- `simplepdf_pages_jpg.zip`
- `simplepdf_text.txt`

## Risques navigateur

| Risque | Mitigation |
|---|---|
| Gros PDF > 200 Mo | Avertissement, pas de crash silencieux |
| PDF.js worker CORS | Worker en /vendor, même origine |
| pdf-lib mémoire | Traitement par blocs si nécessaire |
| Safari WebP | Détection feature, fallback PNG |
| PDF chiffré | Détection et message explicite |

## Limites mémoire
- Pas de traitement de PDF > ~200 Mo en pratique.
- Les miniatures sont des dataURL (consommation RAM à surveiller).
- Libérer les canvas après rendu (revokeObjectURL).

## Stratégie /vendor
1. En développement : CDN jsDelivr accepté temporairement.
2. En production GitHub Pages : tous les fichiers en /vendor.
3. Voir `/vendor/README.md` pour les URLs de téléchargement.

## Règles de sécurité locale
- Zéro appel réseau vers des serveurs tiers pendant le traitement.
- Pas de localStorage pour fichiers ou contenu PDF.
- Pas d'eval(), pas de innerHTML avec contenu utilisateur.
- Les noms de fichiers utilisateurs ne sont jamais exécutés.

## Tests manuels
Voir PRODUCT_BRIEF.md — section "Tests manuels".

## Plan déploiement GitHub Pages
1. `git init` dans /SimplePDF.
2. Télécharger les bibliothèques dans /vendor.
3. `git add . && git commit -m "Initial SimplePDF"`.
4. Créer repo GitHub `SimplePDF` (ou utiliser le repo existant sebastien-riviere.github.io).
5. `git remote add origin <url>`.
6. `git push -u origin main`.
7. Activer GitHub Pages sur branche `main`, dossier racine `/`.
8. URL finale : `https://sebastien-riviere.github.io/SimplePDF/`.
