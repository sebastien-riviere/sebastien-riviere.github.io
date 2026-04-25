# MD Convert

Convertissez vos fichiers en Markdown, en local, sans rien installer.

PDF · DOCX · JPG · PNG · Captures smartphone → `.md` ou `.txt` prêts pour Claude et Obsidian.

---

## Utilisation

**[Ouvrir MD Convert →](https://sebastien-riviere.github.io/md-convert)**

Aucune installation. Aucun compte. Vos fichiers ne quittent jamais votre appareil.

---

## Formats supportés

| Format | Type | Qualité |
|---|---|---|
| PDF | Textuel (natif) | Excellente |
| DOCX / DOC | Word | Très bonne |
| JPG / PNG / WEBP | Image + OCR | Bonne (dépend de la photo) |
| Capture smartphone | OCR caméra | Bonne (texte imprimé net) |
| TXT / MD | Texte brut | Parfaite |

---

## Fonctionnalités

- Conversion locale et offline — zéro upload serveur
- OCR intégré pour les images et photos (Tesseract.js)
- Prétraitement automatique de l'image avant OCR
- Indicateur de confiance OCR par fichier
- Traitement par lot — plusieurs fichiers ou dossier entier
- Export unitaire ou ZIP global
- Aperçu avant téléchargement
- Mode sombre / clair
- Langue OCR : FR, EN, FR+EN

## Installer sur l'écran d'accueil (PWA)

**iPhone / iPad**
1. Ouvrir le lien dans Safari
2. Bouton Partager → "Sur l'écran d'accueil"
3. L'app apparaît comme une app native

**Android**
1. Ouvrir le lien dans Chrome
2. Bannière "Ajouter à l'écran d'accueil" ou menu → Installer
3. Fonctionne ensuite hors connexion

---

## Fonctionnement offline

Au premier chargement, les librairies de conversion sont mises en cache par le navigateur. À partir du deuxième lancement, l'outil fonctionne entièrement hors connexion — y compris en mode avion.

Exception : les modèles de langue OCR (Tesseract) se téléchargent une seule fois au premier usage sur image, puis sont également mis en cache.

---

## Stack technique

Vanilla JS · PDF.js · Mammoth.js · Tesseract.js · JSZip · PWA (Service Worker)

Zéro framework. Zéro dépendance runtime. Zéro donnée envoyée.

---

## outils/MD-Convert/
├── index.html          Application complète (libs bundlées inline)
├── manifest.json       Configuration PWA
├── sw.js               Service worker offline
├── icon-192.png        Icône app
├── icon-512.png        Icône app haute résolution
└── README.md           Ce fichier
```

---

## Limites connues

- PDF scanné (image dans PDF) : qualité OCR variable selon la netteté du scan
- PPTX : non supporté en v1 — exporter en PDF depuis PowerPoint avant import
- Sélection de dossier entier : non disponible sur Safari iOS (fichiers multiples OK)
- Texte manuscrit : résultats approximatifs avec Tesseract

---

## Auteur

Sébastien Rivière — IA · Blockchain · Créateur d'outils numériques

[LinkedIn](https://www.linkedin.com/in/s%C3%A9bastien-riviere-conseil/) · [GitHub](https://sebastien-riviere.github.io)

---

## Licence

MIT — libre d'utilisation, de modification et de redistribution avec attribution.
