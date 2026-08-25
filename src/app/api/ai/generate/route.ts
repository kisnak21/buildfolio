export const runtime = 'nodejs'
export const maxDuration = 60

import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req?: NextRequest) {
  const requestId = randomUUID()
  return NextResponse.json(
    {
      success: false,
      message:
        'AI generation is coming soon — we are evaluating alternative models. No generations are consumed.',
    },
    { status: 503, headers: { 'X-Request-ID': requestId } },
  )
}
