import type { Instrumentation } from 'next'
import { logger } from '@/lib/logger'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('server instance started')
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const message = err instanceof Error ? err.message : String(err)
  const digest =
    typeof err === 'object' && err !== null && 'digest' in err
      ? String(err.digest)
      : undefined
  const stack = err instanceof Error ? err.stack : undefined

  logger.error(
    {
      digest,
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      stack,
    },
    `request error: ${message}`,
  )
}