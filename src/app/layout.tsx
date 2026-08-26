import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import Reveal from '@/components/Reveal';
import ScrollProgress from '@/components/ScrollProgress';
import { abs, site } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Cognovea | Data Analytics, Business Intelligence & AI Solutions',
    template: '%s | Cognovea',
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: 'Cognovea | Where Data Becomes Intelligence',
    description: 'Data Depth. AI Power. Real Impact.',
    url: site.url,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cognovea | Where Data Becomes Intelligence',
    description: 'Data Depth. AI Power. Real Impact.',
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
    <html lang="en">
      <head>
        {/* Scroll-reveal safety net. globals.css starts .rv elements hidden so they
            can animate in; if JavaScript never runs, nothing would ever reveal them.
            This <noscript> block cancels the hidden state in that case.

            Deliberately NOT an inline script that stamps a class on <html>: that is
            the usual trick, but it changes the DOM before React hydrates, so the
            server HTML and the client DOM differ and React reports a hydration
            mismatch. A <noscript> style is identical on both sides — no mismatch,
            no suppressHydrationWarning needed. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: '<style>.rv{opacity:1 !important;transform:none !important;transition:none !important}</style>',
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;450;500;600&display=swap"
          rel="stylesheet"
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
      </body>
    </html>
  );
}
