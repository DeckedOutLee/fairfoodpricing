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
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
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

/**
 * Build-time PDF CSS — uses Montserrat via Google Fonts.
 *
 * Privacy note: Google Fonts is fetched here by Chrome headless during build,
 * NOT by site visitors at runtime. The resulting PDF embeds the rasterised
 * font in the file itself. Visitors only download a static PDF — no third
 * party request from their browser.
 */
const PDF_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400&display=swap');

  @page { size: A4; margin: 22mm 20mm; }
  html, body { font-family: 'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 10.5pt; color: #0f172a; line-height: 1.5; letter-spacing: 0.005em; }
  h1, h2, h3, h4 { font-family: 'Montserrat', system-ui, sans-serif; color: #0f172a; letter-spacing: -0.018em; font-weight: 700; }
  h1 { font-size: 22pt; border-bottom: 2pt solid #1e40af; padding-bottom: 4pt; }
  h2 { font-size: 15pt; margin-top: 18pt; color: #1e40af; }
  h3 { font-size: 12pt; }
  a { color: #1e40af; text-decoration: underline; }
  p, li { text-align: left; }
  blockquote { border-left: 3pt solid #b45309; margin: 1em 0; padding-left: 12pt; color: #475569; font-style: italic; }
  code, pre { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 9pt; }
  hr { border: 0; border-top: 1pt solid #e5e7eb; margin: 1em 0; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; margin: 1em 0; }
  th, td { padding: 6pt 8pt; border-bottom: 0.5pt solid #e5e7eb; text-align: left; vertical-align: top; }
  th { font-weight: 700; }
  header.cover { margin-bottom: 14mm; border-bottom: 1pt solid #e5e7eb; padding-bottom: 6mm; }
  header.cover .brand { font-family: 'Montserrat', sans-serif; font-size: 10pt; color: #b45309; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  header.cover .title { font-family: 'Montserrat', sans-serif; font-size: 28pt; font-weight: 700; letter-spacing: -0.02em; margin-top: 6pt; }
  header.cover .date { font-size: 9pt; color: #64748b; margin-top: 6pt; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; }
`;

/**
 * Build a one-off pandoc reference.docx that uses Montserrat for every paragraph
 * style. Pandoc applies it via `--reference-doc=…` when emitting docx. Cached
 * for the duration of the script run.
 */
let cachedReferenceDocx = null;
function getMontserratReferenceDocx() {
  if (cachedReferenceDocx) return cachedReferenceDocx;
  if (!pandocAvailable) return null;

  const buildDir = join(tmpdir(), `ffp-ref-${Date.now()}`);
  mkdirSync(join(buildDir, 'unpacked'), { recursive: true });
  const defaultRef = join(buildDir, 'default-reference.docx');

  try {
    execSync(`pandoc --print-default-data-file reference.docx > "${defaultRef}"`, {
      shell: '/bin/bash',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    execSync(`unzip -qo "${defaultRef}" -d "${buildDir}/unpacked"`, { stdio: 'ignore' });

    const stylesXmlPath = join(buildDir, 'unpacked/word/styles.xml');
    if (exists(stylesXmlPath)) {
      let xml = readFileSync(stylesXmlPath, 'utf8');
      xml = xml
        .replace(/(w:ascii=)"[^"]+"/g, '$1"Montserrat"')
        .replace(/(w:hAnsi=)"[^"]+"/g, '$1"Montserrat"')
        .replace(/(w:cs=)"[^"]+"/g, '$1"Montserrat"')
        .replace(/(w:eastAsia=)"[^"]+"/g, '$1"Montserrat"')
        .replace(/(w:asciiTheme=)"[^"]+"/g, '$1"minorHAnsi"')
        .replace(/(w:hAnsiTheme=)"[^"]+"/g, '$1"minorHAnsi"')
        .replace(/(w:csTheme=)"[^"]+"/g, '$1"minorBidi"');
      writeFileSync(stylesXmlPath, xml);
    }

    const fontTablePath = join(buildDir, 'unpacked/word/fontTable.xml');
    if (exists(fontTablePath)) {
      let ft = readFileSync(fontTablePath, 'utf8');
      if (!ft.includes('w:name="Montserrat"')) {
        ft = ft.replace(
          '</w:fonts>',
          '<w:font w:name="Montserrat"><w:family w:val="auto"/><w:pitch w:val="variable"/></w:font></w:fonts>',
        );
        writeFileSync(fontTablePath, ft);
      }
    }

    const refOut = join(tmpdir(), `ffp-montserrat-ref-${process.pid}.docx`);
    execSync(`cd "${buildDir}/unpacked" && zip -qr "${refOut}" .`, { stdio: 'ignore' });
    cachedReferenceDocx = refOut;
    return refOut;
  } catch (err) {
    console.warn(`  ref  ✗ Montserrat reference.docx build failed: ${err.message}`);
    return null;
  } finally {
    try {
      rmSync(buildDir, { recursive: true, force: true });
    } catch {
      /* noop */
    }
  }
}

function renderDocxFromMd(mdPath, docxOut, title) {
  const refDoc = getMontserratReferenceDocx();
  const refArg = refDoc ? `--reference-doc="${refDoc}"` : '';
  execSync(
    `pandoc "${mdPath}" ${refArg} --metadata title="${title.replace(/"/g, '\\"')}" -o "${docxOut}"`,
    { stdio: 'ignore' },
  );
}

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

  // 2. Chrome headless → PDF. Generous virtual-time-budget so Google Fonts
  // (used at build time only) has time to load and rasterise before snapshot.
  execSync(
    `"${chromeBin}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfOut}" --print-to-pdf-no-header --virtual-time-budget=10000 "file://${tmpHtml}" 2>/dev/null`,
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

  const titleMap = {
    'evidence-briefing': 'Evidence Briefing',
    'draft-bill': 'Draft Bill',
    'letter-template': 'Letter to MP',
    'one-pager': 'One-Page Cross-Party Summary',
  };
  const title = titleMap[target] ?? target;

  // .docx — regenerate from markdown with Montserrat reference doc.
  // Falls back to copy if pandoc isn't available.
  if (pandocAvailable && exists(mdSrc)) {
    try {
      renderDocxFromMd(mdSrc, docxOut, title);
      copied++;
      console.log(`  docx → ${target}.docx  (Montserrat reference)`);
    } catch (err) {
      console.warn(`  docx ✗ ${target}.docx pandoc failed: ${err.message}`);
      if (exists(docxSrc)) {
        copyFileSync(docxSrc, docxOut);
        copied++;
        console.log(`  copy → ${target}.docx  (fallback from source)`);
      }
    }
  } else if (exists(docxSrc)) {
    copyFileSync(docxSrc, docxOut);
    copied++;
    console.log(`  copy → ${target}.docx`);
  } else {
    console.warn(`  miss → ${target}.docx`);
  }

  // .pdf — render via Chrome headless from pandoc HTML.
  if (pandocAvailable && chromeBin && exists(mdSrc)) {
    try {
      renderPdfFromMd(mdSrc, pdfOut, title);
      generated++;
      console.log(`  pdf  → ${target}.pdf  (Montserrat, chrome-headless)`);
    } catch (err) {
      console.warn(`  pdf  ✗ ${target}.pdf failed: ${err.message}`);
    }
  }
}

console.log(`\nPrepared ${copied} .docx and ${generated} .pdf into ${outDir}`);
