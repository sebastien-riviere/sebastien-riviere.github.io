# MD Convert

Convert your files to Markdown, locally, with nothing to install.

PDF · DOCX · JPG · PNG · Smartphone captures → `.md` or `.txt` ready for Claude and Obsidian.

---

## Use it now

**[Open MD Convert →](https://sebastien-riviere.github.io/outils/MD-Convert/)**

No install. No account. Your files never leave your device.

---

## Supported formats

| Format | Type | Quality |
|---|---|---|
| PDF | Text-based (native) | Excellent |
| DOCX / DOC | Word | Very good |
| JPG / PNG / WEBP | Image + OCR | Good (depends on photo quality) |
| Smartphone capture | Camera OCR | Good (printed text) |
| TXT / MD | Plain text | Perfect |

---

## Features

- **100% local** — zero server upload, works offline
- **Built-in OCR** for images and photos (Tesseract.js)
- **Auto image preprocessing** before OCR
- **OCR confidence indicator** per file
- **Batch processing** — multiple files or entire folder
- **Single or ZIP export**
- **Preview before download**
- **Token counter** — shows estimated Claude tokens per file
- **Direct copy** — one click to clipboard, no preview needed
- **Editable filename** before export
- **Drag result** to any text editor
- **Global paste** — Ctrl+V anywhere converts text or image instantly
- **Dark / light mode**
- **Auto UI language** — French or English based on browser settings
- **OCR language** — FR, EN, FR+EN

## Install on home screen (PWA)

**iPhone / iPad**
1. Open the link in Safari
2. Share button → "Add to Home Screen"
3. The app appears as a native app

**Android**
1. Open the link in Chrome
2. "Add to Home Screen" banner or menu → Install
3. Works fully offline afterwards

---

## How offline works

On first load, all conversion libraries are cached by the browser. From the second launch onwards, the tool works entirely offline — including in airplane mode.

Exception: OCR language models (Tesseract) download once on first image use, then are also cached.

---

## Tech stack

Vanilla JS · PDF.js · Mammoth.js · Tesseract.js · JSZip · PWA (Service Worker)

Zero framework. Zero runtime dependency. Zero data sent.

---

## Known limits

- Scanned PDF (image inside PDF): OCR quality depends on scan sharpness
- PPTX: not supported in v1 — export to PDF from PowerPoint first
- Full folder selection: not available on Safari iOS (multiple files OK)
- Handwritten text: approximate results with Tesseract

---

## Author

Sébastien Rivière — AI · Blockchain · Digital tools

[LinkedIn](https://www.linkedin.com/in/s%C3%A9bastien-riviere-conseil/) · [GitHub](https://sebastien-riviere.github.io)

---

## License

MIT — free to use, modify and redistribute with attribution.
