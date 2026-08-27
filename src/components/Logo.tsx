import Link from 'next/link';
import Mark from '@/components/Mark';

/**
 * Cognovea lockup: the particle-C mark plus the wordmark.
 *
 * The wordmark splits "cogno" (solid) from "vea" (the violet → blue → cyan
 * ramp), matching the live site. The mark is the same object as the hero
 * animation, not a simplified stand-in.
 */
export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link className="logo" href={href} aria-label="Cognovea home">
      <Mark />
      <span>
        <span className="logo__word">
          cogno<em>vea</em>
        </span>
        <span className="logo__tag">Data + AI Solutions</span>
      </span>
    </Link>
  );
}
