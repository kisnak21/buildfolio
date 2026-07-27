import { Prisma } from '@/generated/prisma/client'

export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

export function dbErrorMessage(err: any): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return 'A record with this value already exists'
    if (err.code === 'P2003') return 'Referenced record does not exist'
    if (err.code === 'P2025') return 'Record not found'
    if (err.code === 'P2023') return 'Invalid ID format'
  }
  if (err?.code === '23505') return 'A record with this value already exists'
  if (err?.code === '23503') return 'Referenced record does not exist'
  return isProduction() ? 'Internal server error' : err?.message || 'Internal server error'
}
