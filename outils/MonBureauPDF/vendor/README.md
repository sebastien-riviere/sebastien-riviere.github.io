# /vendor — Bibliothèques locales

Ce dossier contient les bibliothèques JavaScript utilisées par MonBureauPDF.
Pour GitHub Pages et l'usage local hors-ligne, les fichiers doivent être présents ici.

En développement, le projet peut utiliser temporairement les CDN jsDelivr indiqués ci-dessous.

---

## pdf-lib

**Usage** : création, modification, assemblage et export de fichiers PDF.
**Dossier** : `/vendor/pdf-lib/`

### Téléchargement
```
https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js
```
Sauvegarder sous : `vendor/pdf-lib/pdf-lib.min.js`

---

## PDF.js (pdfjs-dist)

**Usage** : rendu des miniatures de pages PDF en canvas.
**Dossier** : `/vendor/pdfjs/`

### Téléchargement
```
https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs
https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs
```
Sauvegarder sous :
- `vendor/pdfjs/pdf.min.mjs`
- `vendor/pdfjs/pdf.worker.min.mjs`

**Important** : le worker doit être au même niveau pour éviter les erreurs CORS.

---

## JSZip

**Usage** : génération des archives ZIP (exports PNG et JPG).
**Dossier** : `/vendor/jszip/`

### Téléchargement
```
https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
```
Sauvegarder sous : `vendor/jszip/jszip.min.js`

---

## SortableJS

**Usage** : drag & drop pour réorganiser la grille de pages.
**Dossier** : `/vendor/sortable/`

### Téléchargement
```
https://cdn.jsdelivr.net/npm/sortablejs@1.15.3/Sortable.min.js
```
Sauvegarder sous : `vendor/sortable/Sortable.min.js`

---

## Script de téléchargement rapide (bash/curl)

```bash
mkdir -p vendor/pdf-lib vendor/pdfjs vendor/jszip vendor/sortable

curl -L "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js" -o vendor/pdf-lib/pdf-lib.min.js
curl -L "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs" -o vendor/pdfjs/pdf.min.mjs
curl -L "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs" -o vendor/pdfjs/pdf.worker.min.mjs
curl -L "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js" -o vendor/jszip/jszip.min.js
curl -L "https://cdn.jsdelivr.net/npm/sortablejs@1.15.3/Sortable.min.js" -o vendor/sortable/Sortable.min.js
```

---

## Statut actuel

| Bibliothèque | Fichier attendu | Présent |
|---|---|---|
| pdf-lib | vendor/pdf-lib/pdf-lib.min.js | ⬜ À télécharger |
| PDF.js | vendor/pdfjs/pdf.min.mjs | ⬜ À télécharger |
| PDF.js worker | vendor/pdfjs/pdf.worker.min.mjs | ⬜ À télécharger |
| JSZip | vendor/jszip/jszip.min.js | ⬜ À télécharger |
| SortableJS | vendor/sortable/Sortable.min.js | ⬜ À télécharger |

Mettre à jour ce tableau après téléchargement.
