import realApiClient from './realApiClient'
import {
  toClientProject,
  type ClientProject as NormalizedProject,
  type RawProject,
} from '@/lib/shapes'

export { RawProject, NormalizedProject }

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
  category?: string
  technologies?: string[]
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
  category?: string
  technologies?: string[]
  likes?: number
}

export const normalizeProject = (p: RawProject): NormalizedProject => toClientProject(p)

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ApiError {
  response?: { status: number }
}

export const getProjects = async (
  params: { page?: number; limit?: number; search?: string; category?: string; sort?: string } = {},
): Promise<{ items: NormalizedProject[]; pagination: Pagination }> => {
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

export const getMyProjects = async (): Promise<NormalizedProject[]> => {
  const response = await realApiClient.get('/projects/mine')
  return response.data.data.map(normalizeProject)
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
    category: project.category,
    technologies: project.technologies || [],
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
    category: updatedFields.category,
    technologies: updatedFields.technologies,
    likes: updatedFields.likes,
  })
  return normalizeProject(response.data.data)
}

export const deleteProject = async (id: string | number): Promise<string | number> => {
  await realApiClient.delete(`/projects/${id}`)
  return id
}

export const getProjectById = async (id: string | number): Promise<NormalizedProject | null> => {
  try {
    const response = await realApiClient.get(`/projects/${id}`)
    return normalizeProject(response.data.data)
  } catch (err) {
    if ((err as ApiError).response?.status === 404) return null
    throw err
  }
}

export interface LikeResult {
  liked: boolean
  likes: number
}

export const likeProject = async (id: string | number): Promise<LikeResult> => {
  const response = await realApiClient.post(`/projects/${id}/like`)
  return response.data.data
}
