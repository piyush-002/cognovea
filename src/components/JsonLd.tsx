/**
 * Renders a JSON-LD block. Structured data is the highest-leverage SEO/AEO step:
 * it lets Google, AI Overviews, ChatGPT and Perplexity pull attributed answers.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for the </script> edge case.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
