# Changelog

## v1.6.0 — 2026-05

### Refonte parcours utilisateur
- Parcours linéaire en **3 étapes claires** : ① Capturer → ② Repérer → ③ Exporter
- Plus d'onglets cachés dans « Ma session » : 5 sections numérotées (A à E) toutes visibles à la fois
- Sidebar simplifiée : « Nouvelle session » / « Session en cours » / « Outils »
- Bannière d'avertissement orange en haut de Ma session quand les fichiers vidéo ne sont pas encore téléchargés
- Avertissement `beforeunload` si l'utilisateur ferme l'onglet sans avoir téléchargé ses vidéos

### Wording clarifié
- « Post-traitement » → **Ma session**
- « Marqueurs » → **Repères temporels**
- « Segments » → **Vos fichiers vidéo**
- « Scripts FFmpeg » → replié dans une option « Convertir en MP4 universel »
- « Bibliothèque » → **Mes sessions sauvegardées**
- « Pack NotebookLM » → **Pour NotebookLM**
- « ZIP & avancé » → **Tout en une archive ZIP** (action principale visible)
- « Manifest.json » → replié dans « Fichiers individuels »
- « Capture live / Import fichier » → **Démarrer une capture / Importer un fichier**

### Nouveaux composants visuels
- 4 grosses cartes d'export ergonomiques (ZIP, PDF, NotebookLM, HTML) — la principale (ZIP) en bleu plein
- Sections numérotées A-B-C-D-E avec head et corps séparés
- Tags d'étape colorés (① Capturer, ② Repérer, ③ Ma session)
- Carte "parcours" sur l'accueil avec les 3 étapes et flèches
- Options ZIP repliées par défaut (charge cognitive réduite)
- Fichiers individuels repliés par défaut

### PWA (installable mobile)
- Manifest Web App avec icônes 192/512 PNG + apple-touch-icon 180px
- Service Worker pour fonctionnement offline complet
- Ajout à l'écran d'accueil sur Android (Chrome) et iPhone (Safari)
- Démarre comme une vraie app standalone (sans barre de navigateur)
- Raccourcis dans le manifest : « Démarrer une capture » et « Importer un fichier »

### Logo retravaillé
- Caméra blanche sur fond bleu `#2D5A8E` (cohérent avec MonBureauPDF)
- Point rouge enregistrement (signature « CAPTURE »)
- Carré arrondi 14px (même grammaire que MonBureauPDF/MD Convert)
- Décliné en SVG, PNG 192/512, apple-touch-icon

### Améliorations diverses
- Page d'aide : parcours visuel + FAQ avec details/summary
- Footer mis à jour
- CSS : nouveaux tokens (`--warning-bg`), composants `journey-grid`, `section`, `export-card`, `save-banner`, `step-tag`, `collapse`, `help-steps`

---

## v1.5.0 — 2026-05

### Refonte visuelle complète
- Design aligné sur **MonBureauPDF** (palette `#2D5A8E`, fond clair, sidebar gauche)
- Sprite d'icônes SVG (style Lucide) — suppression intégrale des emojis
- Layout grid app shell (header + sidebar + main)
- Mode mobile responsive avec menu hamburger

### Fonctionnalités
- Persistance IndexedDB
- Bibliothèque locale des sessions
- Pause / Reprise de la capture
- 3 niveaux de qualité d'enregistrement
- Édition inline du titre, des libellés
- Lightbox plein écran
- Suppression de doublons par hash
- Export HTML interactif autonome
- 8 commandes FFmpeg
- Scripts `.bat`/`.sh` interactifs avec menu numéroté
- Raccourcis clavier (S, M, Espace, Échap)

---

## v1.0.0 — Version initiale

- Capture écran via `getDisplayMedia` + `MediaRecorder`
- Import fichier vidéo/audio drag & drop
- Captures d'écran et marqueurs basiques
- Exports : timeline.md, notes.md, manifest.json, README.md
- Génération PDF avec jsPDF
- Scripts FFmpeg `.bat` et `.sh`
- Pack NotebookLM (4 fichiers)
- Archive ZIP via JSZip
- Confidentialité 100% locale
