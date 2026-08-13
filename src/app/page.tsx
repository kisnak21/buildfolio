import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import { getTechnologyStats } from '@/lib/services/projectService'

export const metadata: Metadata = {
  title: 'Buildfolio — Discover Projects. Share Ideas. Build Your Portfolio.',
  description:
    'Discover projects, share ideas, and build your portfolio. The platform for developers to showcase their work.',
}

export default async function HomePage() {
  const techCounts = await getTechnologyStats()
  return <HomeClient techCounts={techCounts} />
}
