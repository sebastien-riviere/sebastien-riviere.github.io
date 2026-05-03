# PROJECT_MEMORY.md — MonBureauPDF

## Identité
- **Nom** : MonBureauPDF
- **URL cible** : https://sebastien-riviere.github.io/MonBureauPDF/
- **Auteur** : Sébastien Rivière
- **Type** : outil standalone HTML/CSS/JS, GitHub Pages

## Objectif
Créer un outil PDF local-first, sans serveur, sans compte, sans upload, utilisable directement dans le navigateur.

## Promesse
"Manipuler, alléger, réorganiser et exporter ses PDF directement dans le navigateur, sans compte, sans serveur, sans upload."

## Public cible
- Utilisateurs productifs cherchant un outil PDF rapide et sobre.
- Professionnels manipulant des documents sensibles (refus d'upload vers serveur tiers).
- Utilisateurs déjà familiers de AtelierPDF Manoux ou Sejda, cherchant une alternative locale.

## Inspirations
- **AtelierPDF Manoux** (https://lab.manoux.net/outils/AtelierPDF/) : local, compact, direct.
- **Sejda** (https://www.sejda.com/fr/) : catalogue fonctionnel référence.
- **sebastien-riviere.github.io** : cohérence avec les autres outils publiés.

## Décisions prises
- Stack : html/css/js + pdf-lib + PDF.js + JSZip + SortableJS.
- Pas de PWA en V1 (prévu V3).
- Compression : compression visuelle (canvas) uniquement, pas de compression PDF native.
- Extraction texte : PDF.js, PDF textuels uniquement.
- Nom de fichiers exports : préfixe "MonBureauPDF_".
- Structure : sidebar gauche (actions) + zone centrale (grille) + sidebar droite (stats/export).

## Fonctions retenues V1
Import PDF/images, miniatures, grille réorganisable, sélection, suppression, extraction, fusion/export PDF, rotation, export PNG/JPG ZIP, extraction texte, compression visuelle, stats, historique dernier export, vider espace.

## Fonctions retenues V1.5
Numérotation pages, filigrane texte, tampons prédéfinis, en-tête/pied, métadonnées PDF, page blanche, page titre, presets rapides, niveaux de gris, préférences UI.

## Fonctions exclues
OCR, PDF vers Word/Excel/PPT, édition texte PDF, réparation corrompu, protection/déverrouillage, traitement serveur, analytics.

## Contraintes
- GitHub Pages compatible.
- Fonctionne en ouvrant index.html localement.
- Bibliothèques dans /vendor en production.
- Aucun stockage fichier utilisateur.

## Backlog synthétique
- V1 : tool fonctionnel, publiable.
- V1.5 : overlays (filigrane, tampons, numérotation), presets.
- V2 : signature dessinée, N-up, formulaires simples.
- V3 : PWA offline, profils d'automatisation.

## Publication
- Intégration future dans sebastien-riviere.github.io dans la même logique que MDConvert.
- Sous-dossier /tools/MonBureauPDF/ ou repo séparé MonBureauPDF.
