# Text to PDF
Minimal web app to convert text & Markdown into beautiful PDFs.
No signup.
No API.
Just clean conversion.

---

## Live Demo
https://text-to-pdf-one.vercel.app/

---

## Features
- Convert plain text → PDF instantly
- **Markdown support** (headings, bold, italic, lists, blockquotes, hr)
- Drag & drop **.txt / .md** files
- Upload file button (same formats)
- **Live preview** modal before download
- Custom **filename**
- Real-time **character / word / line** stats
- **3 page sizes** (A4, Letter, Legal)
- **Portrait / Landscape** orientation
- **Font family** (Sans / Serif / Mono)
- **Font size** (Small / Medium / Large)
- **3 PDF themes** (Light / Dark / Sepia)
- Optional **header text** on each page
- Toggle **Page numbers**
- Toggle **Line numbers** (great for code)
- Example text to test quickly
- No authentication
- No ads
- No watermarks

---

## Tech Stack
- React (Vite)
- jsPDF (PDF generation)
- Vanilla CSS (Apple-inspired UI)
- Vercel (static deploy)

---

## How It Works
1. Type/paste your text (Markdown supported) or drop a `.txt/.md`
2. Everything is processed fully in the browser
3. Tune settings (page size, orientation, font, theme, header, toggles)
4. Click **Preview** to see the PDF
5. Click **Download PDF** to save it

> Formatting and PDF generation happen client-side.

---

## Privacy
All processing happens **locally in your browser**.
No text is uploaded to a server.
Your content never leaves your device.

---

## Installation
```bash
# Clone the repo
git clone https://github.com/berkinyilmaz/text-to-pdf.git

# Install dependencies
cd text-to-pdf
npm install

# Run locally
npm run dev
