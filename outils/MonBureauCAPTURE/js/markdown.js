/* MonBureauCAPTURE — Export Markdown */
const Markdown = {
  _header(s) {
    return [
      `> Session **${s.title}**`,
      `> ID \`${s.id}\` · Mode : ${s.mode === 'capture' ? 'Capture live' : 'Import fichier'}`,
      `> Durée : ${Utils.formatDuration(s.duration)} · Créée le : ${Utils.formatDateTime(s.createdAt)}`,
    ].join('\n');
  },

  buildTimeline(s = Session.current()) {
    if (!s) return '';
    const lines = [
      `# Timeline — ${s.title}`,
      ``,
      this._header(s),
      ``,
      `---`,
      ``,
      `## Marqueurs (${s.markers.length})`,
      ``,
    ];

    if (!s.markers.length) lines.push('_Aucun marqueur._');
    else s.markers.forEach(m => {
      lines.push(`- **\`${m.timeFormatted}\`** — ${m.label}`);
    });

    lines.push('', `## Captures (${s.screenshots.length})`, '');
    if (!s.screenshots.length) lines.push('_Aucune capture._');
    else s.screenshots.forEach((sh, i) => {
      lines.push(`- **\`${sh.timeFormatted}\`** — ${sh.label}`);
    });

    if (s.segments?.length) {
      lines.push('', `## Segments enregistrés (${s.segments.length})`, '');
      s.segments.forEach((seg, i) => {
        lines.push(`- Segment ${i + 1} — ${Utils.formatBytes(seg.size)} — \`${seg.filename}\``);
      });
    }

    return lines.join('\n');
  },

  buildNotes(s = Session.current()) {
    if (!s) return '';
    return [
      `# Notes — ${s.title}`,
      ``,
      this._header(s),
      ``,
      `---`,
      ``,
      s.notes || '_Aucune note saisie._',
      ``,
      `---`,
      ``,
      `*${CONFIG.APP_NAME} v${CONFIG.VERSION} — ${Utils.formatDateTime()}*`,
    ].join('\n');
  },

  buildReadme(s = Session.current()) {
    if (!s) return '';
    return [
      `# ${s.title}`,
      ``,
      `Session générée par **${CONFIG.APP_NAME} v${CONFIG.VERSION}**.`,
      ``,
      `## Informations`,
      ``,
      `| Champ | Valeur |`,
      `| --- | --- |`,
      `| Identifiant | \`${s.id}\` |`,
      `| Mode | ${s.mode === 'capture' ? 'Capture live' : 'Import fichier'} |`,
      `| Date | ${Utils.formatDateTime(s.createdAt)} |`,
      `| Durée | ${Utils.formatDuration(s.duration)} |`,
      `| Captures | ${s.screenshots.length} |`,
      `| Marqueurs | ${s.markers.length} |`,
      `| Segments | ${s.segments?.length || 0} |`,
      ...(s.file ? [`| Fichier source | \`${s.file.name}\` (${Utils.formatBytes(s.file.size)}) |`] : []),
      ``,
      `## Contenu de l'archive`,
      ``,
      `- \`manifest.json\` — Manifeste structuré`,
      `- \`timeline.md\` — Chronologie complète`,
      `- \`notes.md\` — Notes manuelles`,
      `- \`timeline.html\` — Timeline interactive HTML`,
      `- \`screenshots/\` — Captures JPEG`,
      `- \`segments/\` — Fichiers WebM enregistrés (si capture live)`,
      `- \`scripts/\` — Scripts FFmpeg de conversion`,
      `- \`notebooklm_pack/\` — Pack NotebookLM (import manuel)`,
      ``,
      `## Confidentialité`,
      ``,
      ...CONFIG.PRIVACY.map(p => `- ${p}`),
      ``,
      `---`,
      ``,
      `*${CONFIG.APP_NAME} v${CONFIG.VERSION} — Traitement 100% local, aucune donnée envoyée.*`,
    ].join('\n');
  },

  buildHtmlTimeline(s = Session.current()) {
    if (!s) return '';
    const esc = Utils.escapeHtml;
    const shots = s.screenshots.map(sh => `
      <article class="shot">
        <a href="screenshots/${esc(this._shotFilename(sh, s.screenshots.indexOf(sh)))}" target="_blank">
          <img src="${sh.dataUrl}" alt="${esc(sh.label)}" loading="lazy">
        </a>
        <div class="shot-info">
          <span class="time">${esc(sh.timeFormatted)}</span>
          <span class="label">${esc(sh.label)}</span>
        </div>
      </article>
    `).join('');

    const markers = s.markers.length ? s.markers.map(m => `
      <li><span class="time">${esc(m.timeFormatted)}</span><span>${esc(m.label)}</span></li>
    `).join('') : '<li class="empty">Aucun marqueur</li>';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Timeline — ${esc(s.title)}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#F4F6F9;color:#0F172A;padding:24px}
  .wrap{max-width:1100px;margin:0 auto}
  header{background:#2D5A8E;color:#fff;padding:24px 28px;border-radius:10px;margin-bottom:24px}
  h1{font-size:1.6rem;font-weight:600;margin-bottom:4px}
  .meta{font-size:.85rem;opacity:.85;font-family:"SF Mono",Consolas,monospace}
  section{background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:20px;margin-bottom:14px}
  h2{font-size:.9rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748B;margin-bottom:14px}
  ul.markers{list-style:none}
  ul.markers li{display:flex;gap:14px;padding:9px 12px;background:#F8FAFC;border-radius:6px;margin-bottom:4px;align-items:center}
  .time{font-family:"SF Mono",Consolas,monospace;font-size:.82rem;color:#2D5A8E;background:#EEF3F9;padding:3px 8px;border-radius:4px;min-width:75px;text-align:center}
  .empty{color:#94A3B8;text-align:center;padding:14px}
  .shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
  .shot{background:#fff;border:1px solid #E2E8F0;border-radius:6px;overflow:hidden;transition:.15s}
  .shot:hover{border-color:#2D5A8E}
  .shot img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
  .shot-info{padding:8px 10px;display:flex;align-items:center;gap:8px;font-size:.78rem;border-top:1px solid #E2E8F0}
  .shot-info .label{color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .notes-content{font-size:.92rem;line-height:1.65;white-space:pre-wrap;padding:14px;background:#F8FAFC;border-radius:6px;color:#334155}
  footer{text-align:center;padding:24px;color:#94A3B8;font-size:.78rem}
  footer a{color:#2D5A8E}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>${esc(s.title)}</h1>
    <div class="meta">${esc(s.id)} · ${esc(Utils.formatDateTime(s.createdAt))} · ${esc(Utils.formatDuration(s.duration))}</div>
  </header>

  <section>
    <h2>Marqueurs (${s.markers.length})</h2>
    <ul class="markers">${markers}</ul>
  </section>

  <section>
    <h2>Captures (${s.screenshots.length})</h2>
    ${s.screenshots.length ? `<div class="shots">${shots}</div>` : '<p class="empty">Aucune capture</p>'}
  </section>

  ${s.notes ? `<section><h2>Notes</h2><div class="notes-content">${esc(s.notes)}</div></section>` : ''}

  <footer>
    Généré par <a href="https://sebastien-riviere.github.io/outils/">${CONFIG.APP_NAME}</a> v${CONFIG.VERSION} · Traitement 100% local
  </footer>
</div>
</body>
</html>`;
  },

  _shotFilename(shot, idx) {
    return `capture_${Utils.pad(idx + 1)}_${shot.timeFormatted.replace(/:/g, '-')}.jpg`;
  },

  downloadTimeline() {
    const s = Session.current(); if (!s) return UI.toast('Aucune session', 'warning');
    Utils.downloadText(this.buildTimeline(s), `${Utils.slug(s.title)}_timeline.md`, 'text/plain;charset=utf-8');
    UI.toast('timeline.md téléchargé', 'success');
  },

  downloadNotes() {
    const s = Session.current(); if (!s) return;
    Utils.downloadText(this.buildNotes(s), `${Utils.slug(s.title)}_notes.md`, 'text/plain;charset=utf-8');
    UI.toast('notes.md téléchargé', 'success');
  },

  downloadReadme() {
    const s = Session.current(); if (!s) return;
    Utils.downloadText(this.buildReadme(s), `${Utils.slug(s.title)}_README.md`, 'text/plain;charset=utf-8');
    UI.toast('README.md téléchargé', 'success');
  },

  downloadHtmlTimeline() {
    const s = Session.current(); if (!s) return;
    Utils.downloadText(this.buildHtmlTimeline(s), `${Utils.slug(s.title)}_timeline.html`, 'text/html;charset=utf-8');
    UI.toast('timeline.html téléchargé', 'success');
  },
};
