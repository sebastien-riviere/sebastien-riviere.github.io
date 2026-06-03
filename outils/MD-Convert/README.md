# MD Convert

Transformez vos PDF, ebooks, captures, documents Word, notes et transcripts en fichiers propres pour l'IA et votre second cerveau.

**[Ouvrir MD Convert →](https://sebastien-riviere.github.io/outils/MD-Convert/)**

Sans installation. Sans compte. Vos fichiers restent sur votre appareil.

---

## Formats supportés

| Format | Type | Qualité |
|---|---|---|
| PDF | Texte natif | Excellente |
| PDF scanné / ebook PDF | OCR automatique | Bonne (selon netteté du scan) |
| DOCX / DOC | Word | Très bonne |
| JPG / PNG / WEBP | Image + OCR | Bonne (texte imprimé net) |
| Capture smartphone | Photo OCR | Bonne (texte net et bien cadré) |
| TXT / MD | Texte brut | Parfaite |
| Texte collé | Copier-coller | Parfaite |
| YouTube (lien) | Transcript automatique | Bonne (si sous-titres disponibles) |
| Article web (URL) | Import texte | Bonne (si page non bloquée) |
| Google Doc public (URL) | Import texte | Très bonne |
| Fichier GitHub (URL) | Import texte | Parfaite |

---

## Fonctionnalités

- Conversion locale et offline — zéro envoi serveur
- OCR intégré pour images et photos (Tesseract.js)
- Pré-traitement automatique des images avant OCR
- Indicateur de confiance OCR par fichier
- Langue OCR sélectionnable : FR / EN / FR+EN
- Traitement par lot — plusieurs fichiers ou dossier entier
- Export unitaire ou ZIP global
- Fusion de fichiers en un seul document
- Aperçu avant téléchargement
- Copie en un clic
- Renommage des fichiers de sortie
- Estimation tokens (MD Convert vs document brut)
- Mode sombre / clair
- PWA installable sur iPhone, Android et bureau
- Fonctionnement hors ligne après le premier chargement
- **Enrichissement IA → note Obsidian** (v2.0) : titres sémantiques, tags inférés,
  frontmatter complet. Optionnel, BYOK (clé OpenRouter stockée localement). Avec
  consigne libre (texte ou dictée vocale).
- **Ouverture directe dans Obsidian** via URI (v2.0)

---

## Usages typiques

**Pour l'IA (Claude, ChatGPT, Gemini…)**
- Préparer un PDF ou un ebook en Markdown structuré avant de le soumettre
- Nettoyer un document Word pour réduire le bruit dans le contexte
- OCR une capture smartphone pour la rendre interrogeable
- Réduire le nombre de tokens sans perdre l'information utile

**Pour le second cerveau (Obsidian, NotebookLM, Notion…)**
- Convertir des sources éparpillées en notes propres et réutilisables
- Consolider plusieurs documents en un seul fichier Markdown
- Extraire le texte d'images et de pages photographiées

---

## Import par URL

L'outil accepte les URLs directement dans le panneau d'import :

- **YouTube** — coller le lien de la vidéo ; le transcript est récupéré automatiquement si des sous-titres sont disponibles. En cas d'échec, coller le transcript manuellement dans le champ texte.
- **Articles web** — import du texte via le service [Jina.ai](https://jina.ai) (connexion internet requise). Certaines pages peuvent être bloquées.
- **Google Doc public** — import direct du texte exporté.
- **GitHub** — import du fichier brut depuis `github.com` ou `raw.githubusercontent.com`.

> Pour un usage entièrement offline ou privé, copier-coller le texte directement dans le champ prévu à cet effet.

---

## Estimation tokens

Chaque fichier converti affiche une estimation du nombre de tokens :

- **Vert** — tokens estimés du Markdown généré par MD Convert
- **Orange** — tokens estimés du document brut s'il était envoyé tel quel à une IA

Ces valeurs sont indicatives (approximation locale, aucun envoi de données).

---

## Installation comme app (PWA)

**iPhone / iPad**
1. Ouvrir le lien dans Safari
2. Bouton Partager → « Sur l'écran d'accueil »
3. L'app apparaît comme une app native

**Android**
1. Ouvrir le lien dans Chrome
2. Bannière ou menu → « Installer »
3. Fonctionne hors ligne ensuite

---

## Fonctionnement offline

Au premier chargement, les bibliothèques de conversion sont mises en cache par le navigateur. À partir du deuxième lancement, l'outil fonctionne entièrement hors ligne — y compris en mode avion.

Exception : les modèles OCR (Tesseract) sont téléchargés une seule fois à la première utilisation d'une image, puis mis en cache.

---

## Stack technique

Vanilla JS · PDF.js · Mammoth.js · Tesseract.js · JSZip · PWA (Service Worker)

Zéro framework. Zéro dépendance runtime. Zéro donnée envoyée.

---

## Architecture

```
├── index.html              Application complète (libs intégrées en base64)
├── manifest.json           Configuration PWA
├── sw.js                   Service worker offline
├── icon-192.png            Icône app
├── icon-512.png            Icône haute résolution
├── cloudflare-worker/      Worker optionnel pour transcripts YouTube
│   └── deno-worker.ts      Worker Deno Deploy (InnerTube ANDROID + fallbacks)
└── README.md               Ce fichier
```

---

## Limites connues

- **PDF scanné** : qualité OCR variable selon la netteté du scan
- **Très gros fichiers** : traitement local limité par la RAM du navigateur ; recommandé < 50 Mo par fichier
- **PPTX** : non supporté en v1 — exporter en PDF depuis PowerPoint avant import
- **Google Slides / Sheets** : non supportés directement — exporter en PDF ou copier-coller le texte
- **Audio / vidéo** : transcription audio non supportée
- **Texte manuscrit** : résultats approximatifs avec Tesseract
- **Sélection de dossier** : non disponible sur Safari iOS (import de plusieurs fichiers OK)
- **Pages web** : certaines pages bloquent les imports automatiques ; utiliser le copier-coller dans ce cas

---

## Auteur

Sébastien Rivière — IA · Blockchain · Outils numériques

[LinkedIn](https://www.linkedin.com/in/s%C3%A9bastien-riviere-conseil/) · [GitHub](https://sebastien-riviere.github.io)

---

## Licence

MIT — libre d'utilisation, de modification et de redistribution avec attribution.
