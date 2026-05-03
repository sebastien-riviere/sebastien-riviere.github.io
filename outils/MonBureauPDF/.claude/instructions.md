# .claude/instructions.md — MonBureauPDF

## Instructions opérationnelles pour Claude Code

### Comment coder
- Toujours travailler en HTML/CSS/JS vanilla. Pas de framework, pas de TypeScript, pas de build.
- Un fichier JS = une responsabilité. Pas de logique métier dans ui.js, pas de DOM dans state.js.
- Utiliser des événements custom (`CustomEvent`) pour la communication inter-modules.
- Toujours lire le fichier concerné avant de modifier.
- Préférer `Edit` à `Write` pour les modifications partielles.

### Comment éviter les régressions
- Avant toute modification d'un module, vérifier les modules qui en dépendent.
- Ne pas modifier l'interface publique d'un module sans mettre à jour ses appelants.
- Les fonctions critiques (export, pdf-builder) doivent avoir des try/catch avec messages lisibles.
- Ne jamais supprimer un état de state.js sans vérifier que personne ne l'utilise.

### Comment tester
- Ouvrir index.html dans un navigateur (Chrome recommandé).
- Tester avec : un PDF simple, un PDF multipage, une image JPG, une image PNG.
- Tester les cas limites : PDF vide, PDF d'une page, très gros PDF.
- Vérifier la console pour les erreurs.
- Vérifier l'onglet Network : aucune requête externe pendant le traitement.
- Tests manuels complets dans PRODUCT_BRIEF.md.

### Comment documenter
- Mettre à jour CHANGELOG.md après chaque session de travail significative.
- Mettre à jour ROADMAP.md si une fonction est ajoutée ou reportée.
- Commenter uniquement ce qui est non-évident (pas le "quoi", le "pourquoi").
- Les décisions d'architecture importantes vont dans TECHNICAL_SCOPE.md.

### Comment gérer les limites
- Afficher des messages d'erreur lisibles en français, pas des stack traces.
- Désactiver les boutons d'actions non disponibles (pas de silently fail).
- Si une bibliothèque vendor manque, afficher un message explicite avec la solution.
- Si un PDF est chiffré, détecter et informer l'utilisateur (ne pas crasher).

### Comment signaler les décisions
- Toute décision d'architecture non triviale : documenter dans TECHNICAL_SCOPE.md.
- Toute fonction reportée : mettre à jour ROADMAP.md.
- Toute limite découverte : mettre à jour PRODUCT_BRIEF.md et README.md.
- Fin de session : mettre à jour CHANGELOG.md.

### Checklist avant chaque livraison
- [ ] index.html ouvre sans erreur console.
- [ ] Aucun appel réseau pendant le traitement de fichiers.
- [ ] Aucun fichier utilisateur dans localStorage.
- [ ] Boutons désactivés si action non disponible.
- [ ] Bandeau confidentialité visible.
- [ ] README à jour.
- [ ] CHANGELOG à jour.
- [ ] ROADMAP cohérent avec l'état réel.
