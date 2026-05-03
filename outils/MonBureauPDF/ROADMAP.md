# ROADMAP.md — MonBureauPDF

## V1 — MVP publiable (actuel)

### Critères d'acceptation V1
- [ ] index.html fonctionne en local sans serveur.
- [ ] Import PDF et images (JPG, PNG, WebP).
- [ ] Miniatures générées via PDF.js.
- [ ] Grille réorganisable par drag & drop.
- [ ] Sélection simple, multiple, plage, tout, vider.
- [ ] Suppression de pages sélectionnées.
- [ ] Extraction sélection → PDF.
- [ ] Fusion/export PDF selon ordre visuel.
- [ ] Rotation page (gauche/droite).
- [ ] Rotation sélection.
- [ ] Export PNG ZIP.
- [ ] Export JPG ZIP (qualité réglable).
- [ ] Extraction texte brut (PDF textuels).
- [ ] Compression visuelle avec slider.
- [ ] Stats complètes.
- [ ] Historique dernier export.
- [ ] Bouton vider espace.
- [ ] Messages d'erreur lisibles.
- [ ] États de traitement visibles.
- [ ] Bandeau confidentialité.
- [ ] Aucun appel réseau hors bibliothèques vendor.
- [ ] README complet.

## V1.5 — Overlays et presets

### Fonctions
- [ ] Numérotation des pages.
- [ ] Filigrane texte (opacité, orientation, position).
- [ ] Tampons prédéfinis (BROUILLON, CONFIDENTIEL, VALIDÉ, À SIGNER, URGENT).
- [ ] En-tête et pied de page.
- [ ] Métadonnées PDF (titre, auteur, sujet, mots-clés).
- [ ] Ajouter une page blanche.
- [ ] Ajouter une page titre.
- [ ] Presets rapides (Alléger pour email, Fusion propre, Extraire sélection, PDF vers images, Dossier administratif).
- [ ] Niveaux de gris.
- [ ] Sauvegarde préférences UI (localStorage).

## V2 — Edition avancée

### Fonctions envisagées
- Signature dessinée (canvas).
- Remplissage de formulaires PDF simples.
- N-up (2 pages par feuille).
- Redimensionnement/recadrage de pages.
- Annotation basique (texte, rectangle).

## V3 — PWA et automatisation

### Fonctions envisagées
- PWA offline (Service Worker).
- Profils d'automatisation (séquences d'actions sauvegardées).
- Batch massif multi-fichiers.
- Raccourcis clavier avancés.
- Mode sombre.

## Backlog priorisé

| Priorité | Fonction | Version |
|---|---|---|
| 1 | Stabilité V1 complète | V1 |
| 2 | Numérotation pages | V1.5 |
| 3 | Filigrane texte | V1.5 |
| 4 | Tampons | V1.5 |
| 5 | Presets | V1.5 |
| 6 | Métadonnées | V1.5 |
| 7 | Page blanche | V1.5 |
| 8 | En-tête/pied | V1.5 |
| 9 | Signature | V2 |
| 10 | PWA | V3 |

## Fonctions hors scope (jamais)
- OCR complet.
- PDF vers Word/Excel/PPT.
- Déverrouillage PDF chiffré.
- Réparation PDF corrompu.
- Traitement serveur.
