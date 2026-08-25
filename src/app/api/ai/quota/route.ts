export const runtime = 'nodejs'

import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req?: NextRequest) {
  const requestId = randomUUID()
  return NextResponse.json(
    {
      success: false,
      message:
        'AI quota is coming soon — we are evaluating alternative models.',
    },
    { status: 503, headers: { 'X-Request-ID': requestId } },
  )
}
