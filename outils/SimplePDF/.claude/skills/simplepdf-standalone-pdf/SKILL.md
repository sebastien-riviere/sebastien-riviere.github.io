---
name: simplepdf-standalone-pdf
description: Build and maintain SimplePDF, a standalone browser-based PDF productivity tool for GitHub Pages with no backend and local-only file processing.
---

# SimplePDF Standalone PDF Skill

## Mission
Build SimplePDF as a local-first browser PDF tool. Compact, premium UX, no server, no account, no upload.

## Hard rules
- No backend.
- No upload.
- No analytics.
- No database.
- No persistent storage of user files.
- GitHub Pages compatible.
- HTML/CSS/JS only unless explicitly approved.
- Vendor libraries must be local in production.
- No eval(), no innerHTML with user content.

## Allowed libraries
- pdf-lib (PDF creation/modification)
- PDF.js (thumbnail rendering)
- JSZip (ZIP export)
- SortableJS (drag & drop grid)

## Allowed V1 features
- Import PDFs/images (JPG, JPEG, PNG, WebP).
- Render thumbnails via PDF.js canvas.
- Reorder pages via SortableJS drag & drop.
- Select pages (single, multiple, range, all, clear).
- Delete selected pages.
- Extract selected pages to new PDF.
- Merge/export full PDF (visual order).
- Rotate pages left/right (per page and on selection).
- Export pages to PNG ZIP.
- Export pages to JPG ZIP (quality adjustable).
- Extract text from textual PDFs.
- Visual compression (canvas quality slider).
- Stats: files, pages, selection, weight before/after.
- Last export history.
- Clear workspace.
- Error messages in plain French.
- Status states: ready/loading/processing/exporting/done/error.
- Privacy banner (always visible).

## Allowed V1.5 features
- Page numbering (bottom center, "Page X / Y").
- Text watermark (opacity, horizontal/diagonal, center).
- Predefined stamps (BROUILLON, CONFIDENTIEL, VALIDÉ, À SIGNER, URGENT).
- Header/footer (text, left/center/right).
- PDF metadata (title, author, subject, keywords).
- Add blank page (A4 portrait).
- Add title page (title, subtitle, optional date).
- Quick presets (Alléger email, Fusion propre, Extraire sélection, PDF → images, Dossier admin).
- Grayscale conversion if simple.
- UI preferences in localStorage (jpg quality, compression quality, export mode).

## Forbidden in V1
- OCR.
- PDF to Word/Excel/PowerPoint.
- Full PDF text editing (existing text in PDF).
- Repair corrupted PDFs.
- Password cracking/unlocking.
- Advanced annotation removal.
- Server-side processing of any kind.
- Storing user files in localStorage or IndexedDB.

## Module responsibilities

| Module | Responsibility |
|---|---|
| app.js | Bootstrap, module wiring, event bus |
| state.js | Central state, getters/setters, CustomEvents |
| file-loader.js | File import, drag & drop, file parsing |
| pdf-renderer.js | PDF.js thumbnails, canvas rendering |
| pdf-builder.js | Assemble final PDF from pages (pdf-lib) |
| pdf-actions.js | Extract, delete, rotate, merge |
| image-actions.js | Convert images to PDF pages |
| export-actions.js | PDF/PNG ZIP/JPG ZIP/TXT export |
| text-actions.js | Text extraction from textual PDFs |
| compression-actions.js | Visual compression (canvas recompress) |
| overlay-actions.js | Page numbers, watermark, stamps, header/footer (V1.5) |
| presets.js | Quick preset workflows (V1.5) |
| ui.js | DOM rendering, event handlers, status messages |
| utils.js | formatSize, downloadBlob, uniqueId, debounce |

## UX principles
- Compact layout: sidebar left / grid center / sidebar right.
- Workflow bar: Importer → Organiser → Modifier → Alléger → Exporter.
- Actions disabled (not hidden) when not available.
- Privacy banner always visible.
- States always visible.
- No gimmicks, no animations for their own sake.
- French microcopy. Short. Direct.

## Export naming convention
- `simplepdf_export.pdf`
- `simplepdf_selection.pdf`
- `simplepdf_compressed.pdf`
- `simplepdf_pages_png.zip`
- `simplepdf_pages_jpg.zip`
- `simplepdf_text.txt`

## Code patterns

### State update
```js
state.update({ isProcessing: true });
state.dispatch('processing:start');
```

### Download
```js
utils.downloadBlob(blob, 'simplepdf_export.pdf');
```

### Error
```js
state.addError('Impossible de lire ce fichier. Vérifiez qu'il n'est pas protégé par un mot de passe.');
```

### Status
```js
ui.setStatus('processing', 'Traitement en cours...');
ui.setStatus('done', 'Export terminé.');
```

## Delivery checklist
- [ ] index.html opens without console error.
- [ ] No server dependency.
- [ ] No tracker or analytics call.
- [ ] No user file in localStorage/IndexedDB.
- [ ] Main V1 actions tested (import, select, export PDF, export ZIP).
- [ ] Buttons disabled when action unavailable.
- [ ] Privacy banner visible.
- [ ] README updated.
- [ ] ROADMAP updated.
- [ ] CHANGELOG updated.
- [ ] GitHub Pages ready (no build required, vendor local).

## GitHub Pages checklist
- [ ] index.html at project root.
- [ ] All JS/CSS paths relative (no absolute server paths).
- [ ] PDF.js worker in /vendor/pdfjs/ (same origin, no CORS issue).
- [ ] No process.env or Node-specific code.
- [ ] No fetch() to external APIs during file processing.
