import type { Metadata } from 'next';
import Link from 'next/link';
import { Arrow, PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import Tabs from '@/components/Tabs';
import { site } from '@/lib/site';

const PATH = '/careers';

export const metadata: Metadata = {
  title: 'Cognovea Careers | Open Data & AI Roles',
  description:
    'Explore open data engineering, analytics and AI roles at Cognovea, with real client exposure, senior mentorship and defined project work.',
  alternates: { canonical: `${PATH}/` },
  openGraph: {
    title: 'Cognovea Careers | Open Data & AI Roles',
    description:
      'Explore open data engineering, analytics and AI roles at Cognovea, with real client exposure, senior mentorship and defined project work.',
    url: `${PATH}/`,
  },
};

const CRUMBS = [{ href: PATH, label: 'Careers' }];

const OFFER = [
  {
    h: 'Ownership that stays close to the work',
    p: 'The work is allocated with a well-defined position in the larger picture, hence you can be able to know what is expected from you and how your effort will be utilized. In the process of the project being implemented, decisions and duties are negotiated amongst the team members.',
  },
  {
    h: 'Direct access to senior leads',
    p: 'Senior leads remain involved in the work, allowing technical decisions and delivery questions to be discussed with people who understand the engagement in detail. Guidance is therefore available while the work is being carried out, which can make the learning experience more useful than training that remains separate from day to day delivery.',
  },
  {
    h: 'Documentation that supports the team',
    p: 'Project-related knowledge is recorded while the project is being undertaken, involving key decisions, processes, and contextual information that can prove valuable in the future. In case there is a transfer of responsibilities within the project team, the information is accessible to the whole project team, rather than relying solely on individual memory.',
  },
  {
    h: 'Defined projects with a clear finish',
    p: 'Projects are structured around an agreed scope and timeline, so the team can work toward a defined point of completion. Cognovea’s fixed price approach, no lock in model, and stated timelines are part of that wider way of working, although the focus for team members remains on delivering the agreed work and seeing the engagement through to handover.',
  },
];

const ROLES = [
  {
    key: 'data-engineer',
    label: 'Data Engineer Jobs',
    h: 'Data Engineer Jobs',
    paras: [
      'Our data engineer jobs are suited to people who want to work on the systems and data foundations that support analytics and AI work. Depending on the engagement, responsibilities may include developing data workflows, improving the way information is processed, or helping make data more usable for the teams working with it.',
      'Where remote data engineer jobs are available, the working arrangement should be stated clearly within the individual opening so candidates can understand the expectations before applying.',
    ],
  },
  {
    key: 'ai-engineer',
    label: 'AI Engineer Jobs',
    h: 'AI Engineer Jobs',
    paras: [
      'Our AI engineer jobs are focused on putting AI capabilities into practical use within real engagements. The work can involve technical implementation, integration into wider workflows, and the decisions required to make an AI capability useful within the context in which it is being built.',
    ],
  },
  {
    key: 'data-analyst',
    label: 'Data Analyst Jobs',
    h: 'Data Analyst Jobs',
    paras: [
      'Data analyst jobs at Cognovea entails analyzing data, drawing insights from data, interpreting results, and presenting information in a manner that may help in decision-making. Since there will be different openings for data analysts at Cognovea, each job posting will have unique qualifications. Thus, every job opening needs to be considered separately.',
    ],
  },
  {
    key: 'science-bi',
    label: 'Data Science & BI',
    h: 'Data Science and BI Roles',
    paras: [
      'Current hiring needs may also include data science jobs, BI developer jobs, analytics engineer jobs, and MLOps engineer jobs, depending on the work being taken up by the team. These roles cover different parts of the data and AI landscape, and each opening should explain the expected skills and responsibilities in enough detail for candidates to assess their fit.',
    ],
  },
];

const PHASES = [
  {
    h: 'Audit',
    p: 'This process starts off with an analysis of the existing data, processes, and technical environment. This will help the team determine the following steps to take based on the existing resources and changes needed.',
  },
  {
    h: 'Build',
    p: 'After determining the direction, the process moves into its implementation phase, whereby the task will be done collaboratively by all members of the team. There will be discussions on technicalities during the course of the task, while monitoring progress in relation to the scope of work.',
  },
  {
    h: 'Handover',
    p: 'The final stage is focused on making the completed work usable after the engagement has ended. Documentation and knowledge transfer are carried out as part of the handover, giving the people taking ownership the information they need to continue from the point at which the project concludes.',
  },
];

const HIRING = [
  {
    h: 'Application',
    p: 'First off, apply for a job opportunity that aligns with your skills and experience. The information presented to you here provides a first impression of your profile and will help in deciding if it’s appropriate for you.',
  },
  {
    h: 'Screening Call',
    p: 'This will allow you to talk about your experience, the job, and how the team functions. It will also give you the chance to ask any questions that you might have about what is required of you if you proceed further in the interview process.',
  },
  {
    h: 'Technical Exercise',
    p: 'Where a technical exercise is included, it is tied to practical, real world scope so that your approach to the work can be understood more clearly. The exercise can provide insight into how you reason through technical decisions, communicate your thinking, and work through an unfamiliar situation.',
  },
  {
    h: 'Offer',
    p: 'Candidates who successfully complete the process are taken through the offer and next steps by the Cognovea team. Further details are shared directly so that expectations are clear before the joining process begins.',
  },
];

const MAILTO = `mailto:${site.email}?subject=${encodeURIComponent('Careers — general interest application')}`;

export default function CareersPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Cognovea Careers',
            description:
              'Explore open data engineering, analytics and AI roles at Cognovea, with real client exposure, senior mentorship and defined project work.',
            url: 'https://cognovea.com/careers/',
          },
        ]}
      />

      <PageHero
        eyebrow="Careers"
        title={
          <>
            Build things that ship, not decks that <span className="grad">don&rsquo;t</span>
          </>
        }
        crumbs={CRUMBS}
        intro="Explore data engineer jobs and AI engineer jobs where your work is connected to real client engagements."
      >
        <div className="rich measure" style={{ marginTop: '1.4em' }}>
          <p>
            At Cognovea, people are given the opportunity to work directly on data and AI engagements where the work
            moves from an initial assessment through implementation and handover. The focus is placed on practical work
            that has a clear purpose, with experienced team members available to provide guidance as decisions are made
            and the engagement progresses.
          </p>
          <p>
            You will be able to see how your contribution fits into the wider engagement, rather than working on an
            isolated task without knowing what happens around it. Projects are scoped clearly, responsibilities are
            established early, and there is no expectation of sitting on the bench between projects while waiting for
            the next assignment.
          </p>
        </div>

        <div className="btn-row">
          <Link className="btn btn--primary" href="#open-roles">
            See Open Roles
            <Arrow />
          </Link>
          <a className="btn btn--ghost" href={MAILTO}>
            Tell Us About Yourself
          </a>
        </div>
      </PageHero>

      {/* --- What we offer --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Working Here</p>
            <h2 className="h-lg">What we offer you uniquely</h2>
            <p className="lede">
              Working on any particular project depends on the degree of background you have been provided with, the
              proximity to experienced people that you get, and the degree of clarity regarding your duties. At
              Cognovea, those parts of the working experience are intended to remain visible throughout an engagement.
            </p>
          </div>

          <div className="grid grid--2">
            {OFFER.map((c) => (
              <article className="card rv" key={c.h}>
                <h3 className="h-sm">{c.h}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>

          <div className="rich measure rv mt-3">
            <p>
              For people considering data consulting careers or AI consulting careers, this creates an environment where
              the work itself remains central to the experience. It also gives candidates considering careers at a data
              and AI company a clearer view of what their day to day contribution can involve.
            </p>
          </div>
        </div>
      </section>

      {/* --- Open roles --- */}
      <section className="band band--tint" id="open-roles">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Open Roles</p>
            <h2 className="h-lg">Open Roles</h2>
            <p className="lede">
              Cognovea&rsquo;s opportunities span Data, AI, and BI, with the exact roles depending on the capabilities
              needed across current engagements. Each opening should make the role, function, location or working
              arrangement, experience requirements, and application route clear before a candidate decides to apply. The
              Careers brief specifically calls for this structured approach so that the listings can remain current as
              hiring needs change.
            </p>
          </div>

          <div className="rv">
            <Tabs
              tabs={ROLES.map((r) => ({
                key: r.key,
                label: r.label,
                content: (
                  <div className="card card--pad-lg card--flat">
                    <h3 className="h-md">{r.h}</h3>
                    <div className="rich" style={{ marginTop: '1em' }}>
                      {r.paras.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                    <div className="btn-row">
                      <a className="btn btn--ghost btn--sm" href={MAILTO}>
                        Apply for this track
                      </a>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>

          <div className="rich measure rv mt-3">
            <p>
              If there is no suitable opening at the time you visit the page, Cognovea can remain open to hearing from
              strong candidates through a general interest application, rather than leaving the Careers page without a
              clear next step.
            </p>
          </div>

          <div className="btn-row">
            <a className="btn btn--primary" href={MAILTO}>
              View Open Roles
              <Arrow />
            </a>
            <a className="btn btn--ghost" href={MAILTO}>
              Submit Your Profile
            </a>
          </div>
        </div>
      </section>

      {/* --- What the work looks like --- */}
      <section className="band band--dark">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">The Work</p>
            <h2 className="h-lg">What the work actually looks like</h2>
            <p className="lede">
              Typical engagements can be explained using three phases: Audit, Build, and Handover. While the specifics
              of the work will vary depending on the particular engagement, the process overall helps members of the
              team gain a view of how a particular work is progressed from start to finish.
            </p>
          </div>

          <div className="grid grid--3">
            {PHASES.map((p, i) => (
              <div className="step rv" key={p.h}>
                <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-sm">{p.h}</h3>
                <p>{p.p}</p>
              </div>
            ))}
          </div>

          <div className="rich measure rv mt-3">
            <p>
              For someone building careers in data and AI, this means being able to see more of the engagement than a
              single technical task. You can gain context around how the work is assessed, developed, reviewed, and
              eventually handed over, which gives the role a clearer connection to the wider outcome.
            </p>
          </div>
        </div>
      </section>

      {/* --- Hiring process --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Hiring</p>
            <h2 className="h-lg">Our Hiring Process</h2>
            <p className="lede">
              The hiring process is kept straightforward, with each stage giving candidates a better understanding of
              the role while allowing the Cognovea team to assess the experience and technical approach relevant to the
              position.
            </p>
          </div>

          <div className="grid grid--4">
            {HIRING.map((h, i) => (
              <div className="step rv" key={h.h}>
                <span className="step__n">{`0${i + 1}`}</span>
                <h3 className="h-sm">{h.h}</h3>
                <p>{h.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Closing --- */}
      <section className="c-cta">
        <div className="wrap">
          <div className="rv measure">
            <p className="eyebrow">See Open Roles</p>
            <h2 className="h-lg" style={{ marginTop: '1rem' }}>
              Opportunities abound in the areas of data engineering, artificial intelligence, analytics, business
              intelligence, and data science; take a look at the current positions available and find out how you can
              join our team.
            </h2>
            <p className="lede" style={{ marginTop: '1.1em' }}>
              The work available through Cognovea careers is connected to real engagements, so the right opportunity may
              involve contributing to data infrastructure, developing AI capabilities, working with analytical data, or
              supporting the wider delivery of data and AI engagement.
            </p>

            <div className="btn-row">
              <a className="btn btn--primary" href={MAILTO}>
                See Open Roles
                <Arrow />
              </a>
            </div>

            <div className="card card--flat mt-3">
              <h3 className="h-sm">Don&rsquo;t see the right role? Tell us anyway.</h3>
              <p>
                Not every relevant opportunity will necessarily be open when you begin looking. If you want to join a
                data and AI team and your experience aligns with the kind of work carried out at Cognovea, you can share
                your profile for future consideration.
              </p>
              <p>
                <a className="link-arrow" href={MAILTO}>
                  Tell Us About Yourself
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
