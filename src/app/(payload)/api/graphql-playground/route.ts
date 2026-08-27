/* PAYLOAD SCAFFOLDING. The GraphQL playground.
   Payload disables this in production by default
   (graphQL.disablePlaygroundInProduction), so it is a development convenience
   only. If you would rather it not exist at all on a public deployment, delete
   this file, nothing else references it. */
import config from '@payload-config';
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes';

export const GET = GRAPHQL_PLAYGROUND_GET(config);
