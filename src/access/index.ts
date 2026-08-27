import type { Access } from 'payload';

/** Fully public. Used for reading published content. */
export const anyone: Access = () => true;

/** Any logged-in admin user. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user);

/**
 * The important one. An anonymous request gets a *query constraint* rather than
 * a boolean, so Payload folds `_status = published` into the database query
 * itself. That means an unpublished draft cannot leak through the REST API, the
 * GraphQL API, or a mis-written frontend query. The row is never selected in
 * the first place. Returning `true` here and filtering in the frontend would
 * leave the API wide open.
 */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true;
  return { _status: { equals: 'published' } };
};
