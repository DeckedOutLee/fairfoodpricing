import { useEffect, useId, useRef, useState } from 'react';
import { findMPByPostcode, isValidPostcode, MPLookupError, type MP } from '@/lib/mpLookup';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; mp: MP; postcode: string }
  | { kind: 'error'; code: MPLookupError['code']; message: string };

function partyTone(party: string): string {
  const p = party.toLowerCase();
  if (p.includes('labour')) return 'bg-[#d40000]/10 text-[#a31010] border-[#d40000]/30';
  if (p.includes('conservative')) return 'bg-[#0087dc]/10 text-[#0a4d8c] border-[#0087dc]/30';
  if (p.includes('liberal democrat')) return 'bg-[#faa61a]/10 text-[#8a5500] border-[#faa61a]/30';
  if (p.includes('green')) return 'bg-[#6ab023]/10 text-[#2f5a16] border-[#6ab023]/30';
  if (p.includes('reform')) return 'bg-[#12b6cf]/10 text-[#085866] border-[#12b6cf]/30';
  if (p.includes('snp') || p.includes('national party'))
    return 'bg-[#fff95d]/30 text-[#5a4d00] border-[#cdb500]/40';
  if (p.includes('plaid')) return 'bg-[#005b54]/10 text-[#005b54] border-[#005b54]/30';
  if (p.includes('sinn')) return 'bg-[#326760]/10 text-[#326760] border-[#326760]/30';
  if (p.includes('dup')) return 'bg-[#d46a4c]/10 text-[#a13b1b] border-[#d46a4c]/30';
  return 'bg-rule/40 text-muted-strong border-rule';
}

export default function MPFinder() {
  const inputId = useId();
  const errorId = useId();
  const [postcode, setPostcode] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = postcode.trim();
    if (!trimmed) {
      setStatus({
        kind: 'error',
        code: 'INVALID_POSTCODE',
        message: 'Enter your postcode to continue.',
      });
      return;
    }
    if (!isValidPostcode(trimmed)) {
      setStatus({
        kind: 'error',
        code: 'INVALID_POSTCODE',
        message: 'That doesn’t look like a UK postcode. Check the spaces and letters.',
      });
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus({ kind: 'loading' });

    try {
      const mp = await findMPByPostcode(trimmed, { signal: ctrl.signal });
      setStatus({ kind: 'success', mp, postcode: trimmed });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const error =
        err instanceof MPLookupError ? err : new MPLookupError('UNKNOWN', 'Something went wrong');
      const messages: Record<MPLookupError['code'], string> = {
        INVALID_POSTCODE: 'That doesn’t look like a UK postcode. Check the spaces and letters.',
        POSTCODE_NOT_FOUND:
          'We couldn’t find that postcode. Double-check it, or look up your MP manually below.',
        NO_MP_FOUND:
          'No sitting MP for that constituency right now. Try again later, or use the manual link below.',
        NETWORK:
          'We couldn’t reach the Parliament service. Try again, or use the manual link below.',
        UNKNOWN: 'Something went wrong on our side. Try again, or use the manual link below.',
      };
      setStatus({ kind: 'error', code: error.code, message: messages[error.code] });
    }
  }

  function reset() {
    abortRef.current?.abort();
    setPostcode('');
    setStatus({ kind: 'idle' });
  }

  const writeHref = (mp: MP) =>
    `/send-a-letter?mp=${mp.id}&name=${encodeURIComponent(mp.fullTitle)}&constituency=${encodeURIComponent(mp.constituency)}&email=${encodeURIComponent(mp.email ?? '')}&address=${encodeURIComponent(mp.address)}&party=${encodeURIComponent(mp.party)}`;

  return (
    <div className="border-rule bg-paper-elevated rounded-3xl border p-6 shadow-sm md:p-8">
      <form onSubmit={submit} noValidate>
        <label htmlFor={inputId} className="font-display text-h3 text-ink block font-semibold">
          Enter your UK postcode
        </label>
        <p className="text-muted mt-1 text-sm">
          We send the postcode to{' '}
          <a
            href="https://postcodes.io"
            className="text-primary"
            rel="noopener noreferrer"
            target="_blank"
          >
            postcodes.io
          </a>{' '}
          to look up your constituency. Nothing is stored.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            id={inputId}
            name="postcode"
            type="text"
            inputMode="text"
            autoComplete="postal-code"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="e.g. SW1A 1AA"
            value={postcode}
            onChange={(e) => {
              setPostcode(e.target.value);
              if (status.kind === 'error') setStatus({ kind: 'idle' });
            }}
            aria-invalid={status.kind === 'error'}
            aria-describedby={status.kind === 'error' ? errorId : undefined}
            disabled={status.kind === 'loading'}
            className="border-ink/20 bg-paper text-ink focus:border-primary focus:ring-primary/40 flex-1 rounded-xl border px-4 py-3 font-mono text-lg tracking-widest focus:ring-2 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status.kind === 'loading'}
            className="bg-primary text-paper hover:bg-primary-hover rounded-xl px-6 py-3 text-base font-semibold disabled:opacity-60"
          >
            {status.kind === 'loading' ? 'Looking up…' : 'Find my MP'}
          </button>
        </div>

        {status.kind === 'error' && (
          <p id={errorId} role="alert" className="text-warning mt-3 flex items-start gap-2 text-sm">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
              className="mt-0.5 shrink-0"
            >
              <path
                d="M8 1L0 15h16L8 1zm0 5v4M8 12.5h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span>{status.message}</span>
          </p>
        )}
      </form>

      <div aria-live="polite" aria-atomic="true" className="mt-6">
        {status.kind === 'loading' && <p className="text-muted text-sm">Looking up your MP…</p>}

        {status.kind === 'success' && (
          <article className="border-rule bg-paper rounded-2xl border p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-5">
              {status.mp.photoUrl && (
                <img
                  src={status.mp.photoUrl}
                  alt={`Official portrait of ${status.mp.name}, MP for ${status.mp.constituency}`}
                  loading="lazy"
                  width={96}
                  height={120}
                  className="h-32 w-24 rounded-lg object-cover shadow-sm"
                />
              )}
              <div className="mt-3 flex-1 sm:mt-0">
                <p className="text-muted text-xs font-semibold tracking-wide uppercase">Your MP</p>
                <h3 className="font-display text-h2 text-ink mt-1 font-semibold">
                  {status.mp.fullTitle}
                </h3>
                <p className="text-ink/80 mt-1">
                  MP for <strong>{status.mp.constituency}</strong>
                </p>
                <p
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${partyTone(status.mp.party)}`}
                >
                  {status.mp.party}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={writeHref(status.mp)}
                className="bg-primary text-paper hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold no-underline"
              >
                Write to {status.mp.name.split(' ').slice(-1)[0]} →
              </a>
              <a
                href={status.mp.theyWorkForYouUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="border-ink/20 text-ink hover:border-ink/40 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold no-underline"
              >
                See {status.mp.name.split(' ').slice(-1)[0]}’s record on TheyWorkForYou →
              </a>
              <button
                type="button"
                onClick={reset}
                className="text-muted hover:text-ink rounded-full px-4 py-2 text-sm"
              >
                Wrong MP? Try again
              </button>
            </div>

            {status.mp.email && (
              <p className="text-muted mt-4 text-xs">
                Parliamentary email on file: <span className="font-mono">{status.mp.email}</span>
              </p>
            )}
          </article>
        )}

        {status.kind === 'error' &&
          (status.code === 'POSTCODE_NOT_FOUND' || status.code === 'NETWORK') && (
            <p className="text-muted mt-4 text-sm">
              Can’t find your MP? Look them up manually at{' '}
              <a
                className="text-primary"
                href="https://members.parliament.uk/FindYourMP"
                rel="noopener noreferrer"
                target="_blank"
              >
                members.parliament.uk
              </a>
              .
            </p>
          )}
      </div>
    </div>
  );
}
