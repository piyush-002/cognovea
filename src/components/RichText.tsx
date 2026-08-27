import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

/**
 * Renders Lexical content from Payload inside the site's `.rich` typography, so
 * an editor's article picks up exactly the same measure, spacing and link
 * styling as the hand-built pages.
 */
export default function RichText({ data, className }: { data: unknown; className?: string }) {
  if (!data) return null;
  return (
    <div className={className ? `rich ${className}` : 'rich'}>
      <LexicalRichText data={data as SerializedEditorState} />
    </div>
  );
}
