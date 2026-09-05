import type { Metadata } from 'next'
import DraftsClient from './DraftsClient'

export const metadata: Metadata = {
  title: 'Draft Projects',
  description: 'Review and publish your private Buildfolio project drafts.',
}

export default function DraftsPage() {
  return <DraftsClient />
}
