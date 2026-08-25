'use client'

import type { AiQuotaSnapshot } from '@/lib/api/aiApi'

const AiQuotaStatus = ({ hourly, daily }: AiQuotaSnapshot) => (
  <p className='text-xs font-semibold text-gray-600'>
    {hourly.remaining} of {hourly.limit} generations left this hour ·{' '}
    {daily.remaining} of {daily.limit} left today
  </p>
)

export default AiQuotaStatus
