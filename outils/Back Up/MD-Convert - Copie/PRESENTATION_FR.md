# MD Convert — Préparez de meilleures sources pour l'IA et votre second cerveau

**[Accéder à l'outil →](https://sebastien-riviere.github.io/outils/MD-Convert/)**

Gratuit · Local · Sans compte · Sans serveur · Sans tracking

---

## Pourquoi MD Convert existe

On parle beaucoup de prompts, d'agents IA et d'automatisation.

Mais le vrai sujet est souvent beaucoup plus simple :

**Qu'est-ce qu'on donne à travailler à son IA et à son second cerveau ?**

PDF, ebooks, captures smartphone, pages de livres photographiées, documents Word, notes, transcripts YouTube, textes récupérés sur le web…

L'information existe. Elle est partout.

Mais elle est rarement dans un format propre, léger et directement exploitable.

C'est exactement pour ça que j'ai construit MD Convert.

---

## Ce que ça fait concrètement

| Source | Résultat |
|---|---|
| PDF ou ebook PDF | Markdown structuré, prêt pour l'IA |
| Document Word | Fichier propre, sans balisage résiduel |
| Capture smartphone | Texte exploitable via OCR |
| Page photographiée | Note réutilisable |
| Lien YouTube | Transcript avec horodatage |
| Article web (URL) | Texte propre importé |
| Plusieurs sources | Archive ZIP ou fichier fusionné |

---

## Pourquoi les inputs IA comptent

En IA, la qualité de l'input fait souvent une grosse partie de la qualité de l'output.

Un PDF brut envoyé à Claude ou ChatGPT, c'est du bruit : métadonnées, mise en forme parasitaire, tokens inutiles.

Un fichier Markdown propre, c'est :
- moins de tokens consommés ;
- un contexte plus lisible pour le modèle ;
- des réponses plus précises.

MD Convert affiche l'estimation comparée : **tokens Markdown généré vs tokens du document brut**. La différence est souvent significative.

---

## Mon usage quotidien

1. Je récupère une source (PDF, capture, article, transcript).
2. Je la passe dans MD Convert.
3. Je l'envoie dans Obsidian, Claude ou NotebookLM pour en faire une fiche, une synthèse ou une ressource projet.

C'est comme ça que je construis ma base de connaissances sans passer 20 minutes à copier-coller, renommer, ranger et reformater.

---

## Confidentialité totale

MD Convert fonctionne dans le navigateur, en local.

- **Zéro compte** — aucune inscription
- **Zéro serveur** — aucun fichier envoyé
- **Zéro tracking** — aucune analytics
- **Les fichiers restent sur votre appareil**

Exception : l'import d'articles web par URL utilise le service Jina.ai (connexion internet requise). Pour un usage entièrement privé, le copier-coller du texte suffit.

---

## Installable comme une app

MD Convert est une PWA (Progressive Web App).

**iPhone / iPad** : Safari → Partager → « Sur l'écran d'accueil »

**Android** : Chrome → menu → « Installer »

Une fois installée, elle fonctionne hors ligne — y compris en mode avion.

---

## Limites à connaître

- **Très gros fichiers** : le traitement local dépend de la RAM du navigateur. Fichiers < 50 Mo recommandés.
- **PDF scanné** : la qualité OCR dépend de la netteté du scan.
- **PPTX** : pas encore supporté — exporter en PDF depuis PowerPoint avant import.
- **Audio / vidéo** : pas de transcription audio pour l'instant.
- **YouTube** : l'import automatique fonctionne si des sous-titres sont disponibles. Sinon, coller le transcript manuellement.
- **Pages web** : certaines pages bloquent les imports automatiques. Copier-coller le texte dans ce cas.

---

## Open source

Le code est disponible sur GitHub.

Construit pour moi, partagé pour celles et ceux qui veulent mieux travailler avec l'IA et leur second cerveau — sans empiler les usines à gaz.

[GitHub →](https://sebastien-riviere.github.io) · [LinkedIn →](https://www.linkedin.com/in/sebastien-riviere-conseil/)

---

*Sébastien Rivière — IA · Blockchain · Outils numériques*
