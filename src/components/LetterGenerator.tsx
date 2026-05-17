import { useEffect, useId, useMemo, useState } from 'react';
import { buildLetter, buildMailto, MAILTO_BODY_LIMIT } from '@/lib/letterTemplate';

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

  function downloadAsText() {
    if (!letter || !agreed) return;
    const blob = new Blob([letter.body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = letter.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadAsPdf() {
    if (!letter || !agreed) return;
    const printable = window.open('', '_blank', 'noopener,noreferrer');
    if (!printable) {
      // Popup blocked — fall back to a text download.
      downloadAsText();
      return;
    }
    const escaped = letter.body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    printable.document.write(`<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <title>${letter.filename}</title>
    <style>
      @page { size: A4; margin: 25mm 22mm; }
      html, body { background: #fff; color: #000; font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; }
      pre { white-space: pre-wrap; word-wrap: break-word; font-family: Georgia, 'Times New Roman', serif; }
      .header { font-size: 9pt; color: #555; margin-bottom: 10mm; }
      @media screen { body { max-width: 18cm; margin: 2rem auto; padding: 0 1rem; } }
      @media print { .no-print { display: none !important; } }
    </style>
  </head>
  <body>
    <p class="header no-print">Print this page (Ctrl/Cmd-P) and choose “Save as PDF” to keep a copy.</p>
    <pre>${escaped}</pre>
    ${'<script>setTimeout(() => window.print(), 250);</script>'}
  </body>
</html>`);
    printable.document.close();
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

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              href={mailto?.href ?? '#'}
              aria-disabled={!showActions || !mailto}
              tabIndex={showActions && mailto ? 0 : -1}
              onClick={(e) => {
                if (!showActions || !mailto) e.preventDefault();
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold no-underline transition-colors ${
                showActions && mailto
                  ? 'bg-primary text-paper hover:bg-primary-hover'
                  : 'bg-rule/40 text-muted cursor-not-allowed'
              }`}
            >
              Send by email
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
            <button
              type="button"
              onClick={downloadAsPdf}
              disabled={!showActions}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold transition-colors ${
                showActions
                  ? 'border-ink/20 text-ink hover:border-ink/40 hover:bg-paper border'
                  : 'bg-rule/40 text-muted cursor-not-allowed'
              }`}
            >
              Print or save as PDF
            </button>
          </div>

          {mailto?.truncated && (
            <p className="text-warning mt-3 text-xs">
              Your mail client may truncate long emails — we’ll cap at{' '}
              {MAILTO_BODY_LIMIT.toLocaleString()} characters. If yours does, use “Print or save as
              PDF” and attach the full text.
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
