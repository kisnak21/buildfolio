import type { Metadata } from 'next'
import ProjectsClient from './ProjectsClient'
import { getTechnologyStats } from '@/lib/services/projectService'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All Projects',
  description:
    'Browse all developer projects on Buildfolio. Filter by category, technology, and more.',
}

export default async function ProjectsPage() {
  const [techCounts, categories] = await Promise.all([
    getTechnologyStats(),
    prisma.category.findMany({
      select: { id: true, name: true, icon: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return <ProjectsClient techCounts={techCounts} categories={categories} />
}