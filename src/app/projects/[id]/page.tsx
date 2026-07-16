import type { Metadata } from 'next'
import ProjectDetailClient from './ProjectDetailClient'

export const metadata: Metadata = {
  title: 'Project',
  description: 'View project details on Buildfolio.',
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />
}
