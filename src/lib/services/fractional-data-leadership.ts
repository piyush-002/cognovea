import type { Service } from './types';

export const fractionalDataLeadership: Service = {
  slug: 'fractional-data-leadership',
  title: 'Fractional Chief Data Officer Services | Cognovea',
  description:
    'Senior data leadership for manufacturers and energy operators who need the judgement of a Chief Data Officer without the cost of hiring one.',
  eyebrow: 'Data Leadership',
  h1: 'Fractional Chief Data Officer for Industrial Businesses',
  standfirst:
    'Plenty of companies have data problems that no amount of additional engineering will solve, because the missing thing is someone senior deciding what matters.',
  promise:
    'A senior data leader inside your business a few days a month, owning the strategy, the sequencing and the vendor decisions, and accountable for them.',
  image: {
    src: '/img/sv-fractional.svg',
    alt: 'A single accountable owner sitting between the executive team, the data team and outside vendors',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'When this is the answer',
      heading: 'The symptom is rarely described as a leadership gap',
      lede: 'It is usually described as a tooling problem, or a vendor problem, or a reporting problem.',
      body: [
        'The businesses that need this most rarely arrive asking for it. They arrive saying the dashboards are not being used, or that two systems disagree and nobody can say which is right, or that they have bought a platform and are not sure what it was for. Underneath most of those is the same thing: several people are making data decisions part-time, none of them owns the outcome, and so the decisions do not add up to a direction.',
        'A full-time Chief Data Officer solves that, and for a mid-market manufacturer or operator the cost is difficult to justify against the size of the problem, and difficult to fill, because the people who can do the job well are largely employed. So the role goes unfilled, the work distributes itself across an IT director, a finance analyst and whoever is loudest, and the pattern repeats.',
        'Fractional leadership is a straightforward answer to that shape: the judgement and the accountability, at the fraction of a week the problem actually requires. In our experience it is often the highest-leverage thing a company in this position can buy, precisely because it stops the spending that was going to happen anyway from being spent badly.',
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'The actual job',
      heading: 'What the role owns',
      lede: 'Not advice. Decisions, and responsibility for them.',
      cols: 2,
      cards: [
        {
          title: 'What gets done, and in what order',
          body: 'A sequenced plan tied to business outcomes rather than to a technology roadmap, with the things that are not being done named explicitly. Most data strategies fail on the second half of that sentence.',
        },
        {
          title: 'Vendor and platform decisions',
          body: 'Sitting on your side of the table for platform selection, statements of work and renewals. Someone who has read the contract, knows what the demo did not show, and has no commission riding on the answer.',
        },
        {
          title: 'The definitions everyone argues about',
          body: 'Getting the people who disagree about what a number means into a room, and writing the agreed definition down where the reports can use it. This is unglamorous and it is frequently the whole problem.',
        },
        {
          title: 'Growing the team you have',
          body: 'Hiring plans, structure, and mentoring the analysts and engineers already in place, including honest advice about which roles you do not need yet.',
        },
        {
          title: 'Governance proportionate to the business',
          body: 'Enough policy to satisfy customers, auditors and increasingly lenders, and not one document more. Governance programmes fail far more often from being too heavy than too light.',
        },
        {
          title: 'Translating both directions',
          body: 'Explaining to the board what the data work will and will not deliver, and explaining to the data team what the business is actually asking for. These are different languages and the gap between them is expensive.',
        },
      ],
    },
    {
      kind: 'table',
      eyebrow: 'The comparison people make',
      heading: 'Fractional, full-time, or a consulting project',
      lede: 'These solve genuinely different problems, and the wrong one is usually chosen on cost alone.',
      caption: 'Comparison of fractional data leadership, a full-time hire, and a consulting engagement',
      head: ['', 'Full-time CDO', 'Fractional CDO', 'Consulting project'],
      markColumn: 2,
      rows: [
        [
          'Best when',
          'Data is core to the product and the team is already large.',
          'The decisions are hard but not constant, and nobody senior owns them.',
          'The direction is already clear and a specific thing needs building.',
        ],
        [
          'Accountability',
          'Owns outcomes, permanently.',
          'Owns outcomes for the engagement, and is named in front of the board.',
          'Owns the deliverable, not the direction.',
        ],
        ['Time to in place', 'Three to nine months to hire, if the search succeeds.', 'Weeks.', 'Weeks.'],
        [
          'What it will not fix',
          'Nothing, given time. It is the complete answer where it is affordable.',
          'A genuine shortage of hands. This is judgement, not capacity.',
          'A missing owner. The project ends and the drift resumes.',
        ],
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'How it starts',
      heading: 'Deliberately reversible',
      lede: 'Nobody should commit to a year of senior time on the strength of a first meeting.',
      steps: [
        {
          title: 'Two weeks looking at what is actually there',
          body: 'The same Data Health Check we would run for anyone: systems, reporting, team, and the decisions currently being made badly or not at all. It ends in a written finding, and if that finding says you do not need this, it says so.',
        },
        {
          title: 'A named person, a fixed rhythm',
          body: 'Typically two to four days a month, with the same person each time, including a standing slot with the executive team, because the role does not work if it only ever talks to IT.',
        },
        {
          title: 'Reviewed at ninety days, and again at a year',
          body: 'Against outcomes agreed at the start. A frequent and entirely legitimate outcome is that the engagement ends because you are ready to hire someone permanent, and we help you write the brief and interview for it.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'How much of a week is this, realistically?',
      a: 'Two to four days a month for most mid-market businesses, concentrated rather than spread thin. Less than two days tends not to be enough presence to hold decisions together; more than four usually means the real need is a full-time hire, and we will say so.',
    },
    {
      q: 'Is this just consulting with a different name?',
      a: 'The difference is accountability and continuity. A consultant delivers a recommendation and leaves; a fractional leader carries the outcome, sits in your governance meetings, is named in front of your board, and is still there when the decision turns out to have been wrong. If what you need is a specific piece of work built, a consulting engagement is the cheaper and more honest answer.',
    },
    {
      q: 'Does the fractional CDO end up recommending Cognovea for everything?',
      a: 'That is the obvious conflict and it deserves a direct answer. The role includes vendor selection, and we will not be the right answer for every piece of it. We are explicit about where we have an interest, we support running competitive processes we may lose, and where a client prefers, we will contract so that delivery work is scoped by someone other than the person in the fractional seat.',
    },
    {
      q: 'What if we already have a data team?',
      a: 'That is the most common situation. The team is usually competent and under-directed, working on what was asked most recently rather than what matters most. The first job is normally to give them a sequence they can defend, not to change who is on the team.',
    },
    {
      q: 'Do you work with manufacturers and energy companies specifically?',
      a: 'That is where most of our work sits, and it matters more than it might sound. Industrial data has particular conditions: OT and IT boundaries, plant-level variation, ERP estates that have grown for twenty years. Someone who has only led data in a software or retail business will spend the first six months learning them.',
    },
    {
      q: 'What happens when the engagement ends?',
      a: 'The intended outcome is that it ends because you have grown into a permanent hire. We write the role brief, help you interview, and hand over to whoever you appoint. An engagement that has to continue indefinitely for the data function to keep working has not succeeded.',
    },
  ],

  related: [
    {
      href: '/data-health-check',
      label: 'Data Health Check',
      blurb: 'Two weeks and a written finding. The usual way this starts, and it stands on its own.',
    },
    {
      href: '/ai-strategy-consulting',
      label: 'AI Strategy & Consulting',
      blurb: 'Where the question is specifically about AI rather than the data function as a whole.',
    },
    {
      href: '/playbooks',
      label: 'Industry Playbooks',
      blurb: 'What data and AI actually look like in six industries, use case by use case.',
    },
  ],
};
