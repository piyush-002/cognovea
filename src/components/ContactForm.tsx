'use client';

import { useState } from 'react';
import { submitEnquiry } from '@/actions/enquiry';
import { site } from '@/lib/site';

/**
 * Submissions are saved to the `enquiries` collection and read in the admin.
 *
 * This used to open the visitor's mail client, because the site was a static
 * export with nowhere to POST. That is no longer true, and mailto was always a
 * poor deal: it depends on the visitor having a configured mail client, it
 * exposes the enquiry to whatever they do next, and anyone on webmail simply
 * loses the form. Now nothing depends on the sender's machine. The enquiry is
 * in the database before they see a confirmation.
 */

const COMPANY_SIZES = ['1–20', '21–100', '101–500', '501–2,000', '2,000+'];

const INDUSTRIES = [
  'SaaS & Technology',
  'Financial Services',
  'Retail & Consumer',
  'Manufacturing',
  'Logistics',
  'Healthcare',
  'Education',
  'Professional Services',
  'Energy & Industrial',
  'Other',
];

type Errors = Partial<Record<'fullName' | 'workEmail' | 'companyName', string>>;

export default function ContactForm({ intent = '' }: { intent?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const next: Errors = {};
    if (!data.fullName?.trim()) next.fullName = 'Please enter your full name.';
    if (!data.workEmail?.trim()) next.workEmail = 'Please enter your work email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.workEmail)) next.workEmail = 'That email address looks incomplete.';
    if (!data.companyName?.trim()) next.companyName = 'Please enter your company name.';

    setErrors(next);
    if (Object.keys(next).length > 0) {
      form.querySelector<HTMLElement>('.is-error input')?.focus();
      return;
    }

    try {
      setState('sending');
      // Pass the FormData through untouched. The action re-validates and
      // sanitises server-side. The checks above are for the person filling
      // the form in, not a security boundary.
      const result = await submitEnquiry(new FormData(form));
      if (!result.ok) {
        setServerError(result.error);
        setState('error');
        return;
      }
      form.reset();
      setState('sent');
    } catch {
      setServerError('');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className="form__done">
        <p className="h-md" style={{ color: 'var(--fg)' }}>
          Thank you. Your enquiry is on its way.
        </p>
        <p style={{ marginTop: '0.7rem' }}>We&rsquo;ll get back to you within one business day.</p>
      </div>
    );
  }

  const cls = (k: keyof Errors) => `field${errors[k] ? ' is-error' : ''}`;

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <input type="hidden" name="intent" value={intent} />

      {/* Honeypot. Hidden from people and from screen readers, but a bot filling
          every field will complete it, and the action then silently discards
          the submission. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form__row">
        <div className={cls('fullName')}>
          <label htmlFor="fullName">
            Full Name <span className="req">*</span>
          </label>
          <input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Enter your full name" />
          {errors.fullName && <span className="field__err">{errors.fullName}</span>}
        </div>

        <div className={cls('workEmail')}>
          <label htmlFor="workEmail">
            Work Email <span className="req">*</span>
          </label>
          <input
            id="workEmail"
            name="workEmail"
            type="email"
            autoComplete="email"
            placeholder="Enter your work email address"
          />
          {errors.workEmail && <span className="field__err">{errors.workEmail}</span>}
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="phone">Phone Number</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="Enter your phone number" />
        </div>

        <div className={cls('companyName')}>
          <label htmlFor="companyName">
            Company Name <span className="req">*</span>
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            autoComplete="organization"
            placeholder="Enter your company name"
          />
          {errors.companyName && <span className="field__err">{errors.companyName}</span>}
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="companySize">Company Size</label>
          <select id="companySize" name="companySize" defaultValue="">
            <option value="" disabled>
              Select your company size
            </option>
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="industry">Industry</label>
          <select id="industry" name="industry" defaultValue="">
            <option value="" disabled>
              Select your industry
            </option>
            {INDUSTRIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="hardestNumber">Which business number is hardest to trust today?</label>
        <input id="hardestNumber" name="hardestNumber" type="text" placeholder="Revenue, margin, inventory…" />
        <small>
          For example, revenue, margin, inventory, customer churn, forecast accuracy, or another metric that matters to
          your team.
        </small>
      </div>

      <div className="field">
        <label htmlFor="goal">Tell us a little about what you are trying to achieve.</label>
        <textarea
          id="goal"
          name="goal"
          placeholder="Share any relevant details about your data, analytics, reporting, or AI requirements."
        />
      </div>

      {state === 'error' && (
        <p className="field__err">
          {serverError || 'Something went wrong sending that.'} Please try again, or email{' '}
          <a href={`mailto:${site.email}`}>{site.email}</a> instead.
        </p>
      )}

      <div className="btn-row" style={{ marginTop: '0.5rem' }}>
        <button className="btn btn--primary" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send Your Inquiry'}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M2 8h12M9 3l5 5-5 5" />
          </svg>
        </button>
      </div>

      <p className="form__note">We&rsquo;ll get back to you within one business day.</p>
    </form>
  );
}
