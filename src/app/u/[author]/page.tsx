import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getProjectsByAuthor } from '@/lib/services/projectService'
import { getUserByUsername } from '@/lib/services/userService'
import { toClientProject } from '@/lib/shapes'
import UserProfileClient from './UserProfileClient'

const getProfileData = cache(async (username: string) => {
  const [profile, projects] = await Promise.all([
    getUserByUsername(username),
    getProjectsByAuthor(username),
  ])
  return { profile, projects: projects.map(toClientProject) }
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>
}): Promise<Metadata> {
  const { author } = await params
  const username = decodeURIComponent(author)
  const { profile, projects } = await getProfileData(username)

  if (!profile) {
    return { title: `Profile @${username}` }
  }

  return {
    title: `${profile.name}'s projects — Buildfolio`,
    description: `Browse ${projects.length} projects by ${profile.name} on Buildfolio.`,
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ author: string }>
}) {
  const { author } = await params
  const username = decodeURIComponent(author)
  const { profile, projects } = await getProfileData(username)

  if (!profile) {
    notFound()
  }

  return (
    <UserProfileClient
      author={profile.name}
      username={profile.username}
      profileId={profile.id}
      profileImage={profile.image}
      profileBio={profile.bio}
      initialProjects={projects}
    />
  )
}
