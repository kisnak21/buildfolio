import realApiClient from './realApiClient'

interface RawProject {
  id: string | number
  title: string
  slug: string
  description: string
  thumbnail?: string | null
  github_url?: string
  github?: string
  live_url?: string
  live?: string
  category_name?: string
  category?: string
  technologies?: string[]
  author_name?: string
  author?: string
  likes?: number
  user_id?: string | number | null
  category_id?: string | number | null
  created_at?: string | null
  createdAt?: string | null
}

export interface NormalizedProject {
  id: string | number
  title: string
  slug: string
  description: string
  thumbnail: string | null
  github: string
  live: string
  category: string
  technologies: string[]
  author: string
  likes: number
  user_id: string | number | null
  category_id: string | number | null
  createdAt: string | null
}

interface CreateProjectInput {
  title: string
  slug: string
  description: string
  thumbnail?: string | null
  github?: string
  github_url?: string
  live?: string
  live_url?: string
  user_id: string | number
  category_id?: string | number | null
  likes?: number
}

interface UpdateProjectFields {
  title?: string
  slug?: string
  description?: string
  thumbnail?: string | null
  github?: string
  github_url?: string
  live?: string
  live_url?: string
  category_id?: string | number | null
  likes?: number
}

const normalizeProject = (p: RawProject): NormalizedProject => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  description: p.description,
  thumbnail: p.thumbnail || null,
  github: p.github_url || p.github || '#',
  live: p.live_url || p.live || '#',
  category: p.category_name || p.category || '',
  technologies: Array.isArray(p.technologies) ? p.technologies : [],
  author: p.author_name || p.author || '',
  likes: p.likes || 0,
  user_id: p.user_id || null,
  category_id: p.category_id || null,
  createdAt: p.created_at || p.createdAt || null,
})

export const getProjects = async (
  params: { page?: number; limit?: number; search?: string; category?: string; sort?: string } = {},
): Promise<{ items: NormalizedProject[]; pagination: any }> => {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.set('page', String(params.page))
  if (params.limit) queryParams.set('limit', String(params.limit))
  if (params.search) queryParams.set('search', params.search)
  if (params.category) queryParams.set('category', params.category)
  if (params.sort) queryParams.set('sort', params.sort)

  const response = await realApiClient.get(`/projects?${queryParams.toString()}`)
  return {
    items: response.data.data.map(normalizeProject),
    pagination: response.data.pagination,
  }
}

export const createProject = async (project: CreateProjectInput): Promise<NormalizedProject> => {
  const response = await realApiClient.post('/projects', {
    title: project.title,
    slug: project.slug,
    description: project.description,
    thumbnail: project.thumbnail || null,
    github_url: project.github || project.github_url || null,
    live_url: project.live || project.live_url || null,
    user_id: project.user_id,
    category_id: project.category_id || null,
  })
  return normalizeProject(response.data.data)
}

export const updateProject = async (id: string | number, updatedFields: UpdateProjectFields): Promise<NormalizedProject> => {
  const response = await realApiClient.patch(`/projects/${id}`, {
    title: updatedFields.title,
    slug: updatedFields.slug,
    description: updatedFields.description,
    thumbnail: updatedFields.thumbnail,
    github_url: updatedFields.github || updatedFields.github_url,
    live_url: updatedFields.live || updatedFields.live_url,
    category_id: updatedFields.category_id,
    likes: updatedFields.likes,
  })
  return normalizeProject(response.data.data)
}

export const deleteProject = async (id: string | number): Promise<string | number> => {
  await realApiClient.delete(`/projects/${id}`)
  return id
}

export const likeProject = async (id: string | number): Promise<NormalizedProject> => {
  const response = await realApiClient.post(`/projects/${id}/like`)
  return normalizeProject(response.data.data)
}
