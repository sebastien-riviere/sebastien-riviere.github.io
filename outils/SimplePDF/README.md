# SimplePDF

**Manipuler, alléger, réorganiser et exporter ses PDF directement dans le navigateur, sans compte, sans serveur, sans upload.**

→ [Ouvrir SimplePDF](https://sebastien-riviere.github.io/SimplePDF/)

---

## Description

SimplePDF est un outil PDF local-first. Il tourne entièrement dans votre navigateur. Aucun fichier n'est envoyé vers un serveur. Aucun compte n'est nécessaire.

Il est conçu pour les 20% de tâches PDF utilisées 80% du temps : fusionner, réorganiser, extraire, compresser, exporter.

---

## Fonctionnalités

### V1 — disponibles

- Import PDF et images (JPG, PNG, WebP) par bouton ou drag & drop
- Rendu miniatures de chaque page
- Grille de pages réorganisable par drag & drop
- Sélection simple, multiple (Ctrl), plage (Shift), tout sélectionner
- Suppression des pages sélectionnées
- Extraction de la sélection en nouveau PDF
- Fusion et export du PDF selon l'ordre visuel
- Rotation par page (gauche/droite) et sur la sélection
- Export toutes les pages en PNG ZIP
- Export toutes les pages en JPG ZIP (qualité réglable)
- Extraction du texte brut (PDF textuels uniquement)
- Compression visuelle avec slider qualité
- Statistiques : fichiers, pages, sélection, poids avant/après
- Historique du dernier export
- Vider l'espace de travail
- Presets rapides : Alléger pour email, Fusion propre, Extraire sélection, PDF → images, Dossier administratif

### Prévu en V1.5

- Numérotation des pages
- Filigrane texte
- Tampons prédéfinis (BROUILLON, CONFIDENTIEL, VALIDÉ…)
- En-tête et pied de page
- Métadonnées PDF
- Page blanche, page titre
- Niveaux de gris

---

## Limites

- **PDF scannés** : l'extraction texte est impossible sans OCR. SimplePDF ne comprend pas d'OCR.
- **Compression visuelle** : la compression est basée sur la recompression en JPEG. Elle peut dégrader la netteté du texte. Elle est adaptée aux scans et documents image.
- **Très gros fichiers** : les PDF de plus de ~200 Mo peuvent atteindre les limites mémoire du navigateur.
- **PDF protégés** : les PDF chiffrés par mot de passe ne sont pas supportés.
- **Mobile** : l'interface est optimisée pour desktop et tablette.

---

## Stack technique

| Rôle | Bibliothèque |
|---|---|
| Création PDF | pdf-lib 1.17.x |
| Rendu miniatures | PDF.js 4.x |
| Export ZIP | JSZip 3.10.x |
| Drag & drop | SortableJS 1.15.x |
| UI | HTML/CSS/JS vanilla |

---

## Sécurité et confidentialité

- Aucun fichier n'est envoyé vers un serveur.
- Aucun fichier n'est stocké dans localStorage ou IndexedDB.
- Aucun tracking, aucun analytics.
- Fonctionne hors-ligne une fois les bibliothèques chargées.

---

## Installation locale

1. Cloner ou télécharger ce dépôt.
2. Télécharger les bibliothèques dans `/vendor` (voir `/vendor/README.md`).
3. Ouvrir `index.html` dans un navigateur moderne (Chrome, Firefox, Edge).

> Pas de serveur requis, pas de build, pas de Node.js.

---

## Déploiement GitHub Pages

### Option A — Repo séparé SimplePDF

```bash
git init
git add .
git commit -m "Initial SimplePDF"
git remote add origin https://github.com/sebastien-riviere/SimplePDF.git
git push -u origin main
```

Activer GitHub Pages dans les Settings du repo → Source : branche `main`, dossier `/`.

URL : `https://sebastien-riviere.github.io/SimplePDF/`

### Option B — Intégration dans le site principal

Placer le dossier dans le repo `sebastien-riviere.github.io` :

```
sebastien-riviere.github.io/
└── tools/
    └── SimplePDF/
        └── index.html
```

URL : `https://sebastien-riviere.github.io/tools/SimplePDF/`

---

## Roadmap

Voir [ROADMAP.md](ROADMAP.md).

---

## Crédits bibliothèques

- [pdf-lib](https://pdf-lib.js.org/) — Andrew Dillon, MIT License
- [PDF.js](https://mozilla.github.io/pdf.js/) — Mozilla Foundation, Apache 2.0
- [JSZip](https://stuk.github.io/jszip/) — Stuart Knightley, MIT License
- [SortableJS](https://sortablejs.github.io/Sortable/) — RubaXa, MIT License

---

## Auteur

Sébastien Rivière — [sebastien-riviere.github.io](https://sebastien-riviere.github.io)

MIT License
