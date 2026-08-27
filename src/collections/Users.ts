import type { CollectionConfig } from 'payload';
import { authenticated, canAccessAdmin } from '@/access';

/**
 * Admin users. `auth: true` gives Payload its login, sessions, password reset
 * and the account that guards every other collection.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'updatedAt'],
    group: 'Admin',
  },
  auth: {
    // Sessions last a week; re-auth after that.
    tokenExpiration: 60 * 60 * 24 * 7,
    // Slows down credential-stuffing against a public login page.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    // No public self-registration. The first user is created through the
    // one-time setup screen; after that, existing admins create colleagues.
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
    admin: canAccessAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
};

export default Users;
