/* MonBureauCAPTURE — Manifest JSON */
const Manifest = {
  build(s = Session.current()) {
    if (!s) return null;
    return {
      app: CONFIG.APP_NAME,
      version: CONFIG.VERSION,
      generatedAt: new Date().toISOString(),
      session: {
        id: s.id,
        title: s.title,
        mode: s.mode,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        duration: s.duration,
        durationFormatted: Utils.formatDuration(s.duration),
        notes: s.notes,
        tags: s.tags || [],
      },
      file: s.file || null,
      segments: (s.segments || []).map(seg => ({
        index: seg.index,
        filename: seg.filename,
        size: seg.size,
        duration: seg.duration,
      })),
      screenshots: s.screenshots.map((sh, i) => ({
        id: sh.id,
        index: i,
        filename: `screenshots/capture_${Utils.pad(i + 1)}_${sh.timeFormatted.replace(/:/g, '-')}.jpg`,
        time: sh.time,
        timeFormatted: sh.timeFormatted,
        label: sh.label,
        createdAt: sh.createdAt,
      })),
      markers: s.markers.map(m => ({
        id: m.id,
        time: m.time,
        timeFormatted: m.timeFormatted,
        label: m.label,
      })),
      privacy: CONFIG.PRIVACY,
    };
  },

  download() {
    const m = this.build();
    if (!m) return UI.toast('Aucune session', 'warning');
    const json = JSON.stringify(m, null, 2);
    Utils.downloadText(json, `${Utils.slug(m.session.title)}_manifest.json`, 'application/json');
    UI.toast('manifest.json téléchargé', 'success');
  },
};
