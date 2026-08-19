export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { createFlag, FLAG_REASONS } from '@/lib/services/flagService'
import { rateLimit } from '@/lib/rateLimit'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'
import { logAudit, requestContext } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = authenticate(req)
  if (error) return error

  try {
    const { success, resetInMs } = await rateLimit(`flag:${user.id}`, {
      max: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many reports. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const body = await req.json()
    const targetType = String(body?.targetType ?? '')
    const targetId = String(body?.targetId ?? '')
    const reason = String(body?.reason ?? '')
    const details = typeof body?.details === 'string' ? body.details : undefined

    const flag = await createFlag({
      targetType: targetType as 'project' | 'comment',
      targetId,
      reason: reason as (typeof FLAG_REASONS)[number],
      details,
      reporterId: user.id,
      reporterName: user.name ?? undefined,
    })

    await logAudit({
      actor: {
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? null,
      },
      action: 'flag.create',
      targetType: 'flag',
      targetId: flag.id,
      targetName: `${flag.targetType}:${flag.targetId}`,
      metadata: { reason: flag.reason },
      ...requestContext(req),
    })

    return NextResponse.json(
      { success: true, data: { id: flag.id, status: flag.status } },
      { status: 201 },
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}