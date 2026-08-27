/** next/image renders a plain img in the harness, layout is what we're checking. */
import React from 'react';
export default function Image(props: Record<string, unknown>) {
  return React.createElement('img', props as never);
}
