/**
 * Shared between the consent banner and the footer control that reopens it.
 *
 * In its own module rather than exported from Analytics.tsx: that file is a
 * 'use client' module, and a plain constant exported from one becomes a client
 * reference the moment a Server Component imports it. Keeping the string here
 * means either side can use it without caring which boundary it sits on.
 */
export const COOKIE_SETTINGS_EVENT = 'cognovea:cookie-settings';

/** localStorage key holding the visitor's choice, as JSON. */
export const CONSENT_STORAGE_KEY = 'cognovea.consent.v1';
