import type { Metadata } from 'next'
import IdeasClient from './IdeasClient'

export const metadata: Metadata = {
  title: 'Project Ideas',
  description: 'Generate focused project ideas for your Buildfolio portfolio.',
}

export default function IdeasPage() {
  return <IdeasClient />
}
