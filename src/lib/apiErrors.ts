/**
 * Centralized error handling for API responses.
 * No internal system details leaked to the client in production.
 */

export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

export function dbErrorMessage(err: any): string {
  // PostgreSQL error code mapping → safe user message
  if (err?.code === '23505') return 'A record with this value already exists'
  if (err?.code === '23503') return 'Referenced record does not exist'
  return isProduction() ? 'Internal server error' : err?.message || 'Internal server error'
}
