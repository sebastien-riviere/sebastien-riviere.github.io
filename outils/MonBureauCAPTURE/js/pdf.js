/* MonBureauCAPTURE — Export PDF (jsPDF) */
const PDFExport = {
  async generate(options = {}) {
    const s = Session.current();
    if (!s) return UI.toast('Aucune session', 'warning');
    if (!s.screenshots.length) return UI.toast('Aucune capture à exporter', 'warning');
    if (!window.jspdf) return UI.toast('jsPDF non chargé — vérifiez votre connexion', 'error');

    UI.toast('Génération du PDF…', 'info');
    await new Promise(r => setTimeout(r, 50));

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    // ── Cover page ────────────────────────────────────
    // Header band
    doc.setFillColor(45, 90, 142);
    doc.rect(0, 0, pageW, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('MonBureauCAPTURE', margin, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(220, 230, 245);
    doc.text(`v${CONFIG.VERSION} · Traitement 100% local`, margin, 30);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const title = s.title.length > 60 ? s.title.slice(0, 57) + '…' : s.title;
    doc.text(title, margin, 70);

    // Meta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);

    const metaLines = [
      `Session : ${s.id}`,
      `Mode : ${s.mode === 'capture' ? 'Capture live' : 'Import fichier'}`,
      `Date : ${Utils.formatDateTime(s.createdAt)}`,
      `Durée : ${Utils.formatDuration(s.duration)}`,
      `Captures : ${s.screenshots.length}`,
      `Marqueurs : ${s.markers.length}`,
    ];
    metaLines.forEach((line, i) => doc.text(line, margin, 82 + i * 6));

    // Privacy footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 50, pageW - margin, pageH - 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 163, 74);
    doc.text('CONFIDENTIALITÉ', margin, pageH - 42);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    CONFIG.PRIVACY.slice(0, 4).forEach((p, i) => {
      doc.text(`• ${p}`, margin, pageH - 35 + i * 5);
    });

    // ── Markers page (if any) ─────────────────────────
    if (s.markers.length) {
      doc.addPage();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(45, 90, 142);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Marqueurs', margin, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      let y = 32;
      s.markers.forEach(m => {
        if (y > pageH - 20) { doc.addPage(); y = 25; }
        doc.setTextColor(45, 90, 142);
        doc.setFont('helvetica', 'bold');
        doc.text(m.timeFormatted, margin, y);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
        doc.text(m.label, margin + 26, y);
        y += 7;
      });
    }

    // ── Screenshots pages ─────────────────────────────
    for (let i = 0; i < s.screenshots.length; i++) {
      const shot = s.screenshots[i];
      doc.addPage();

      // Top band
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageW, 18, 'F');

      doc.setTextColor(45, 90, 142);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${i + 1} / ${s.screenshots.length}`, margin, 12);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(shot.timeFormatted, pageW - margin, 12, { align: 'right' });

      // Image
      try {
        const props = doc.getImageProperties(shot.dataUrl);
        const ratio = props.height / props.width;
        const maxW = pageW - margin * 2;
        const maxH = pageH - 50;
        let w = maxW;
        let h = w * ratio;
        if (h > maxH) { h = maxH; w = h / ratio; }
        const x = (pageW - w) / 2;
        doc.addImage(shot.dataUrl, 'JPEG', x, 24, w, h, '', 'FAST');

        // Label below image
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(shot.label, margin, 24 + h + 8);
      } catch (e) {
        doc.setTextColor(220, 38, 38);
        doc.text('Capture non rendue', margin, 40);
      }
    }

    // ── Notes page ────────────────────────────────────
    if (s.notes && s.notes.trim()) {
      doc.addPage();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(45, 90, 142);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Notes', margin, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(s.notes, pageW - margin * 2);
      let y = 32;
      lines.forEach(line => {
        if (y > pageH - 20) { doc.addPage(); y = 25; }
        doc.text(line, margin, y);
        y += 5.5;
      });
    }

    // Page numbers
    const total = doc.internal.getNumberOfPages();
    for (let p = 2; p <= total; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`${p} / ${total}`, pageW - margin, pageH - 6, { align: 'right' });
      doc.text(`${CONFIG.APP_NAME}`, margin, pageH - 6);
    }

    const filename = `${Utils.slug(s.title)}_captures.pdf`;
    doc.save(filename);
    UI.toast('PDF téléchargé', 'success');
  },
};
