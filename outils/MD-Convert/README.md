# MD Convert

Convert your files to Markdown, locally, with nothing to install.

PDF · DOCX · JPG · PNG · Captures → `.md` or `.txt` ready for Claude and Obsidian.

---

## Usage

**[Open MD Convert →](https://sebastien-riviere.github.io/md-convert)**

No installation. No account. Your files never leave your device.

---

## Supported formats

| Format | Type | Quality |
|---|---|---|
| PDF | Text-based (native) | Excellent |
| DOCX / DOC | Word | Very good |
| JPG / PNG / WEBP | Image + OCR | Good (depends on photo quality) |
| Smartphone capture | Camera OCR | Good (sharp printed text) |
| TXT / MD | Plain text | Perfect |

---

## Features

- Local and offline conversion — zero server upload
- Built-in OCR for images and photos (Tesseract.js)
- Automatic image preprocessing before OCR
- OCR confidence indicator per file
- Batch processing — multiple files or entire folder
- Individual export or global ZIP
- Preview before download
- Dark / light mode
- OCR language: FR, EN, FR+EN
- YouTube transcript extraction
- Web article, Google Doc & GitHub file import

## Install on home screen (PWA)

**iPhone / iPad**
1. Open the link in Safari
2. Share button → "Add to Home Screen"
3. The app appears as a native app

**Android**
1. Open the link in Chrome
2. "Add to Home Screen" banner or menu → Install
3. Works offline afterwards

---

## Offline support

On first load, conversion libraries are cached by the browser. From the second launch onwards, the tool works entirely offline — including in airplane mode.

Exception: OCR language models (Tesseract) are downloaded once on first image use, then also cached.

---

## Tech stack

Vanilla JS · PDF.js · Mammoth.js · Tesseract.js · JSZip · PWA (Service Worker)

Zero framework. Zero runtime dependency. Zero data sent.

---

```
├── index.html          Full application (libs bundled inline)
├── manifest.json       PWA configuration
├── sw.js               Offline service worker
├── icon-192.png        App icon
├── icon-512.png        High-resolution app icon
└── README.md           This file
```

---

## Known limitations

- Scanned PDF (image inside PDF): OCR quality varies with scan sharpness
- PPTX: not supported in v1 — export as PDF from PowerPoint before importing
- Full folder selection: not available on Safari iOS (multiple files OK)
- Handwritten text: approximate results with Tesseract

---

## Author

Sébastien Rivière — AI · Blockchain · Digital tools creator

[LinkedIn](https://www.linkedin.com/in/s%C3%A9bastien-riviere-conseil/) · [GitHub](https://sebastien-riviere.github.io)

---

## License

MIT — free to use, modify, and redistribute with attribution.
