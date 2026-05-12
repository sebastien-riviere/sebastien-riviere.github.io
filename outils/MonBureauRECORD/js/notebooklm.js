/* MonBureauRECORD — Pack NotebookLM (sans IA, sans API) */
const NotebookLM = {
  files(s = Session.current()) {
    if (!s) return [];

    const timeline = Markdown.buildTimeline(s);
    const notes = Markdown.buildNotes(s);

    const index = [
      `# Pack NotebookLM — ${s.title}`,
      ``,
      `> Session ${CONFIG.APP_NAME} \`${s.id}\``,
      `> Mode : ${s.mode === 'capture' ? 'Capture live' : 'Import fichier'} · Durée : ${Utils.formatDuration(s.duration)}`,
      `> Date : ${Utils.formatDateTime(s.createdAt)}`,
      ``,
      `## Fichiers à importer`,
      ``,
      `1. \`fiche_source.md\` — Description de la source`,
      `2. \`timeline.md\` — Chronologie complète`,
      `3. \`questions_a_poser.md\` — Questions suggérées`,
      `4. \`notes.md\` — Vos notes manuelles`,
      `5. \`README_IMPORT.md\` — Procédure d'import`,
      ``,
      `## Comment importer ?`,
      ``,
      `1. Ouvrir https://notebooklm.google.com`,
      `2. Créer un nouveau notebook nommé "${s.title}"`,
      `3. Cliquer sur "Ajouter une source" → "Télécharger un fichier"`,
      `4. Importer chaque fichier .md ci-dessus`,
      `5. Utiliser les questions suggérées pour interroger le contenu`,
      ``,
      `> **L'import est 100% manuel.** ${CONFIG.APP_NAME} ne contacte pas Google.`,
    ].join('\n');

    const ficheSource = [
      `# Fiche source — ${s.title}`,
      ``,
      `## Identification`,
      ``,
      `- **Titre :** ${s.title}`,
      `- **Type :** ${s.mode === 'capture' ? 'Enregistrement d\'écran' : 'Fichier importé'}`,
      `- **Durée :** ${Utils.formatDuration(s.duration)}`,
      `- **Date :** ${Utils.formatDateTime(s.createdAt)}`,
      ...(s.file ? [`- **Format source :** \`${s.file.ext}\` (${Utils.formatBytes(s.file.size)})`] : []),
      ``,
      `## Statistiques`,
      ``,
      `- ${s.markers.length} marqueur(s) temporel(s)`,
      `- ${s.screenshots.length} capture(s) d'écran`,
      `- ${s.segments?.length || 0} segment(s) enregistré(s)`,
      ``,
      `## Contexte / Description`,
      ``,
      s.notes && s.notes.trim()
        ? s.notes
        : `_Décrire ici manuellement le contexte de cette session : objectif, participants, sujets abordés, etc._`,
      ``,
      `---`,
      ``,
      `*Source générée par ${CONFIG.APP_NAME} v${CONFIG.VERSION} — Traitement 100% local.*`,
    ].join('\n');

    const questions = [
      `# Questions à poser à NotebookLM`,
      ``,
      `> Adaptez ces questions à votre contenu spécifique.`,
      ``,
      `## Synthèse globale`,
      ``,
      `- Quels sont les **3 à 5 points clés** abordés dans cette session ?`,
      `- Résume les idées principales en 200 mots.`,
      `- Quelles **décisions** ont été prises ?`,
      `- Quels sont les **points d'action** identifiés et leurs responsables ?`,
      `- Quelles **questions ouvertes** restent à trancher ?`,
      `- Y a-t-il des **désaccords** ou points de tension évoqués ?`,
      ``,
      `## Analyse approfondie`,
      ``,
      `- Quels **risques** ou points de vigilance sont mentionnés ?`,
      `- Quels **chiffres, dates ou données** importantes ressortent ?`,
      `- Quels **outils, méthodes ou ressources** sont recommandés ?`,
      `- Quels **acronymes ou termes techniques** méritent d'être expliqués ?`,
      ``,
      `## Timeline`,
      ``,
      s.markers.length
        ? s.markers.map(m => `- À \`${m.timeFormatted}\` — "${m.label}" : que s'est-il passé ?`).join('\n')
        : `- Identifie les moments charnières de la session.`,
      ``,
      `## Suite à donner`,
      ``,
      `- Quels sont les **prochaines étapes** définies ?`,
      `- Que faut-il préparer pour la **prochaine itération** ?`,
      `- Comment **mesurer le succès** des actions décidées ?`,
      ``,
      `---`,
      ``,
      `> NotebookLM est un service Google. Son utilisation est régie par les conditions de Google.`,
      `> ${CONFIG.APP_NAME} ne contacte aucune API externe.`,
    ].join('\n');

    const importGuide = [
      `# Guide d'import dans NotebookLM`,
      ``,
      `## Étapes`,
      ``,
      `1. Ouvrir **https://notebooklm.google.com** dans votre navigateur`,
      `2. Se connecter avec votre compte Google`,
      `3. Cliquer sur **"+ Nouveau notebook"** ou **"Create new"**`,
      `4. Donner le titre : **${s.title}**`,
      `5. Cliquer sur **"+ Ajouter une source"** (panneau de gauche)`,
      `6. Choisir **"Télécharger un fichier"**`,
      `7. Importer les fichiers dans cet ordre :`,
      `   1. \`fiche_source.md\``,
      `   2. \`timeline.md\``,
      `   3. \`questions_a_poser.md\``,
      `   4. \`notes.md\` (si renseignées)`,
      `8. Patienter le temps de l'analyse par NotebookLM`,
      `9. Utiliser le panneau de chat pour poser les questions suggérées`,
      ``,
      `## Conseils`,
      ``,
      `- **Ne pas dépasser** la limite de sources de NotebookLM (variable selon le compte)`,
      `- Pour de **meilleurs résultats**, ajoutez une transcription manuelle ou générée via Whisper`,
      `- Les **fichiers vidéo/audio** ne peuvent pas être importés directement — convertissez-les en transcription d'abord`,
      ``,
      `## Important — Confidentialité`,
      ``,
      `- L'import est **100% manuel**. ${CONFIG.APP_NAME} ne se connecte pas à NotebookLM.`,
      `- ${CONFIG.APP_NAME} **ne contient pas d'IA**. Le traitement IA est effectué par NotebookLM **après** import volontaire de votre part.`,
      `- Une fois sur NotebookLM, vos données sont soumises aux conditions de Google.`,
      ``,
      `## Ressources`,
      ``,
      `- NotebookLM : https://notebooklm.google.com`,
      `- Whisper (transcription locale) : https://github.com/openai/whisper`,
      `- FFmpeg (conversion) : https://ffmpeg.org`,
      ``,
      `---`,
      ``,
      `*${CONFIG.APP_NAME} v${CONFIG.VERSION}*`,
    ].join('\n');

    return [
      { name: 'index_notebooklm.md', content: index },
      { name: 'fiche_source.md', content: ficheSource },
      { name: 'timeline.md', content: timeline },
      { name: 'questions_a_poser.md', content: questions },
      { name: 'notes.md', content: notes },
      { name: 'README_IMPORT.md', content: importGuide },
    ];
  },

  download() {
    const s = Session.current(); if (!s) return UI.toast('Aucune session', 'warning');
    const files = this.files(s);
    files.forEach((f, i) => {
      setTimeout(() => Utils.downloadText(f.content, f.name, 'text/plain;charset=utf-8'), i * 250);
    });
    UI.toast(`Pack NotebookLM : ${files.length} fichiers en téléchargement`, 'success');
  },
};
