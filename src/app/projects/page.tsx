import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProjectsClient from './ProjectsClient'
import {
  getCategoryStats,
  getTechnologyStats,
} from '@/lib/services/projectService'
import ProjectsPageSkeleton from '@/components/ui/ProjectsPageSkeleton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All Projects',
  description:
    'Browse all developer projects on Buildfolio. Filter by category, technology, and more.',
}

export default async function ProjectsPage() {
  const [techCounts, categories] = await Promise.all([
    getTechnologyStats(),
    getCategoryStats(),
  ])
  return (
    <Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsClient techCounts={techCounts} categories={categories} />
    </Suspense>
  )
}
