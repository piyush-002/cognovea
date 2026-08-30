import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import { site } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

const PATH = '/privacy-policy';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy | Cognovea',
  description:
    'How Cognovea collects, uses, stores and protects personal information submitted through cognovea.com, and the rights available to you over that information.',
  path: '/privacy-policy',
});

const CRUMBS = [{ href: PATH, label: 'Privacy Policy' }];

const EFFECTIVE = '26 August 2026';

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(CRUMBS)} />

      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        crumbs={CRUMBS}
        compact
        intro={`Effective ${EFFECTIVE}. This policy explains what personal information Cognovea collects through this website, why we collect it, how long we keep it, and the choices available to you.`}
      />

      <section className="band">
        <div className="wrap">
          {/*
            NOTE FOR COGNOVEA: this is a working draft written to match how the site
            actually behaves (an enquiry form, no advertising trackers). It is not
            legal advice. Have counsel review it against the DPDP Act 2023, the GDPR
            where you handle EU personal data, and your client contracts before launch.
            Fill in the bracketed items and the grievance officer details.
          */}
          <div className="rich measure rv">
            <h2 className="h-md">Who we are</h2>
            <p>
              Cognovea (&ldquo;Cognovea&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a data analytics, data
              engineering and AI services company. This policy applies to {site.url} and to enquiries you send us
              through it. It does not cover the data we process on behalf of clients under a services agreement. That
              processing is governed by the contract and data processing terms agreed with each client, where Cognovea
              acts as a processor and the client remains the controller.
            </p>

            <h2 className="h-md">Information we collect</h2>
            <p>We collect only what you give us and what your browser sends automatically.</p>
            <h3>Information you provide</h3>
            <ul>
              <li>
                <strong>Enquiry and Data Health Check forms:</strong> full name, work email address, phone number
                (optional), company name, company size, industry, and the details you write about your data, analytics,
                reporting or AI requirements.
              </li>
              <li>
                <strong>Email and telephone contact:</strong> anything you choose to include when you write to{' '}
                <a href={`mailto:${site.email}`}>{site.email}</a> or call one of our numbers.
              </li>
              <li>
                <strong>Job applications:</strong> the CV, profile and supporting information you send when applying for
                a role.
              </li>
            </ul>

            <h3>Information collected automatically</h3>
            <ul>
              <li>
                <strong>Technical data:</strong> IP address, browser type and version, device type, referring page and
                pages viewed. This is standard web-server and analytics data used to keep the site secure and to
                understand which pages are useful.
              </li>
              <li>
                <strong>Fonts:</strong> this site loads typefaces from Google Fonts, which means your IP address is
                visible to Google when a page loads. No cookies are set by that request.
              </li>
            </ul>
            <p>
              We do not knowingly collect sensitive personal data through this website, and we ask that you do not
              include confidential client data, credentials, or personal data about third parties in an enquiry form.
            </p>

            <h2 className="h-md">Why we use it</h2>
            <ul>
              <li>To respond to your enquiry, usually within one business day.</li>
              <li>To scope, quote and deliver services such as a Data Health Check or a consulting engagement.</li>
              <li>To assess applications for open roles.</li>
              <li>To operate, secure and improve this website.</li>
              <li>To meet legal, accounting and regulatory obligations.</li>
            </ul>
            <p>
              Where the GDPR applies, our lawful bases are: performance of a contract or steps taken at your request
              before entering one; our legitimate interest in responding to business enquiries and running our website
              securely; your consent where we ask for it; and compliance with legal obligations. Where the DPDP Act 2023
              applies, we process personal data for the lawful purpose for which you have provided it.
            </p>

            <h2 className="h-md">Marketing</h2>
            <p>
              We do not sell your information, and we do not share it with advertisers. If we send you occasional
              updates about our work, every message includes an unsubscribe link, and you can opt out at any time by
              writing to <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>

            <h2 className="h-md">Cookies and analytics</h2>
            <p>
              This website does not set advertising or cross-site tracking cookies, and we do not
              sell or share any of this information.
            </p>
            <p>
              We use Google Analytics 4 to understand how the site is used: which pages people read,
              and how quickly those pages load. Google Analytics sets cookies in your browser, and{' '}
              <strong>we only load it if you agree</strong>. When you first visit, a short notice
              asks whether you accept. Nothing is loaded and no cookie is set unless you choose
              Accept, and if you decline, the site works exactly the same way.
            </p>
            <p>
              You can change your mind at any time using the <strong>Cookie settings</strong> link at
              the bottom of any page. Declining after having accepted also deletes the analytics
              cookies already stored in your browser.
            </p>

            <h3>Exactly what is stored</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Set by</th>
                    <th>Purpose</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>_ga</code>
                    </td>
                    <td>Google Analytics</td>
                    <td>Distinguishes one visitor from another. Only set if you accept.</td>
                    <td>2 years</td>
                  </tr>
                  <tr>
                    <td>
                      <code>_ga_VGN7HXWX4V</code>
                    </td>
                    <td>Google Analytics</td>
                    <td>Keeps track of a single visit. Only set if you accept.</td>
                    <td>2 years</td>
                  </tr>
                  <tr>
                    <td>
                      <code>cognovea.consent.v1</code>
                    </td>
                    <td>Cognovea</td>
                    <td>
                      Remembers whether you accepted or declined, so you are not asked again. Stored
                      in your browser&rsquo;s local storage rather than a cookie, and never sent to
                      us. Set whichever way you answer, including when you decline.
                    </td>
                    <td>Until you clear it</td>
                  </tr>
                  <tr>
                    <td>
                      <code>payload-token</code>
                    </td>
                    <td>Cognovea</td>
                    <td>
                      Keeps a Cognovea administrator signed in to the content system. Only ever set
                      after a member of our team logs in, never for visitors. It cannot be read by
                      JavaScript.
                    </td>
                    <td>7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Where analytics run with your consent, Google acts as our processor. Your IP address is
              truncated before storage, and we do not enable Google&rsquo;s advertising or
              personalisation features. Alongside page views we collect anonymous page-speed
              measurements so we can find and fix slow pages.
              {/* TODO for legal review: confirm the GA4 data-retention window set in the Google
                  Analytics property. The default is 2 months and the maximum is 14; the cookie
                  lifetime above is separate and is also configurable in the GA4 admin. */}
            </p>

            <h2 className="h-md">Who we share it with</h2>
            <p>
              We share personal information only with service providers who help us operate, and only as far as they
              need it: our website host, our database provider, our email provider, and the applicant-tracking or CRM
              tools we use. Enquiries submitted through the form on this website are stored in our own database rather
              than passed to a third-party form service.
              Each is bound by confidentiality and data-protection obligations. We may also disclose information where
              required by law, or in connection with a merger or acquisition, in which case you will be notified.
              {/* TODO: name the actual sub-processors once hosting, email and CRM are chosen. */}
            </p>

            <h2 className="h-md">International transfers</h2>
            <p>
              Cognovea operates from India, with a head office in Bengaluru and a development centre in Indore. If you
              contact us from outside India, your information will be transferred to and processed in India. Where we
              transfer personal data out of the EEA or the UK, we rely on appropriate safeguards such as Standard
              Contractual Clauses.
            </p>

            <h2 className="h-md">How long we keep it</h2>
            <ul>
              <li>
                <strong>Enquiries that do not become engagements:</strong> up to 24 months from your last contact with
                us, then deleted.
              </li>
              <li>
                <strong>Client records:</strong> for the duration of the engagement and for as long afterwards as
                contract, tax and accounting law requires.
              </li>
              <li>
                <strong>Job applications:</strong> up to 12 months, so we can consider you for future openings, unless
                you ask us to delete them sooner.
              </li>
            </ul>

            <h2 className="h-md">How we protect it</h2>
            <p>
              We apply the same practices we build for clients: encryption in transit, access controls scoped to who
              needs the data, audit logging, and vendor review. No system is perfectly secure, but we will notify you
              and the relevant authority of a breach affecting your personal data where the law requires it.
            </p>

            <h2 className="h-md">Your rights</h2>
            <p>Subject to the law that applies to you, you can ask us to:</p>
            <ul>
              <li>confirm what personal information we hold about you, and give you a copy;</li>
              <li>correct information that is inaccurate or incomplete;</li>
              <li>delete information we no longer need to keep;</li>
              <li>restrict or object to certain processing, including direct marketing;</li>
              <li>withdraw consent you previously gave, without affecting processing already carried out;</li>
              <li>nominate another person to exercise these rights on your behalf, as provided under the DPDP Act.</li>
            </ul>
            <p>
              Write to <a href={`mailto:${site.email}`}>{site.email}</a> and we will respond within the period the
              applicable law allows. We may need to verify your identity first.
            </p>

            <h2 className="h-md">Children</h2>
            <p>
              This website is intended for business use. We do not knowingly collect personal information from children.
              If you believe a child has provided us information, contact us and we will delete it.
            </p>

            <h2 className="h-md">Grievance officer</h2>
            <p>
              {/* TODO: appoint a named Grievance Officer / Data Protection Officer as required
                  under the DPDP Act 2023 and the IT Rules, and publish their name and contact here. */}
              Concerns about how we handle your personal information can be raised with our grievance officer at{' '}
              <a href={`mailto:${site.email}`}>{site.email}</a>. If you are in the EEA or UK and remain dissatisfied, you
              may also complain to your local supervisory authority.
            </p>

            <h2 className="h-md">Changes to this policy</h2>
            <p>
              We will update this page when our practices change, and the effective date at the top will change with it.
              Material changes will be highlighted on the page.
            </p>

            <h2 className="h-md">Contact</h2>
            <p>
              Email <a href={`mailto:${site.email}`}>{site.email}</a>, call {site.phones.join(' or ')}, or use the{' '}
              <Link href="/contact">contact form</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
