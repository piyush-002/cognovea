'use client';

import { useState } from 'react';
import { submitToolLead } from '@/actions/tool-lead';

/**
 * The one gated thing on this page.
 *
 * The calculator answers first and asks nothing; only the take-away document
 * costs an email address. That order is the whole point — a tool that demands
 * an address before showing a number does not get listed in a "free tools"
 * roundup, and those listings are why this page exists.
 *
 * One field. Every extra box costs downloads, and the numbers the visitor
 * already gave the calculator are captured with the lead, which is worth more
 * than a name typed to get past a form.
 *
 * The summary opens in a new tab whether or not the save succeeded. Somebody
 * who handed over their address has done their part; making them watch an
 * error because our database was busy would be charging them for our problem.
 */
export default function PdfGate({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const summaryUrl = `/tools/bi-automation-calculator/summary/?${query}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    form.set('inputs', query);

    const result = await submitToolLead(form);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDone(true);
    window.open(summaryUrl, '_blank', 'noopener');
  }

  if (done) {
    return (
      <div className="gate gate--done">
        <p className="gate__lead">
          Opening your summary in a new tab. Use your browser&rsquo;s print dialog to save it as a PDF.
        </p>
        <p className="gate__note">
          If it did not open, your browser blocked the pop-up —{' '}
          <a href={summaryUrl} target="_blank" rel="noopener noreferrer">
            open it here
          </a>
          .
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="gate">
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(true)}>
          Get the one-page summary
        </button>
        <p className="gate__note">
          A single A4 page with your figures, the breakdown and every assumption. We ask for an email address for this
          one thing; the calculator itself stays open.
        </p>
      </div>
    );
  }

  return (
    <form className="gate gate--form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="gate-email">Where should we send you to it?</label>
        <input
          id="gate-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error ? <span className="field__err">{error}</span> : null}
      </div>

      {/* Honeypot, matching the enquiry form. Hidden from people, not from bots. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="gate-website">Website</label>
        <input id="gate-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="gate__actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'One moment' : 'Open the summary'}
        </button>
        <button type="button" className="gate__cancel" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>

      <p className="gate__note">
        One address, for this document. It goes to our admin, not to a mailing list, and nothing is sent to you
        automatically.
      </p>
    </form>
  );
}
