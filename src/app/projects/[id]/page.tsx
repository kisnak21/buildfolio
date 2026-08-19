import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getProjectById } from '@/lib/services/projectService'
import { toClientProject } from '@/lib/shapes'
import ProjectDetailClient from './ProjectDetailClient'

const getProjectData = cache(async (id: string) => getProjectById(id))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const project = await getProjectData(id)

  if (!project) {
    return { title: 'Project not found' }
  }

  const description =
    project.description?.slice(0, 160) ??
    `Project ${project.title} on Buildfolio.`

  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      images: project.thumbnail ? [project.thumbnail] : undefined,
    },
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProjectData(id)

  if (!project) notFound()

  return <ProjectDetailClient initialProject={toClientProject(project)} />
}