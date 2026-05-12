/* MonBureauCAPTURE — Export ZIP complet (JSZip) */
const ZipExport = {
  async generate(opts = {}) {
    const s = Session.current();
    if (!s) return UI.toast('Aucune session', 'warning');
    if (!window.JSZip) return UI.toast('JSZip non chargé', 'error');

    const {
      includeSegments = true,
      includeScreenshots = true,
      includeNotebookLM = true,
      includeHtml = true,
    } = opts;

    UI.toast('Création du ZIP en cours…', 'info');
    await new Promise(r => setTimeout(r, 50));

    const zip = new JSZip();
    const slug = Utils.slug(s.title);
    const root = zip.folder(slug);

    // Manifest + Markdowns à la racine
    root.file('manifest.json', JSON.stringify(Manifest.build(s), null, 2));
    root.file('timeline.md', Markdown.buildTimeline(s));
    root.file('notes.md', Markdown.buildNotes(s));
    root.file('README.md', Markdown.buildReadme(s));

    if (includeHtml) {
      root.file('timeline.html', Markdown.buildHtmlTimeline(s));
    }

    // Scripts FFmpeg
    const scriptsFolder = root.folder('scripts');
    Scripts.files(s).forEach(f => scriptsFolder.file(f.name, f.content));

    // Screenshots
    if (includeScreenshots && s.screenshots.length) {
      const shots = root.folder('screenshots');
      s.screenshots.forEach((shot, i) => {
        const b64 = shot.dataUrl.split(',')[1];
        const fname = `capture_${Utils.pad(i + 1)}_${shot.timeFormatted.replace(/:/g, '-')}.jpg`;
        shots.file(fname, b64, { base64: true });
      });
    }

    // Segments WebM
    if (includeSegments && s.segments?.length) {
      const seg = root.folder('segments');
      for (const segment of s.segments) {
        const buf = await segment.blob.arrayBuffer();
        seg.file(segment.filename, buf);
      }
    }

    // NotebookLM pack
    if (includeNotebookLM) {
      const nlm = root.folder('notebooklm_pack');
      NotebookLM.files(s).forEach(f => nlm.file(f.name, f.content));
    }

    // Generate
    try {
      const blob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        meta => UI.updateZipProgress(Math.round(meta.percent))
      );
      Utils.download(blob, `${slug}.zip`);
      UI.updateZipProgress(0);
      UI.toast('Archive ZIP téléchargée', 'success');
    } catch (e) {
      UI.toast('Erreur ZIP : ' + e.message, 'error', 6000);
    }
  },
};
