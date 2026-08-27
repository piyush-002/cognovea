import type { Metadata } from 'next';
import Link from 'next/link';
import Testimonial from '@/components/Testimonial';
import { Arrow, CtaBand, Figure, PageHero, breadcrumbSchema, serviceSchema } from '@/components/Bits';
import Faq from '@/components/Faq';
import { faqSchema, type FaqItem } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import Rail from '@/components/Rail';

const PATH = '/data-modernization-services';

export const metadata: Metadata = {
  title: 'Data Modernization Services and Cloud Upgrades',
  description:
    'Build a cloud data modernization strategy with Cognovea. Our data architecture modernization consulting services prepare your enterprise for AI success.',
  alternates: { canonical: `${PATH}/` },
  openGraph: {
    title: 'Data Modernization Services and Cloud Upgrades | Cognovea',
    description:
      'Build a cloud data modernization strategy with Cognovea. Our data architecture modernization consulting services prepare your enterprise for AI success.',
    url: `${PATH}/`,
  },
};

const CRUMBS = [{ href: PATH, label: 'Data Modernization Services' }];

/* --- Layout Block 3: Core Modernization Pillars --- */
const PILLARS = [
  {
    id: 'architecture',
    label: 'Data Architecture Consulting',
    h: 'Data Architecture Consulting Services',
    paras: [
      'Before we move anything, we have to design the new digital space properly. Through our specialized data architecture consulting services, we design a highly organized layout for your new system. You can think of this as creating a custom office for a business where each department has easy access to everything they need.',
      'We put your information in a beautiful way so that your employees never have to waste time looking for things in jumbled digital folders again. Because of this careful planning, when a business leader asks a tough question, the computer can find the exact answer almost right away.',
      'Additionally, this new layout is completely flexible and ready for tomorrow. There is plenty of room in the system to grow if you decide to release a huge new line of products next year. Your business stays flexible, well-balanced, and ready to take advantage of any new chances that come up.',
    ],
  },
  {
    id: 'transformation',
    label: 'Cloud Transformation',
    h: 'Cloud Transformation Best Practices',
    paras: [
      'Once the beautiful new layout is designed, the actual moving process begins. We strictly follow established cloud transformation best practices to guarantee total safety during the move. We transfer your valuable files in very small, carefully monitored batches to prevent any errors.',
      'We check every single item to make sure it arrived safely at its new destination before we move the next group. This highly careful method ensures that your website stays online and your cash registers keep working perfectly while the upgrade happens in the background.',
      'Achieving true cloud modernization means your company gets a massive upgrade in speed and power without ever experiencing a frustrating technical outage. Your customers will continue enjoying your services without ever noticing that a massive internal transition is happening behind the scenes.',
    ],
  },
  {
    id: 'governance',
    label: 'AI Data Governance',
    h: 'AI Data Governance and Ecosystem Organization',
    paras: [
      'To get your business ready for smart technology, you need to plan for the future. You can use artificial intelligence to great effect to guess what your customers will want next, but it needs completely accurate data to work right. We set up strong ai data governance to ensure that all your files are neat, accurate, and totally organized.',
      'If you feed messy or broken files into a smart program, it will give you bad advice. We build automatic rules that double check your files every single day to catch any mistakes early.',
      'This keeps your digital environment so pristine that your new artificial intelligence tools will always give your leaders highly accurate predictions for future market trends. You can trust the numbers on your screen completely, allowing you to make incredibly bold choices for your company.',
    ],
  },
  {
    id: 'cost',
    label: 'IT Cost Optimization',
    h: 'IT Cost Optimization and Financial Growth',
    paras: [
      'Moving to a modern digital environment gives you incredible computing power, but you need to manage your budget wisely. We build smart IT cost optimization rules directly into your new setup to monitor your spending closely. These rules are designed to turn off computer servers automatically when your staff goes home for the night.',
      'Because you only pay for the power you actually consume during working hours, this intelligent financial planning saves a massive amount of capital over a full year. Your finance team will greatly appreciate how predictable and heavily controlled your monthly technology bills become.',
      'By saving money on extra server costs, you free up cash to invent new products or hire amazing new talent. Your upgraded setup becomes a powerful engine that drives real financial growth instead of just being a necessary monthly expense.',
    ],
  },
];

/* --- Layout Block 4: Comparison table --- */
const COMPARISON: [string, string, string][] = [
  ['Storage Space', 'Fixed sizes that fill up quickly', 'Unlimited room to grow instantly'],
  ['Payment Structure', 'Heavy upfront hardware purchases', 'Pay only for the power you consume'],
  ['Analytical Speed', 'Slow loading times for basic reports', 'Instant screen refreshes and live updates'],
  ['Future Readiness', 'Very hard to add new features', 'Easy to launch new tools in minutes'],
  ['Global Access', 'Stuck in one specific office building', 'Available securely anywhere in the world'],
];

/* --- Layout Block 8: Business impact --- */
const IMPACT = [
  {
    h: 'Finding the Truth',
    p: 'We gather all your numbers into one reliable place so your executives always have the correct facts for their meetings.',
  },
  {
    h: 'Faster Reporting',
    p: 'We replace manual spreadsheet work with colorful visual dashboards that update themselves automatically every single hour.',
  },
  {
    h: 'Better Teamwork',
    p: 'We give your departments the proper tools they need to share ideas securely and collaborate on huge projects easily.',
  },
  {
    h: 'Confident Choices',
    p: 'We provide leaders with clear evidence so they can make bold business choices without ever second guessing themselves.',
  },
];

/* --- Layout Block 9: FAQ --- */
const FAQS: FaqItem[] = [
  {
    q: 'What is the difference between a data lake vs a data warehouse?',
    a: 'These are two different types of storage spaces that work together beautifully to help your business. A lake is a massive, flexible pool where you can store raw files exactly as they arrive from your customers. It is perfect for running deep, complex experiments. On the other hand, a warehouse is highly organized. Every file is sorted neatly into specific rows and columns. This organized space is perfect for generating fast daily reports for your sales team.',
  },
  {
    q: 'What is the true difference between mainframe and cloud computing?',
    a: 'A mainframe is a giant, physical computer that sits inside your own office building. You have to pay for the electricity, the cooling fans, and the security guards to watch it. Cloud computing completely changes this by allowing you to rent space on incredibly advanced, secure computers owned by massive technology providers. You don’t have to worry about maintenance again, and with the push of a button, you can get more power right away.',
  },
  {
    q: 'Which is the best data warehouse platform?',
    a: 'Selecting the best data warehouse platform would depend on two things, one is how well your business operates today and where you plan to grow tomorrow. You want to look for a tool that scales up easily when your company grows and has built in security features to protect your files. We help you test different options to see which one works best for your daily reporting needs, ensuring your staff finds it completely intuitive and very easy to use.',
  },
  {
    q: 'What data security solutions are essential during an upgrade?',
    a: 'While you are in the process of relocating your files into a new space that is also digital, in order to be able to avoid the leaking of our data you need to make sure that you follow a very strong set of procedures precisely made for data security. Encryption that is strong makes your files unreadable while they are being sent across the internet, making it one of the most important tools. You also need strong controls on access to make sure only the personnel who are allowed to can open your company’s most private folders.',
  },
  {
    q: 'How do data quality best practices improve machine learning?',
    a: 'Machine learning programs learn exactly how to behave by reading your files. If you implement strong data quality best practices, you ensure that the program only reads clean, accurate, and completely true information. When the computer learns from perfect files, it gives your leadership team brilliant and highly accurate predictions. Taking the time to organize your files properly leads directly to much smarter business decisions.',
  },
];

export default function DataModernizationPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          serviceSchema({
            name: 'Data Modernization Services and Cloud Upgrades',
            description:
              'Cognovea plans and delivers cloud data modernization: architecture design, safe migration, AI data governance and IT cost optimization.',
            path: PATH,
            serviceType: 'Data Modernization Consulting',
          }),
          faqSchema(FAQS),
        ]}
      />

      {/* --- Layout Block 1: Hero --- */}
      <PageHero
        eyebrow="Data Modernization"
        title="Data Modernization Services and Cloud Upgrades"
        crumbs={CRUMBS}
        intro="Welcome to a completely new era of business growth. Through Cognovea data modernization services, we help you carefully pack up your digital assets and move them away from older computers into a bright, fast, and highly secure cloud environment. This essential upgrade prepares your entire company for artificial intelligence and gives you the exact tools you need to serve your global customers better than ever before."
      >
        <div className="btn-row">
          <Link className="btn btn--primary" href="/contact">
            Schedule a Modernization Consultation
            <Arrow />
          </Link>
          <Link className="btn btn--ghost" href="/data-engineering-services">
            Data Engineering Services
          </Link>
        </div>
      </PageHero>

      {/* --- Layout Block 2: Executive Overview Card --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Executive Overview</p>
            <h2 className="h-lg">Partnering with Visionary Data Strategy Companies</h2>
          </div>

          <div className="feature feature--copy">
            <div className="rich rv rv--left">
              <p>
                Every prosperous company ultimately hits a breaking point where its initial computer systems are unable to
                meet the demands of the day. When your business originally started, those outdated configurations worked
                just well for keeping track of goods or handling simple client information. But as your clientele grows
                internationally, those same systems start to lag and cause extremely annoying bottlenecks for your staff.
              </p>
              <p>
                Soon, employees are waiting for simple daily reports to load on their screens for hours at a time. These
                technical delays directly affect your ability to serve clients quickly and make smart choices for the
                future. To fix these growing pains gracefully, forward thinking leaders team up with expert data strategy
                companies to plan a better path forward.
              </p>
              <p>
                These specialized partners help you understand exactly what parts of your business need a digital upgrade.
                They look deeply at your unique challenges and recommend new tools that actually solve your specific daily
                problems. This intelligent partnership ensures that you are not just buying new technology for the sake of
                it, but making a highly calculated investment that supports your actual business goals.
              </p>
              <p>
                Cognovea takes immense pride in being that trusted technology guide for your organization. We walk right
                beside you during this entire upgrade process, making sure every single step is crystal clear and very
                easy to understand. We completely remove the technical confusion that usually surrounds massive corporate
                upgrades.
              </p>
              <p>
                Your workers may concentrate on their everyday responsibilities because our engineering team does all the
                labor-intensive work in the background. When your organization finally has this new digital basis in
                place, the positive effects are like a breath of fresh air.
              </p>
              <p>
                Your marketing department can instantly see which promotional campaigns are winning over customers. Your
                finance team can pull massive global revenue reports in a matter of seconds rather than days. Everything
                just works beautifully and smoothly. This newly found speed and daily reliability gives your entire
                workforce the absolute confidence they need to push your business toward incredible new financial heights.
              </p>
            </div>
            <Figure src="/img/dm-migration.svg" alt="Abstract diagram of legacy systems migrating batch by batch onto a cloud estate" />
          </div>
        </div>
      </section>

      {/* --- Layout Block 3: Core Modernization Pillars --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Strategy</p>
            <h2 className="h-lg">Defining Your Cloud Modernization Strategy</h2>
            <p className="lede">
              Building a better digital home for your company requires a brilliant blueprint. We help you design a
              detailed cloud modernization strategy that acts as a perfect map for your journey, ensuring that every
              single file and application moves to the right place without any confusion.
            </p>
          </div>

          <Rail
            items={PILLARS.map((p) => ({
              id: p.id,
              label: p.label,
              content: (
                <>
                  <h3 className="h-md">{p.h}</h3>
                  <div className="rich" style={{ marginTop: '1em' }}>
                    {p.paras.map((t, i) => (
                      <p key={i}>{t}</p>
                    ))}
                  </div>
                </>
              ),
            }))}
          />
        </div>
      </section>

      {/* --- Layout Block 4: Comparison table --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Before & After</p>
            <h2 className="h-lg">The Benefits of Upgrading</h2>
            <p className="lede">
              The transition away from old computers brings wonderful benefits to your daily routine. We help you leave
              behind strict physical limitations and step into a much more freeing way of working.
            </p>
          </div>

          <div className="table-scroll rv">
            <table>
              <caption className="sr-only">
                Comparison of classic legacy systems and modern cloud environments
              </caption>
              <thead>
                <tr>
                  <th scope="col">Feature Category</th>
                  <th scope="col">Classic Legacy Systems</th>
                  <th scope="col" className="col-mark">
                    Modern Cloud Environments
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([feature, legacy, modern]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    <td>{legacy}</td>
                    <td className="col-mark">{modern}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card card--flat rv mt-3 measure">
            <p>
              There is a great difference now between the old approach and the new way. When you move to current digital
              spaces, your employees will be able to work faster, communicate ideas more quickly and come up with better
              solutions for your clients without having to worry about computer crashes all the time.
            </p>
          </div>
        </div>
      </section>

      {/* --- Layout Block 5: Multi Cloud Expansion --- */}
      <section className="band band--dark">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Global Reach</p>
            <h2 className="h-lg">How Can Cloud Consulting Companies Expand Your Global Reach?</h2>
          </div>

          <div className="feature feature--copy">
            <div className="rich rv rv--left">
              <p>
                Large organizations often discover that they need several different technology providers to achieve the
                absolute best results. By acting as one of the most versatile cloud consulting companies available, we
                connect all these different providers into one smooth network for you.
              </p>
              <p>
                Using multiple providers allows you to pick the perfect tool for each specific job. For example, you might
                want to use one provider for storing massive amounts of customer files, and you might need a totally
                different provider to host your public website.
              </p>
              <p>
                We build strong, invisible bridges between these different tools so information flows freely back and
                forth. This connected approach gives your leadership team a single, clear view of the entire company.
              </p>
              <p>
                Even if your files are spread across secure servers in completely different countries, your team can
                manage everything from one simple control screen. This makes running an international business much easier
                and highly efficient. Working across multiple providers also means you can negotiate better pricing,
                keeping your business highly adaptable and financially healthy for the future.
              </p>
            </div>
            <Figure src="/img/dm-cost.svg" alt="Abstract cost curve falling as off-peak capacity is released each night" />
          </div>
        </div>
      </section>

      {/* --- Layout Block 6: Security Module --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">AI Readiness</p>
            <h2 className="h-lg">Structuring Data Governance for AI Readiness</h2>
          </div>

          <div className="feature feature--copy">
            <div className="rich rv rv--left">
              <p>
                The most important thing for any business is to keep their customers&rsquo; private information safe. From
                the very first day you use your new setup, we build strong protections right into it. This proactive step
                ensures your valuable assets remain completely shielded from outside threats at all times.
              </p>
              <p>
                A highly secure foundation is especially vital when you start using smart computer programs to analyze
                your customers. Establishing clear data governance for ai ensures that your smart programs are only
                allowed to read approved and totally safe information.
              </p>
              <p>
                We set up strict boundaries that protect your brand reputation and keep all personal customer details
                completely private. These boundaries prevent anyone from accessing sensitive folders unless they have
                explicit corporate permission.
              </p>
              <p>
                We also build automatic tracking logs that record exactly who viewed a file and when they looked at it.
                These clean and perfectly organized records make passing industry security audits a completely stress free
                event for your company. You can innovate boldly knowing your digital foundation is entirely secure and
                heavily guarded.
              </p>
            </div>
            <Figure src="/img/de-checks.svg" alt="Abstract grid of automated validation checks with one exception flagged" />
          </div>
        </div>
      </section>

      {/* --- Layout Block 7: Delivery Model --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Delivery Model</p>
            <h2 className="h-lg">Why Work With Top Data Architecture Consultants?</h2>
          </div>

          <div className="rich measure rv">
            <p>
              A very important choice is picking the right guide for your digital path. Our business is based on being
              completely honest and wanting your internal team to do well. We sit down with your staff every step of the
              way to ensure they feel complete comfort with their new tools.
            </p>
            <p>
              When you choose Cognovea, a dedicated data migration specialist manages the entire moving process for you.
              They watch over every single file transfer to guarantee that nothing gets lost or misplaced during the
              journey. You can relax completely knowing a seasoned professional is handling all the heavy lifting for
              your company.
            </p>
            <p>
              We also believe in teaching your employees how to thrive in their new digital home. Our expert data
              architecture consultants spend ample time explaining the new layout and showing your developers how to
              build fresh solutions safely.
            </p>
            <p>
              We do not just build a beautiful system and walk away the next morning. We stay to ensure your team is
              fully trained, highly confident, and deeply excited about using their new technology to win in the market.
            </p>
          </div>
        </div>
      </section>

      {/* --- Layout Block 8: Business Impact Grid --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Business Impact</p>
            <h2 className="h-lg">Opening New Doors for Your Business</h2>
            <p className="lede">
              The first thing you need to do to reach a whole new level of success is to improve your digital
              foundation. All of the people in your company can do their jobs perfectly and without any problems when
              information moves easily.
            </p>
          </div>

          <div className="grid grid--2">
            {IMPACT.map((c) => (
              <article className="card rv" key={c.h}>
                <h3 className="h-sm">{c.h}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>

          <div className="rich measure rv mt-3">
            <p>
              When you remove technical roadblocks, your employees simply have more free time to think creatively.
              Marketing teams can invent better promotional campaigns, and sales teams can close global deals much
              faster. This unified approach pushes your entire organization toward incredible financial achievements.
            </p>
          </div>
        </div>
      </section>

      {/* --- Layout Block 9: FAQ --- */}
      <section className="band band--deep">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">FAQ</p>
            <h2 className="h-lg">Common Questions About Upgrading</h2>
            <p className="lede">
              As leaders plan their digital evolution, they often have specific questions about how the new technology
              actually works. We have made every effort to simplify the technical subjects for you by providing you with
              concise responses that will aid in your decision-making.
            </p>
          </div>
          <div className="rv">
            <Faq items={FAQS} />
          </div>
        </div>
      </section>

      {/* --- Layout Block 10: Conversion Footer --- */}
      {/* Only shows a quote tagged for this service. A data engineering quote
          on a Generative AI page reads as filler, so no match means no section. */}
      <Testimonial service="data-modernization-services" />

      <CtaBand
        title="Begin Your Next Chapter Today"
        body="Stepping into the future of business requires a thoughtful plan and a highly reliable technology partner. Let us discuss how Cognovea can elevate your digital foundation and help your company reach its absolute highest potential."
        primary={{ href: '/contact', label: 'Schedule a Modernization Consultation' }}
        secondary={{ href: '/data-health-check', label: 'Book a Data Health Check' }}
      />
    </>
  );
}
