import { Suspense } from 'react';
import JsonLd from '@/components/JsonLd';
import {
  DEPARTMENT_LABELS,
  EMPLOYMENT_LABELS,
  WORKPLACE_LABELS,
  getOpenJobs,
} from '@/lib/content';
import { jobPostingSchema } from '@/lib/schema';

/**
 * The live openings section, split out of the careers page so it can stream.
 *
 * Careers is almost entirely verbatim copy from your source documents and needs
 * no database at all. Only this one section does. Keeping it inline made the
 * whole page await Neon before rendering anything, and a suspended Neon compute
 * takes seconds to wake, during which App Router keeps the previous page on
 * screen with no feedback. That is what a slow nav click actually was.
 *
 * Behind a Suspense boundary, the document copy renders immediately and the
 * openings arrive when they arrive.
 */
async function Openings() {
  const jobs = await getOpenJobs();
  if (jobs.length === 0) return null;

  return (
    <>
      <JsonLd data={jobs.map((j) => jobPostingSchema(j))} />

      <section className="band" id="current-openings">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Currently Hiring</p>
            <h2 className="h-lg">Current Openings</h2>
            <p className="lede">
              The roles we are actively hiring for right now. Each listing comes down automatically once its
              closing date passes, so what you see here is always current.
            </p>
          </div>

          <div className="grid grid--2">
            {jobs.map((j) => (
              <article className="card rv" key={j.id}>
                <p className="eyebrow">{DEPARTMENT_LABELS[j.department] ?? j.department}</p>
                <h3 className="h-sm" style={{ marginTop: '0.7rem' }}>
                  {j.title}
                </h3>

                <ul className="chips" style={{ marginTop: '0.9rem' }}>
                  <li>{WORKPLACE_LABELS[j.workplace] ?? j.workplace}</li>
                  <li>{EMPLOYMENT_LABELS[j.employmentType] ?? j.employmentType}</li>
                  {j.workplace !== 'remote' && j.location?.city && <li>{j.location.city}</li>}
                  {j.experience && <li>{j.experience}</li>}
                </ul>

                <p style={{ marginTop: '1rem' }}>{j.summary}</p>

                <p style={{ marginTop: '1rem' }}>
                  <a
                    className="link-arrow"
                    href={`mailto:${j.applyEmail}?subject=${encodeURIComponent(`Application: ${j.title}`)}`}
                  >
                    Apply for this role
                  </a>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function JobOpenings() {
  // No fallback markup on purpose: the section is hidden when nothing is open,
  // so a skeleton would promise roles that may not exist.
  return (
    <Suspense fallback={null}>
      <Openings />
    </Suspense>
  );
}
