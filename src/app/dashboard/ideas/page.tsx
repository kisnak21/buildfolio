import type { Metadata } from 'next'
import IdeasClient from './IdeasClient'
import IdeasComingSoon from './IdeasComingSoon'
import { AI_GENERATION_PAUSED } from '@/lib/aiAvailability'

export const metadata: Metadata = {
  title: 'Project Ideas',
  description: 'Generate focused project ideas for your Buildfolio portfolio.',
}

export default function IdeasPage() {
  return AI_GENERATION_PAUSED ? <IdeasComingSoon /> : <IdeasClient />
}
