import Image from 'next/image';
import type { Author } from '@/lib/content';

/**
 * Who wrote this, shown on the article itself.
 *
 * Structured data alone does not satisfy a reader deciding whether to trust a
 * page, and Google is explicit that it wants the attribution visible rather
 * than only in the markup. So this renders, and the schema follows it.
 *
 * The company byline is deliberately plain: no photo, no role, no bio. Dressing
 * "The Cognovea Team" up with an avatar would imply a person who does not
 * exist, which is the thing worth avoiding here.
 */
export default function Byline({ author, compact = false }: { author: Author; compact?: boolean }) {
  if (author.isCompany) {
    return <span className="byline__name">{author.name}</span>;
  }

  if (compact) {
    return (
      <span className="byline__name">
        {author.name}
        {author.role ? <span className="byline__role">, {author.role}</span> : null}
      </span>
    );
  }

  return (
    <div className="byline">
      {author.photo?.url ? (
        <Image
          className="byline__photo"
          src={author.photo.url}
          alt={author.photo.alt || author.name}
          width={56}
          height={56}
        />
      ) : (
        // An initial rather than a stock silhouette, matching the quote cards.
        <span className="byline__initial" aria-hidden="true">
          {author.name.trim().charAt(0)}
        </span>
      )}

      <div>
        <p className="byline__name">
          {author.url ? (
            <a href={author.url} rel="author noopener noreferrer" target="_blank">
              {author.name}
            </a>
          ) : (
            author.name
          )}
        </p>
        {author.role ? <p className="byline__role">{author.role}</p> : null}
        {author.bio ? <p className="byline__bio">{author.bio}</p> : null}
      </div>
    </div>
  );
}
