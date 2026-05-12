/* MonBureauCAPTURE — Presets d'export */
const Presets = {
  list: [
    {
      id: 'standard',
      icon: 'i-package',
      title: 'Pack standard',
      desc: 'Timeline + notes + manifest + scripts FFmpeg',
      actions: ['timeline', 'notes', 'manifest', 'bat', 'sh'],
    },
    {
      id: 'pdf',
      icon: 'i-file-text',
      title: 'PDF illustré',
      desc: 'Toutes les captures dans un PDF avec marqueurs',
      actions: ['pdf'],
    },
    {
      id: 'notebooklm',
      icon: 'i-brain',
      title: 'Pack NotebookLM',
      desc: '6 fichiers pour import manuel sur notebooklm.google.com',
      actions: ['notebooklm'],
    },
    {
      id: 'html',
      icon: 'i-eye',
      title: 'Timeline HTML',
      desc: 'Page interactive partageable hors-ligne',
      actions: ['html'],
    },
    {
      id: 'screenshots',
      icon: 'i-image',
      title: 'Captures JPEG',
      desc: 'Téléchargement individuel de toutes les captures',
      actions: ['screenshots'],
    },
    {
      id: 'full-zip',
      icon: 'i-archive',
      title: 'ZIP complet',
      desc: 'Tout en une seule archive (recommandé)',
      actions: ['zip'],
    },
  ],

  async run(id) {
    const preset = this.list.find(p => p.id === id);
    if (!preset) return;
    if (!Session.current()) return UI.toast('Aucune session', 'warning');

    UI.toast(`Lancement : ${preset.title}…`, 'info');

    for (const action of preset.actions) {
      await new Promise(r => setTimeout(r, 250));
      switch (action) {
        case 'timeline': Markdown.downloadTimeline(); break;
        case 'notes': Markdown.downloadNotes(); break;
        case 'readme': Markdown.downloadReadme(); break;
        case 'html': Markdown.downloadHtmlTimeline(); break;
        case 'manifest': Manifest.download(); break;
        case 'pdf': await PDFExport.generate(); break;
        case 'bat': Scripts.downloadBat(); break;
        case 'sh': Scripts.downloadSh(); break;
        case 'notebooklm': NotebookLM.download(); break;
        case 'screenshots': Shots.downloadAll(); break;
        case 'zip': await ZipExport.generate(); break;
      }
    }
  },
};
