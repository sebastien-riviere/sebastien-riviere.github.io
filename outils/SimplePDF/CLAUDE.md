# CLAUDE.md — SimplePDF

## Règles permanentes du projet

### Stack
- HTML/CSS/JS standalone uniquement.
- Aucun framework lourd (React, Vue, etc.).
- Aucun backend, aucun serveur, aucun build obligatoire.
- Bibliothèques : pdf-lib, PDF.js, JSZip, SortableJS uniquement.
- Compatible GitHub Pages (pas de SSR, pas de Node requis pour l'usage).

### Sécurité et confidentialité
- Aucun fichier utilisateur ne doit être envoyé vers un serveur.
- Aucun fichier utilisateur ne doit être stocké dans localStorage, IndexedDB ou cookies.
- localStorage autorisé uniquement pour : préférences UI, qualité d'export, dernier mode d'export, historique texte du dernier export.
- Pas d'analytics, pas de tracking, pas d'appel réseau non consenti.

### Architecture
- Code modulaire : un fichier JS par responsabilité.
- Ne pas concentrer la logique dans index.html.
- État centralisé dans state.js.
- Pas de dépendances circulaires entre modules.

### UX
- Privilégier robustesse : l'interface reste fonctionnelle même si une fonction échoue.
- États visibles : prêt / chargement / traitement / export / terminé / erreur.
- Actions désactivées si non disponibles (pas de bouton qui ne fait rien silencieusement).
- Messages d'erreur lisibles.
- Toujours afficher le bandeau de confidentialité.

### Vendor
- En production : bibliothèques dans /vendor (fichiers locaux).
- En développement CDN accepté temporairement, mais documenter.
- Ne jamais supprimer /vendor README.

### Commits
- Un commit par fonctionnalité ou correction significative.
- Message : verbe à l'impératif + portée.

### Limites documentées
- Très gros PDF limités par la RAM du navigateur.
- PDF scannés : pas d'extraction texte sans OCR (non inclus).
- Compression visuelle dégrade la netteté du texte.
- PDF protégés par mot de passe : non supportés.

### Fonctions interdites en V1
- OCR.
- PDF vers Word/Excel/PowerPoint.
- Édition du texte existant dans le PDF.
- Réparation PDF corrompu.
- Protection/déverrouillage par mot de passe.
- Traitement serveur.
