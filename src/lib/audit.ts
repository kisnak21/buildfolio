import type { NextRequest } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/db'

export type AuditAction =
  | 'user.promote'
  | 'user.demote'
  | 'user.verify'
  | 'user.delete'
  | 'user.ban'
  | 'user.unban'
  | 'user.suspend'
  | 'user.unsuspend'
  | 'project.delete'
  | 'project.hide'
  | 'project.unhide'
  | 'project.feature'
  | 'project.unfeature'
  | 'comment.delete'
  | 'comment.hide'
  | 'comment.unhide'
  | 'category.create'
  | 'category.rename'
  | 'category.delete'
  | 'tech.create'
  | 'tech.delete'
  | 'auth.login_fail'
  | 'auth.register'
  | 'auth.password_reset'
  | 'flag.create'
  | 'flag.resolve'
  | 'flag.dismiss'

export interface AuditLogParams {
  actor?: {
    id?: string | null
    name?: string | null
    email?: string | null
  } | null
  action: AuditAction
  targetType: string
  targetId?: string | null
  targetName?: string | null
  metadata?: Record<string, unknown> | null
  ip?: string | null
  userAgent?: string | null
}

type AuditClient = Pick<Prisma.TransactionClient, 'auditLog'>

export const writeAudit = async (
  params: AuditLogParams,
  client: AuditClient = prisma,
) => {
  await client.auditLog.create({
    data: {
      actorId: params.actor?.id ?? null,
      actorName: params.actor?.name ?? null,
      actorEmail: params.actor?.email ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      targetName: params.targetName ?? null,
      ...(params.metadata
        ? { metadata: params.metadata as Prisma.InputJsonValue }
        : {}),
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    },
  })
}

/**
 * Writes an audit log entry. Never throws: a failure to log must not
 * break the underlying operation.
 */
export const logAudit = async (params: AuditLogParams) => {
  try {
    await writeAudit(params)
  } catch (err) {
    console.error('[audit] failed to log action:', params.action, err)
  }
}

/** Extracts IP + user agent from a request for audit purposes. */
export const requestContext = (req: NextRequest) => ({
  ip:
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null,
  userAgent: req.headers.get('user-agent')?.slice(0, 512) || null,
})
