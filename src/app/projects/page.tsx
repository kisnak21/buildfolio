import type { Metadata } from 'next'
import ProjectsClient from './ProjectsClient'
import { getTechnologyStats } from '@/lib/services/projectService'

export const metadata: Metadata = {
  title: 'All Projects',
  description:
    'Browse all developer projects on Buildfolio. Filter by category, technology, and more.',
}

export default async function ProjectsPage() {
  const techCounts = await getTechnologyStats()
  return <ProjectsClient techCounts={techCounts} />
}
