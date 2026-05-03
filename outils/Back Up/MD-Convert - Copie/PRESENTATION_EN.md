# MD Convert — Better inputs for AI and your second brain

**[Open the tool →](https://sebastien-riviere.github.io/outils/MD-Convert/)**

Free · Local · No account · No server · No tracking

---

## Why MD Convert exists

Everyone talks about prompts, AI agents, and automation.

But the real bottleneck is often much simpler:

**What are you actually feeding your AI and your second brain?**

PDFs, ebooks, smartphone captures, photographed book pages, Word documents, notes, YouTube transcripts, text copied from the web…

The information exists. It's everywhere.

But it's rarely in a clean, lightweight format that AI can actually use well.

That's exactly why I built MD Convert.

---

## What it does in practice

| Source | Output |
|---|---|
| PDF or ebook PDF | Structured Markdown, ready for AI |
| Word document | Clean file, no residual formatting noise |
| Smartphone capture | Usable text via OCR |
| Photographed page | Reusable note |
| YouTube link | Timestamped transcript |
| Web article (URL) | Clean imported text |
| Multiple sources | ZIP archive or merged file |

---

## Why AI inputs matter

In AI, the quality of the input often drives a large part of the quality of the output.

A raw PDF sent to Claude or ChatGPT is full of noise: metadata, formatting artifacts, wasted tokens.

A clean Markdown file means:
- fewer tokens consumed;
- a more readable context for the model;
- more precise answers.

MD Convert shows a side-by-side token estimate: **Markdown generated vs raw document**. The difference is often significant.

---

## How I use it daily

1. I find a source (PDF, capture, article, transcript).
2. I run it through MD Convert.
3. I send it to Obsidian, Claude, or NotebookLM to turn it into a note, a summary, or a project resource.

That's how I build my knowledge base without spending 20 minutes copy-pasting, renaming, sorting, and reformatting.

---

## Complete privacy

MD Convert runs in the browser, locally.

- **No account** — no sign-up required
- **No server** — no files uploaded
- **No tracking** — no analytics
- **Files stay on your device**

Exception: web article import via URL uses the Jina.ai service (internet connection required). For fully private use, copy-pasting text directly works just as well.

---

## Installable as an app

MD Convert is a PWA (Progressive Web App).

**iPhone / iPad**: Safari → Share → "Add to Home Screen"

**Android**: Chrome → menu → "Install"

Once installed, it works fully offline — including in airplane mode.

---

## Known limitations

- **Very large files**: local processing depends on browser RAM. Files under 50 MB recommended.
- **Scanned PDFs**: OCR quality depends on scan sharpness.
- **PPTX**: not yet supported — export as PDF from PowerPoint before importing.
- **Audio / video**: no audio transcription yet.
- **YouTube**: automatic import works when captions are available. Otherwise, paste the transcript manually.
- **Web pages**: some pages block automatic imports. Use copy-paste in that case.

---

## Open source

The code is available on GitHub.

Built for myself, shared for anyone who wants to work better with AI and their second brain — without piling on complexity.

[GitHub →](https://sebastien-riviere.github.io) · [LinkedIn →](https://www.linkedin.com/in/s%C3%A9bastien-riviere-conseil/)

---

*Sébastien Rivière — AI · Blockchain · Digital tools creator*
