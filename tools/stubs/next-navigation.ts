/**
 * next/navigation, outside a Next runtime.
 *
 * The harness renders real components with react-dom/server, and several of
 * them — Nav, Analytics, the calculator — call these hooks. Outside a Next
 * request they have no context to read, and `usePathname()` returns null, so
 * the first `pathname.startsWith(...)` throws and every single case fails with
 * the same unhelpful "Cannot read properties of null". That is what had the
 * whole harness reporting 28 failures regardless of what was being rendered.
 *
 * A pathname of '/' is the honest stand-in: it makes the home route current and
 * nothing else, which is what a preview of a component in isolation should show.
 */
export function usePathname(): string {
  return '/';
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

export function useParams(): Record<string, string> {
  return {};
}

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  };
}

export function redirect(): never {
  throw new Error('redirect() called in the preview harness');
}

export function notFound(): never {
  throw new Error('notFound() called in the preview harness');
}
