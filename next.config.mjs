/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: `npm run build` emits a fully static site in ./out
  // Deploy that folder to Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, or any host.
  output: 'export',

  // Every route becomes a folder with index.html, e.g. /about-us/index.html.
  // This keeps clean URLs working on plain static hosts.
  trailingSlash: true,

  images: {
    // Required for `output: 'export'` — no server-side image optimiser is available.
    unoptimized: true,
  },

  reactStrictMode: true,
};

export default nextConfig;
