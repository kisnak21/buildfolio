import { Prisma } from '@/generated/prisma/client'

export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

export interface ErrorLike {
  code?: string
  statusCode?: number
  meta?: { target?: string | string[] }
  message?: string
}

const knownErrors: Record<string, { message: string; status: number }> = {
  P2002: { message: 'A record with this value already exists', status: 409 },
  P2003: { message: 'Referenced record does not exist', status: 400 },
  P2025: { message: 'Record not found', status: 404 },
  P2023: { message: 'Invalid ID format', status: 400 },
  23505: { message: 'A record with this value already exists', status: 409 },
  23503: { message: 'Referenced record does not exist', status: 400 },
  23502: { message: 'A required field is missing', status: 400 },
  '22P02': { message: 'Invalid ID format', status: 400 },
}

export function dbErrorMessage(err: unknown): string {
  const error = err as ErrorLike
  const known = knownErrors[error?.code ?? '']
  if (known) return known.message
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = knownErrors[err.code]
    if (mapped) return mapped.message
  }
  return isProduction() ? 'Internal server error' : error?.message || 'Internal server error'
}

export function errorStatus(err: unknown): number {
  const error = err as ErrorLike
  return (
    error?.statusCode ??
    knownErrors[error?.code ?? '']?.status ??
    500
  )
}

export const httpError = (err: unknown): { statusCode?: number; message?: string } =>
  (err ?? {}) as { statusCode?: number; message?: string }