import NotFoundBody from '@/components/NotFoundBody';

/**
 * The 404 for a notFound() thrown inside a page that matched — a playbook or
 * portfolio slug that no longer resolves.
 *
 * This one renders inside the frontend layout, so it gets the nav, footer and
 * document shell already. The unmatched-URL case is handled by the root
 * app/not-found.tsx, which has to build its own shell; both render the same
 * body so the two cannot say different things.
 */
export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundBody />;
}
