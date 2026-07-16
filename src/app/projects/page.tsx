import type { Metadata } from 'next'
import ProjectsClient from './ProjectsClient'

export const metadata: Metadata = {
  title: 'All Projects',
  description:
    'Browse all developer projects on Buildfolio. Filter by category, technology, and more.',
}

export default function ProjectsPage() {
  return <ProjectsClient />
}
