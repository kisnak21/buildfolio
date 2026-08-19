import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import { getTechnologyStats } from '@/lib/services/projectService'
import prisma from '@/lib/db'

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
    prisma.category.findMany({
      select: { id: true, name: true, icon: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return <HomeClient techCounts={techCounts} categories={categories} />
}