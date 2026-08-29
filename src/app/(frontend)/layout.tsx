import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import Analytics from '@/components/Analytics';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import Reveal from '@/components/Reveal';
import ScrollProgress from '@/components/ScrollProgress';
import { abs, site } from '@/lib/site';
import './globals.css';

/**
 * Self-hosted at build time rather than fetched from Google.
 *
 * The previous `<link rel="stylesheet" href="fonts.googleapis.com/css2...">`
 * was a render-blocking third-party request: the browser could not paint text
 * until it had resolved DNS for fonts.googleapis.com, opened a TLS connection,
 * downloaded the CSS, then done the same again for fonts.gstatic.com to get the
 * font files. That whole chain sits directly in front of Largest Contentful
 * Paint, which is what the LCP number was measuring.
 *
 * next/font downloads these at build time and serves them from this origin, so
 * there is no third-party connection, no render-blocking stylesheet, and the
 * font files are preloaded. Same typefaces, same weights, identical rendering.
 *
 * No `weight` array: both families are variable fonts, so one file covers every
 * weight, including the 450 the body copy uses.
 */
const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  /* No `template`. It was '%s | Cognovea', which Next appends to every child
     page's title — including the seven whose titles, taken from the source
     documents, already end in the brand. Those rendered as
     "… | Cognovea | Cognovea". The duplication is invisible in a page file,
     because half of it comes from here.

     The document-specified title is now what renders, exactly. The four pages
     whose titles do not carry the brand say so themselves. */
  title: 'Cognovea | Data Analytics and AI Solutions',
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: 'Cognovea | Data Analytics and AI Solutions',
    description: 'Data Depth. AI Power. Real Impact.',
    url: site.url,
    locale: 'en_IN',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Cognovea: Where Data Becomes Intelligence. Data engineering, analytics, business intelligence and AI.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cognovea | Data Analytics and AI Solutions',
    description: 'Data Depth. AI Power. Real Impact.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='6' r='2.4' fill='%236D3BEF'/%3E%3Ccircle cx='8' cy='10' r='2.4' fill='%236D3BEF'/%3E%3Ccircle cx='5' cy='16' r='2.4' fill='%232563EB'/%3E%3Ccircle cx='8' cy='22' r='2.4' fill='%232563EB'/%3E%3Ccircle cx='16' cy='26' r='2.4' fill='%2322D3EE'/%3E%3Ccircle cx='23' cy='24' r='1.6' fill='%2322D3EE'/%3E%3Ccircle cx='23' cy='8' r='1.6' fill='%232563EB'/%3E%3C/svg%3E",
        type: 'image/svg+xml',
      },
    ],
  },
};

export const viewport = {
  themeColor: '#0A1024',
  width: 'device-width',
  initialScale: 1,
};

/** Only the profiles that have actually been filled in. */
const socialProfiles = (Object.values(site.social) as string[]).filter(
  (url) => typeof url === 'string' && url.trim().length > 0,
);

/** Organization + WebSite schema, emitted once for the whole site. */
const orgSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${site.url}/#organization`,
      name: site.name,
      url: abs('/'),
      email: site.email,
      slogan: site.tagline,
      /* Google needs a logo it can display beside the organisation. og.png is
         a 1200x630 social card, which is not one. public/logo.png is the same
         particle mark the site draws, generated from the same seeded function
         in src/lib/mark.ts, so it is the real thing rather than a stand-in. */
      logo: {
        '@type': 'ImageObject',
        url: abs('/logo.png').replace(/\/$/, ''),
        width: 512,
        height: 512,
      },
      image: abs('/logo.png').replace(/\/$/, ''),
      description:
        'Cognovea is a data analytics and AI company providing data engineering, business intelligence, predictive analytics and AI solutions.',
      telephone: site.phones[0],
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.locations.hq.address,
        addressLocality: site.locations.hq.locality,
        addressRegion: site.locations.hq.region,
        postalCode: site.locations.hq.postalCode,
        addressCountry: site.locations.hq.country,
      },
      /* Profiles Cognovea controls, which is how a search engine confirms
         this entity is the same one it sees elsewhere. Built from site.social
         and omitted entirely while those are empty: a sameAs pointing at a
         handle that does not exist is a worse signal than no sameAs, and
         shipping placeholder URLs would claim profiles we do not have. */
      ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
      location: [
        {
          '@type': 'Place',
          name: 'Bengaluru (Head Office)',
          address: {
            '@type': 'PostalAddress',
            streetAddress: site.locations.hq.address,
            addressLocality: 'Bengaluru',
            addressRegion: 'KA',
            postalCode: '560102',
            addressCountry: 'IN',
          },
        },
        {
          '@type': 'Place',
          name: 'Indore (Development Centre)',
          address: {
            '@type': 'PostalAddress',
            streetAddress: site.locations.dev.address,
            addressLocality: 'Indore',
            addressRegion: 'MP',
            postalCode: '452001',
            addressCountry: 'IN',
          },
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      url: abs('/'),
      name: site.name,
      publisher: { '@id': `${site.url}/#organization` },
      inLanguage: 'en',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <head>
        {/* Scroll-reveal safety net. globals.css starts .rv elements hidden so they
            can animate in; if JavaScript never runs, nothing would ever reveal them.
            This <noscript> block cancels the hidden state in that case.

            Deliberately NOT an inline script that stamps a class on <html>: that is
            the usual trick, but it changes the DOM before React hydrates, so the
            server HTML and the client DOM differ and React reports a hydration
            mismatch. A <noscript> style is identical on both sides, no mismatch,
            no suppressHydrationWarning needed. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: '<style>.rv{opacity:1 !important;transform:none !important;transition:none !important}</style>',
          }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <JsonLd data={orgSchema} />
        <ScrollProgress />
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <Reveal />
        <Analytics />
      </body>
    </html>
  );
}
