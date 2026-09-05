import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import {
  getCategoryStats,
  getTechnologyStats,
} from '@/lib/services/projectService'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    absolute: 'Buildfolio — Discover Projects. Share Ideas. Build Your Portfolio.',
  },
  description:
    'Discover projects, share ideas, and build your portfolio. The platform for developers to showcase their work.',
}

export default async function HomePage() {
  const [techCounts, categories] = await Promise.all([
    getTechnologyStats(),
    getCategoryStats(),
  ])
  return <HomeClient techCounts={techCounts} categories={categories} />
}
