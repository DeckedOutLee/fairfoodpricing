#!/usr/bin/env node
/**
 * prepare-downloads.mjs
 *
 * Copies the canonical Word source documents from the Dropbox-prepared
 * "Dynamic Food Pricing/" workspace into public/downloads/ and renders
 * matching PDFs with pandoc. Idempotent. Safe to run on every build.
 *
 * Usage: npm run prepare-downloads
 */
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = join(repoRoot, 'public/downloads');
const srcDir = resolve(repoRoot, '../Dynamic Food Pricing');

const docs = [
  { src: '01_Evidence_Briefing', target: 'evidence-briefing' },
  { src: '02_Draft_Bill', target: 'draft-bill' },
  { src: '03_Letter_to_MP', target: 'letter-template' },
  { src: '04_One_Page_Cross_Party_Summary', target: 'one-pager' },
];

mkdirSync(outDir, { recursive: true });

function exists(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

function hasPandoc() {
  try {
    execSync('pandoc --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function findChrome() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  for (const c of candidates) {
    if (exists(c)) return c;
  }
  try {
    return execSync('command -v google-chrome', { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

const pandocAvailable = hasPandoc();
const chromeBin = findChrome();
if (!pandocAvailable) {
  console.warn('⚠ pandoc not found — PDFs will not be generated. .docx will still be copied.');
}
if (pandocAvailable && !chromeBin) {
  console.warn('⚠ Chrome/Chromium not found — PDFs will not be generated via the chrome fallback.');
}

const PDF_CSS = `
  @page { size: A4; margin: 22mm 20mm; }
  html, body { font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif; font-size: 11pt; color: #0f172a; line-height: 1.5; }
  h1, h2, h3, h4 { font-family: 'Source Serif 4', Georgia, serif; color: #0f172a; }
  h1 { font-size: 22pt; border-bottom: 2pt solid #1e40af; padding-bottom: 4pt; }
  h2 { font-size: 16pt; margin-top: 18pt; color: #1e40af; }
  h3 { font-size: 13pt; }
  a { color: #1e40af; text-decoration: underline; }
  p, li { text-align: justify; }
  blockquote { border-left: 3pt solid #b45309; margin: 1em 0; padding-left: 12pt; color: #475569; font-style: italic; }
  code, pre { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 9.5pt; }
  hr { border: 0; border-top: 1pt solid #e5e7eb; margin: 1em 0; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; margin: 1em 0; }
  th, td { padding: 6pt 8pt; border-bottom: 0.5pt solid #e5e7eb; text-align: left; vertical-align: top; }
  th { font-weight: 600; }
  header.cover { margin-bottom: 14mm; border-bottom: 1pt solid #e5e7eb; padding-bottom: 6mm; }
  header.cover .brand { font-family: 'Source Serif 4', Georgia, serif; font-size: 11pt; color: #b45309; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  header.cover .title { font-family: 'Source Serif 4', Georgia, serif; font-size: 28pt; font-weight: 600; margin-top: 6pt; }
  header.cover .date { font-size: 9pt; color: #64748b; margin-top: 6pt; font-family: ui-monospace, Menlo, monospace; }
`;

function renderPdfFromMd(mdPath, pdfOut, title) {
  // 1. pandoc → standalone HTML in a temp file
  const tmpHtml = join(tmpdir(), `ffp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.html`);
  const standaloneCss = join(tmpdir(), `ffp-${Date.now()}.css`);
  writeFileSync(standaloneCss, PDF_CSS);
  try {
    execSync(
      `pandoc "${mdPath}" --standalone --metadata title="${title.replace(/"/g, '\\"')}" --metadata pagetitle="${title.replace(/"/g, '\\"')}" --css "${standaloneCss}" --embed-resources --include-before-body=/dev/stdin -o "${tmpHtml}"`,
      {
        input: `<header class="cover"><div class="brand">Fair Food Pricing · fairfoodpricing.co.uk</div><div class="title">${title}</div><div class="date">Generated ${new Date().toISOString().slice(0, 10)}</div></header>`,
        stdio: ['pipe', 'ignore', 'ignore'],
      },
    );
  } finally {
    try {
      unlinkSync(standaloneCss);
    } catch {
      /* noop */
    }
  }

  // 2. Chrome headless → PDF
  execSync(
    `"${chromeBin}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfOut}" --print-to-pdf-no-header --virtual-time-budget=3000 "file://${tmpHtml}" 2>/dev/null`,
    { stdio: 'ignore' },
  );
  try {
    unlinkSync(tmpHtml);
  } catch {
    /* noop */
  }
}

let copied = 0;
let generated = 0;

for (const { src, target } of docs) {
  const docxSrc = join(srcDir, `${src}.docx`);
  const mdSrc = join(srcDir, `${src}.md`);
  const docxOut = join(outDir, `${target}.docx`);
  const pdfOut = join(outDir, `${target}.pdf`);

  if (exists(docxSrc)) {
    copyFileSync(docxSrc, docxOut);
    copied++;
    console.log(`  copy → ${target}.docx`);
  } else {
    console.warn(`  miss → ${docxSrc}`);
  }

  if (pandocAvailable && chromeBin && exists(mdSrc)) {
    const titleMap = {
      'evidence-briefing': 'Evidence Briefing',
      'draft-bill': 'Draft Bill',
      'letter-template': 'Letter to MP',
      'one-pager': 'One-Page Cross-Party Summary',
    };
    try {
      renderPdfFromMd(mdSrc, pdfOut, titleMap[target] ?? target);
      generated++;
      console.log(`  pdf  → ${target}.pdf  (engine: chrome-headless)`);
    } catch (err) {
      console.warn(`  pdf  ✗ ${target}.pdf failed: ${err.message}`);
    }
  }
}

console.log(`\nPrepared ${copied} .docx and ${generated} .pdf into ${outDir}`);
