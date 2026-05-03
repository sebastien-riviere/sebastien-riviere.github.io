# CHANGELOG.md — MonBureauPDF

## [1.0.0] — 2026-05-02

### Initial release — V1 MVP

#### Ajouté
- Structure complète du projet (HTML/CSS/JS modulaire).
- Import PDF et images (JPG, JPEG, PNG, WebP) par bouton et drag & drop.
- Rendu miniatures via PDF.js.
- Grille de pages réorganisable via SortableJS.
- Sélection : simple, multiple, plage (Shift), tout sélectionner, vider sélection.
- Suppression des pages sélectionnées.
- Extraction des pages sélectionnées en PDF séparé.
- Fusion et export du PDF courant selon l'ordre visuel.
- Rotation gauche/droite par page et sur sélection.
- Export pages en PNG ZIP.
- Export pages en JPG ZIP (qualité réglable).
- Extraction texte brut depuis PDF textuels.
- Compression visuelle avec slider qualité.
- Statistiques : fichiers, pages, sélection, poids initial, poids export, delta.
- Historique du dernier export.
- Bouton vider l'espace de travail.
- États de traitement : prêt, chargement, traitement, export, terminé, erreur.
- Bandeau de confidentialité permanent.
- Messages d'erreur lisibles.
- Architecture V1.5 préparée (overlay-actions.js, presets.js).
- Documentation projet complète (PROJECT_MEMORY, PRODUCT_BRIEF, TECHNICAL_SCOPE, ROADMAP).
- CLAUDE.md et .claude/instructions.md pour la continuité Claude Code.
- Skill projet .claude/skills/MonBureauPDF-standalone-pdf/SKILL.md.
- vendor/README.md avec instructions de téléchargement des bibliothèques.

#### Bibliothèques utilisées
- pdf-lib 1.17.x — création et modification PDF.
- PDF.js 4.x — rendu miniatures.
- JSZip 3.10.x — export ZIP.
- SortableJS 1.15.x — drag & drop grille.

#### Notes
- Version initiale avec CDN jsDelivr pour développement.
- Pour production GitHub Pages : télécharger les bibliothèques dans /vendor (voir vendor/README.md).
