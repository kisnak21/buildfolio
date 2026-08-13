import type { Metadata } from 'next'
import { cache } from 'react'
import { getProjectsByAuthor } from '@/lib/services/projectService'
import { toClientProject } from '@/lib/shapes'
import UserProfileClient from './UserProfileClient'

const getProfileData = cache(async (author: string) => {
  const projects = await getProjectsByAuthor(author)
  return projects.map(toClientProject)
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>
}): Promise<Metadata> {
  const { author } = await params
  const decoded = decodeURIComponent(author)
  const projects = await getProfileData(decoded)

  if (projects.length === 0) {
    return { title: `Projects by ${decoded}` }
  }

  return {
    title: `${decoded}'s projects — Buildfolio`,
    description: `Browse ${projects.length} projects by ${decoded} on Buildfolio.`,
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ author: string }>
}) {
  const { author } = await params
  const decoded = decodeURIComponent(author)
  const projects = await getProfileData(decoded)

  return <UserProfileClient author={decoded} initialProjects={projects} />
}