import { useId, useState } from 'react';

type State = { kind: 'idle' } | { kind: 'invalid'; message: string } | { kind: 'stub-success' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailSignup() {
  const emailId = useId();
  const consentId = useId();
  const errorId = useId();
  const [email, setEmail] = useState('');
  const [consented, setConsented] = useState(false);
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setState({ kind: 'invalid', message: 'That doesn’t look like a valid email address.' });
      return;
    }
    if (!consented) {
      setState({ kind: 'invalid', message: 'You need to tick the consent box to subscribe.' });
      return;
    }
    // TODO: wire up the ESP once selected (Buttondown / ConvertKit / etc).
    // Until then, this is a no-op success state — no PII leaves the browser.
    console.info('[email-signup] would submit (ESP not yet configured):', { email: email.trim() });
    setState({ kind: 'stub-success' });
  }

  if (state.kind === 'stub-success') {
    return (
      <div
        role="status"
        className="border-success/30 bg-success/[0.06] text-ink rounded-2xl border p-5"
      >
        <p className="font-display text-h3 font-semibold">Thanks — we’ve noted your interest.</p>
        <p className="text-ink/85 mt-2 text-sm">
          The email service provider is being set up. When it’s live, the next person who hits this
          form will receive a confirmation email. We won’t add you retroactively without confirming
          consent again first.
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail('');
            setConsented(false);
            setState({ kind: 'idle' });
          }}
          className="text-primary mt-3 text-sm underline-offset-4 hover:underline"
        >
          Sign up another address
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="border-rule bg-paper rounded-2xl border p-5 md:p-6"
    >
      <fieldset className="space-y-4">
        <legend className="sr-only">Email updates</legend>
        <div>
          <label htmlFor={emailId} className="text-ink block text-sm font-semibold">
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state.kind === 'invalid') setState({ kind: 'idle' });
            }}
            aria-invalid={state.kind === 'invalid'}
            aria-describedby={state.kind === 'invalid' ? errorId : undefined}
            placeholder="you@example.co.uk"
            className="border-ink/20 bg-paper-elevated focus:border-primary focus:ring-primary/40 mt-1 w-full rounded-xl border px-4 py-2.5 focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="flex items-start gap-3 text-sm">
          <input
            id={consentId}
            name="consent"
            type="checkbox"
            checked={consented}
            onChange={(e) => {
              setConsented(e.target.checked);
              if (state.kind === 'invalid') setState({ kind: 'idle' });
            }}
            className="border-ink/30 text-primary focus:ring-primary/40 mt-1 h-4 w-4 rounded"
          />
          <label htmlFor={consentId} className="text-ink/85">
            I agree to receive occasional, low-volume email updates about the Fair Food Pricing
            campaign. I understand I can unsubscribe at any time and that my email address will be
            held by the data controller named in the
            <a href="/privacy" className="text-primary ml-1">
              privacy notice
            </a>
            .
          </label>
        </div>

        {state.kind === 'invalid' && (
          <p id={errorId} role="alert" className="text-warning text-sm">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          className="bg-primary text-paper hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          Subscribe
        </button>

        <p className="text-muted text-xs">
          Today this form does not submit anywhere — the email service provider is being chosen.
          Until then your address never leaves your browser.
        </p>
      </fieldset>
    </form>
  );
}
