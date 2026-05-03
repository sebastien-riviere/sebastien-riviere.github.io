# PRODUCT_BRIEF.md — MonBureauPDF

## Vision
MonBureauPDF est un outil PDF local, sobre et productif. Il ne concurrence pas Adobe ou Sejda sur les fonctions avancées. Il offre les 20% de fonctions PDF utilisées 80% du temps, sans friction, sans compte, sans upload.

## Promesse
"Manipuler, alléger, réorganiser et exporter ses PDF directement dans le navigateur, sans compte, sans serveur, sans upload."

## Utilisateurs
- Professionnel qui assemble des dossiers PDF (admin, RH, comptabilité).
- Designer qui compresse des exports avant envoi.
- Personne qui réorganise des scans.
- Développeur qui teste rapidement des PDF.
- Tout utilisateur refusant d'uploader des documents sensibles en ligne.

## Parcours principal
1. L'utilisateur ouvre MonBureauPDF.
2. Il dépose ses PDF ou images (drag & drop ou bouton).
3. Les miniatures s'affichent en grille.
4. Il réorganise, sélectionne, supprime ce qu'il veut.
5. Il applique les modifications (rotation, filigrane, compression).
6. Il exporte : PDF / PNG ZIP / JPG ZIP / TXT.
7. L'outil affiche les stats (poids avant/après).
8. Il vide l'espace et repart.

## Workflow visuel
Importer → Organiser → Modifier → Alléger → Exporter

## Structure écrans

### Zone import / dropzone
- Dropzone centrale si aucun fichier.
- Message : "Dépose tes PDF et images ici."
- Bouton "Importer des fichiers".
- Formats acceptés listés.

### Grille pages
- Carte par page avec miniature.
- Numéro d'ordre visuel.
- Nom fichier source.
- Badge type (PDF / IMAGE).
- Badge "modifié" si rotation appliquée.
- Boutons : supprimer, rotation gauche, rotation droite.
- Sélectionnable par clic.

### Sidebar gauche (actions)
- Section Importer.
- Section Sélection (tout / plage / vider sélection).
- Section Organisation (réordonner).
- Section Actions PDF (supprimer, extraire, fusionner/exporter, rotation).
- Section Presets.

### Sidebar droite (stats et export)
- Stats : fichiers, pages, sélectionnées, poids initial, poids export, delta.
- Export principal.
- Options export (qualité JPG, format).
- Dernier export.
- Alertes limites.

### Header
- Logo + nom.
- Bandeau confidentialité.

## Fonctions V1

| Fonction | Description |
|---|---|
| Import PDF | Par bouton ou drag & drop |
| Import images | JPG, JPEG, PNG, WebP |
| Miniatures | Rendu PDF.js en canvas |
| Grille réorganisable | Drag & drop SortableJS |
| Sélection page | Clic simple |
| Sélection multiple | Multi-clic |
| Sélection plage | Shift+clic |
| Tout sélectionner | Bouton |
| Effacer sélection | Bouton |
| Supprimer pages | Sur sélection |
| Extraire pages | PDF sélection → nouveau PDF |
| Fusion/export PDF | PDF courant selon ordre visuel |
| Rotation page | Gauche/droite par page |
| Rotation sélection | Sur sélection |
| Export PNG ZIP | Pages → PNG dans ZIP |
| Export JPG ZIP | Pages → JPG dans ZIP (qualité réglable) |
| Extraction texte | PDF textuels → .txt |
| Compression visuelle | Slider qualité → PDF allégé |
| Stats complètes | Voir ci-dessus |
| Historique export | Dernier export affiché |
| Vider espace | Reset complet |
| Messages erreur | Lisibles, pas techniques |
| États traitement | Prêt/Chargement/Traitement/Export/Terminé/Erreur |
| Bandeau confidentialité | Toujours visible |

## Fonctions V1.5

| Fonction | Statut |
|---|---|
| Numérotation pages | Prévu |
| Filigrane texte | Prévu |
| Tampons prédéfinis | Prévu |
| En-tête / pied | Prévu |
| Métadonnées PDF | Prévu |
| Page blanche | Prévu |
| Page titre | Prévu |
| Presets rapides | Prévu |
| Niveaux de gris | Prévu si simple |
| Préférences UI | Prévu |

## Limites assumées
- PDF scannés : extraction texte impossible sans OCR (non inclus).
- Compression visuelle : dégrade la netteté du texte (avertissement affiché).
- Très gros fichiers : limités par la RAM du navigateur.
- PDF protégés par mot de passe : non supportés.
- Mobile : non prioritaire, ne doit pas être cassé.

## Ton UX
Sobre. Direct. Clair. Efficace. Pas infantilisant. Pas de jargon technique inutile.

## Microcopy clés
- "Dépose tes PDF et images ici."
- "Tout reste dans ton navigateur."
- "Aucun upload serveur."
- "Sélectionne des pages pour activer cette action."
- "Compression visuelle : idéale pour scans et documents image."
- "Attention : le texte peut perdre en netteté."
- "PDF textuel uniquement : les scans nécessitent un OCR non inclus."
- "Tous les fichiers sont traités localement dans votre navigateur. Aucun document n'est envoyé vers un serveur."
