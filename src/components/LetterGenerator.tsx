import { useEffect, useId, useMemo, useState } from 'react';
import { buildLetter, buildMailto, MAILTO_BODY_LIMIT } from '@/lib/letterTemplate';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

interface MPFromQuery {
  id?: string;
  name?: string;
  constituency?: string;
  email?: string;
  address?: string;
  party?: string;
}

function readQuery(): MPFromQuery {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get('mp') ?? undefined,
    name: params.get('name') ?? undefined,
    constituency: params.get('constituency') ?? undefined,
    email: params.get('email') ?? undefined,
    address: params.get('address') ?? undefined,
    party: params.get('party') ?? undefined,
  };
}

export default function LetterGenerator() {
  const visitorNameId = useId();
  const visitorTownId = useId();
  const visitorEmailId = useId();
  const personalNoteId = useId();
  const mpNameId = useId();
  const mpAddressId = useId();
  const mpEmailId = useId();

  const [mpFromQuery, setMpFromQuery] = useState<MPFromQuery>({});
  const [visitorName, setVisitorName] = useState('');
  const [visitorTown, setVisitorTown] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [mpName, setMpName] = useState('');
  const [mpAddress, setMpAddress] = useState('');
  const [mpEmail, setMpEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    const fromQuery = readQuery();
    setMpFromQuery(fromQuery);
    if (fromQuery.name) setMpName(fromQuery.name);
    if (fromQuery.address) setMpAddress(fromQuery.address);
    if (fromQuery.email) setMpEmail(fromQuery.email);
  }, []);

  const letter = useMemo(() => {
    if (!visitorName.trim() || !visitorTown.trim() || !mpName.trim()) return null;
    return buildLetter({
      mpName,
      mpAddress: mpAddress || undefined,
      visitorName,
      visitorTown,
      visitorEmail: visitorEmail || undefined,
      personalNote: personalNote || undefined,
    });
  }, [visitorName, visitorTown, visitorEmail, personalNote, mpName, mpAddress]);

  const mailto = useMemo(() => {
    if (!letter || !mpEmail.trim()) return null;
    return buildMailto(mpEmail.trim(), letter);
  }, [letter, mpEmail]);

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard() {
    if (!letter || !agreed) return;
    try {
      await navigator.clipboard.writeText(letter.body);
      setCopyStatus('copied');
    } catch {
      // Fallback for older browsers and non-secure contexts.
      const textarea = document.createElement('textarea');
      textarea.value = letter.body;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopyStatus('copied');
      } catch {
        setCopyStatus('failed');
      }
      document.body.removeChild(textarea);
    }
    setTimeout(() => setCopyStatus('idle'), 2500);
  }

  async function downloadAsDocx() {
    if (!letter || !agreed) return;
    const paragraphs = letter.body.split('\n').map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, font: 'Montserrat' })],
          spacing: { after: line === '' ? 120 : 60, line: 320 },
        }),
    );
    const doc = new Document({
      creator: 'Fair Food Pricing — fairfoodpricing.co.uk',
      title: `Letter to ${mpName}`,
      description: 'Constituent letter on AI-driven dynamic pricing of essential food.',
      styles: {
        default: {
          document: {
            run: { font: 'Montserrat', size: 22 }, // 11pt = 22 half-points
            paragraph: { spacing: { line: 320 } }, // ~1.4 line height
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1276, bottom: 1440, left: 1276 }, // ~25mm/22mm
            },
          },
          children: paragraphs,
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    triggerDownload(blob, letter.filename.replace(/\.txt$/, '.docx'));
  }

  function downloadAsPdf() {
    if (!letter || !agreed) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const marginLeft = 22;
    const marginRight = 22;
    const marginTop = 25;
    const marginBottom = 22;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const textWidth = pageWidth - marginLeft - marginRight;
    const fontSizePt = 11;
    const lineHeightMm = (fontSizePt * 1.4) / 2.83465; // 1pt = 0.3528mm

    doc.setProperties({
      title: `Letter to ${mpName}`,
      subject: 'Fair pricing of essential food in UK supermarkets',
      author: visitorName,
      creator: 'fairfoodpricing.co.uk',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSizePt);
    doc.setTextColor(15, 23, 42);

    const wrapped = doc.splitTextToSize(letter.body, textWidth);
    let y = marginTop;
    for (const line of wrapped) {
      if (y > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginLeft, y);
      y += lineHeightMm;
    }

    // Small footer note on the last page
    const footY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'Generated at fairfoodpricing.co.uk · ' +
        new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      marginLeft,
      footY,
    );

    doc.save(letter.filename.replace(/\.txt$/, '.pdf'));
  }

  const noQueryMp = !mpFromQuery.name;
  const showActions = letter && agreed;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <form className="border-rule bg-paper-elevated rounded-3xl border p-6 shadow-sm md:p-8">
        <h2 className="font-display text-h2 text-ink font-semibold">Your details</h2>
        <p className="text-muted mt-2 text-sm">
          Used only to fill in the letter. Nothing leaves your browser unless you choose to send.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <label htmlFor={visitorNameId} className="text-ink block text-sm font-semibold">
              Your full name
            </label>
            <input
              id={visitorNameId}
              name="visitor_name"
              type="text"
              autoComplete="name"
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="border-ink/20 bg-paper focus:border-primary focus:ring-primary/40 mt-1 w-full rounded-xl border px-4 py-2.5 focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor={visitorTownId} className="text-ink block text-sm font-semibold">
              Your town or constituency
            </label>
            <input
              id={visitorTownId}
              name="visitor_town"
              type="text"
              autoComplete="address-level2"
              required
              value={visitorTown}
              onChange={(e) => setVisitorTown(e.target.value)}
              className="border-ink/20 bg-paper focus:border-primary focus:ring-primary/40 mt-1 w-full rounded-xl border px-4 py-2.5 focus:ring-2 focus:outline-none"
            />
            {mpFromQuery.constituency && (
              <p className="text-muted mt-1 text-xs">
                Pre-filled from your postcode lookup. Edit if you prefer a town name.
              </p>
            )}
          </div>

          <div>
            <label htmlFor={visitorEmailId} className="text-ink block text-sm font-semibold">
              Your email <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id={visitorEmailId}
              name="visitor_email"
              type="email"
              autoComplete="email"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
              className="border-ink/20 bg-paper focus:border-primary focus:ring-primary/40 mt-1 w-full rounded-xl border px-4 py-2.5 focus:ring-2 focus:outline-none"
            />
            <p className="text-muted mt-1 text-xs">
              Appears at the top of the letter so your MP can reply. We don’t store it.
            </p>
          </div>

          <div>
            <label htmlFor={personalNoteId} className="text-ink block text-sm font-semibold">
              Personal note <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id={personalNoteId}
              name="personal_note"
              rows={4}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              maxLength={1200}
              placeholder="If you’d like, add why this matters to you — one or two paragraphs is plenty."
              className="border-ink/20 bg-paper focus:border-primary focus:ring-primary/40 mt-1 w-full rounded-xl border px-4 py-2.5 focus:ring-2 focus:outline-none"
            />
            <p className="text-muted mt-1 text-xs">
              {personalNote.length}/1200 characters. Personal notes are the part most likely to get
              read.
            </p>
          </div>
        </div>

        <h2 className="font-display text-h2 text-ink mt-8 font-semibold">MP details</h2>
        {noQueryMp && (
          <p className="text-muted mt-2 text-sm">
            No MP loaded from the postcode lookup. Fill these in manually, or{' '}
            <a href="/find-your-mp" className="text-primary">
              go back and use the lookup
            </a>
            .
          </p>
        )}

        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor={mpNameId} className="text-ink block text-sm font-semibold">
              MP full name (with honorific)
            </label>
            <input
              id={mpNameId}
              name="mp_name"
              type="text"
              required
              value={mpName}
              onChange={(e) => setMpName(e.target.value)}
              placeholder="Rt Hon Keir Starmer MP"
              className="border-ink/20 bg-paper focus:border-primary focus:ring-primary/40 mt-1 w-full rounded-xl border px-4 py-2.5 focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor={mpAddressId} className="text-ink block text-sm font-semibold">
              MP postal address
            </label>
            <input
              id={mpAddressId}
              name="mp_address"
              type="text"
              value={mpAddress}
              onChange={(e) => setMpAddress(e.target.value)}
              placeholder="House of Commons, London, SW1A 0AA"
              className="border-ink/20 bg-paper focus:border-primary focus:ring-primary/40 mt-1 w-full rounded-xl border px-4 py-2.5 focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor={mpEmailId} className="text-ink block text-sm font-semibold">
              MP email <span className="text-muted font-normal">(for the email mode)</span>
            </label>
            <input
              id={mpEmailId}
              name="mp_email"
              type="email"
              value={mpEmail}
              onChange={(e) => setMpEmail(e.target.value)}
              placeholder="firstname.surname.mp@parliament.uk"
              className="border-ink/20 bg-paper focus:border-primary focus:ring-primary/40 mt-1 w-full rounded-xl border px-4 py-2.5 focus:ring-2 focus:outline-none"
            />
          </div>
        </div>
      </form>

      <section className="flex flex-col gap-4">
        <div className="border-rule bg-paper-elevated flex-1 rounded-3xl border p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-h2 text-ink font-semibold">Preview</h2>
            {letter && (
              <span className="text-muted font-mono text-xs tracking-wider uppercase">
                {letter.body.length} chars
              </span>
            )}
          </div>
          <p className="text-muted mt-2 text-sm">
            What your MP will read. Edit your details on the left to see changes in real time.
          </p>
          <pre className="border-rule bg-paper text-ink/85 mt-5 max-h-[28rem] overflow-y-auto rounded-2xl border p-5 font-mono text-[0.85rem] leading-relaxed whitespace-pre-wrap">
            {letter
              ? letter.body
              : 'Fill in your name, your town, and your MP’s name to generate the letter.'}
          </pre>

          <label className="text-ink mt-5 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="border-ink/30 text-primary focus:ring-primary/40 mt-1 h-4 w-4 rounded"
            />
            <span>I have read the letter and I agree it should be sent in my name.</span>
          </label>

          <p className="text-muted mt-5 text-xs font-semibold tracking-wider uppercase">
            Choose how to send
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <a
              href={mailto?.href ?? '#'}
              aria-disabled={!showActions || !mailto}
              tabIndex={showActions && mailto ? 0 : -1}
              onClick={(e) => {
                if (!showActions || !mailto) e.preventDefault();
              }}
              className={`inline-flex flex-col items-start justify-center gap-1 rounded-2xl px-5 py-3 font-semibold no-underline transition-colors ${
                showActions && mailto
                  ? 'bg-primary text-paper hover:bg-primary-hover'
                  : 'bg-rule/40 text-muted cursor-not-allowed'
              }`}
            >
              <span className="text-base">Send by email →</span>
              <span className="text-xs font-normal opacity-90">
                Opens your email app with the letter pre-filled
              </span>
            </a>
            <button
              type="button"
              onClick={copyToClipboard}
              disabled={!showActions}
              className={`inline-flex flex-col items-start justify-center gap-1 rounded-2xl px-5 py-3 font-semibold transition-colors ${
                showActions
                  ? copyStatus === 'copied'
                    ? 'border-success bg-success/[0.08] text-ink border'
                    : 'border-ink/20 text-ink hover:border-ink/40 hover:bg-paper border'
                  : 'bg-rule/40 text-muted cursor-not-allowed border border-transparent'
              }`}
            >
              <span className="text-base">
                {copyStatus === 'copied'
                  ? '✓ Copied to clipboard'
                  : copyStatus === 'failed'
                    ? 'Copy failed — try again'
                    : 'Copy the full text'}
              </span>
              <span className="text-xs font-normal opacity-80">
                Paste into Gmail, Outlook, ProtonMail, anywhere
              </span>
            </button>
            <button
              type="button"
              onClick={downloadAsDocx}
              disabled={!showActions}
              className={`inline-flex flex-col items-start justify-center gap-1 rounded-2xl px-5 py-3 font-semibold transition-colors ${
                showActions
                  ? 'border-ink/20 text-ink hover:border-ink/40 hover:bg-paper border'
                  : 'bg-rule/40 text-muted cursor-not-allowed border border-transparent'
              }`}
            >
              <span className="text-base">Download as Word (.docx) ↓</span>
              <span className="text-xs font-normal opacity-80">
                Editable. Print and post, or attach to an email.
              </span>
            </button>
            <button
              type="button"
              onClick={downloadAsPdf}
              disabled={!showActions}
              className={`inline-flex flex-col items-start justify-center gap-1 rounded-2xl px-5 py-3 font-semibold transition-colors ${
                showActions
                  ? 'border-ink/20 text-ink hover:border-ink/40 hover:bg-paper border'
                  : 'bg-rule/40 text-muted cursor-not-allowed border border-transparent'
              }`}
            >
              <span className="text-base">Download as PDF ↓</span>
              <span className="text-xs font-normal opacity-80">
                Ready to print and post, or attach to an email.
              </span>
            </button>
          </div>

          {mailto?.truncated && (
            <p className="text-warning mt-3 text-xs">
              Some email apps (Apple Mail in particular) truncate long emails. If yours does, use
              <strong> Copy</strong> and paste into your inbox, or send the
              <strong> Word</strong> / <strong>PDF</strong> as an attachment instead. The cap is{' '}
              {MAILTO_BODY_LIMIT.toLocaleString()} characters.
            </p>
          )}

          {showActions && (
            <p className="text-muted mt-4 text-xs">
              Tip: keep a copy for your records. MPs reply more often than people expect.
            </p>
          )}
        </div>

        <aside className="border-rule bg-paper-elevated text-ink/85 rounded-3xl border p-6 text-sm md:p-8">
          <h3 className="font-display text-h3 text-ink font-semibold">If you’re posting it</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>A first-class stamp is £1.65 (Royal Mail, 2026).</li>
            <li>
              Find a postbox at{' '}
              <a
                href="https://www.royalmail.com/services-near-you"
                className="text-primary"
                rel="noopener noreferrer"
                target="_blank"
              >
                royalmail.com/services-near-you
              </a>
              .
            </li>
            <li>
              Letters posted to the House of Commons address are forwarded to the MP free of charge.
            </li>
          </ul>
        </aside>
      </section>
    </div>
  );
}
