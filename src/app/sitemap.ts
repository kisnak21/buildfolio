import type { MetadataRoute } from 'next'
import prisma from '@/lib/db'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/projects',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.8,
  }))

  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.user.findMany({
      select: { username: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ])

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${siteUrl}/projects/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const userRoutes: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${siteUrl}/u/${u.username}`,
    lastModified: u.createdAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [...staticRoutes, ...projectRoutes, ...userRoutes]
}