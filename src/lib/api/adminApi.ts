import realApiClient from './realApiClient'

export interface AdminUser {
  id: string
  name: string
  username: string
  email: string
  image: string | null
  verified: boolean
  role: 'ADMIN' | 'USER'
  projects: number
  createdAt: string
}

export interface AdminProject {
  id: string
  title: string
  author: string
  category: string
  likes: number
  createdAt: string
}

export interface AdminComment {
  id: string
  author: string
  project: string
  content: string
  createdAt: string
}

export interface AdminCategory {
  id: string
  name: string
  icon: string | null
  projects: number
}

export interface AdminTech {
  id: string
  name: string
  used: boolean
}

export interface AdminAuditLog {
  id: string
  actorId: string | null
  actorName: string | null
  actorEmail: string | null
  action: string
  targetType: string
  targetId: string | null
  targetName: string | null
  metadata: Record<string, unknown> | null
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export interface AdminSignup {
  id: string
  name: string
  username: string
  image: string | null
  createdAt: string
}

export interface AdminStats {
  stats: {
    users: number
    projects: number
    comments: number
    likes: number
    bookmarks: number
  }
  week: {
    users: number
    projects: number
    comments: number
    likes: number
    bookmarks: number
  }
  chart: { date: string; count: number }[]
  projectChart: { date: string; count: number }[]
  recentSignups: AdminSignup[]
  categoryDist: { name: string; count: number }[]
}

export interface AdminFlag {
  id: string
  targetType: string
  targetId: string
  reason: string
  details: string | null
  status: string
  reporterId: string | null
  reporterName: string | null
  createdAt: string
  resolvedAt: string | null
  resolvedById: string | null
  targetName: string | null
}

interface ListResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const RESOURCE = '/admin'

export const getAdminStats = async () => {
  const response = await realApiClient.get<{ data: AdminStats }>(
    `${RESOURCE}/stats`,
  )
  return response.data.data
}

export const getAdminUsers = async () => {
  const response = await realApiClient.get<{ data: ListResponse<AdminUser> }>(
    `${RESOURCE}/users`,
  )
  return response.data.data
}

export const updateAdminUser = async (
  id: string,
  data: { verified?: boolean; role?: string },
) => {
  const response = await realApiClient.patch<{ data: AdminUser }>(
    `${RESOURCE}/users?id=${encodeURIComponent(id)}`,
    data,
  )
  return response.data.data
}

export const deleteAdminUser = async (id: string) => {
  await realApiClient.delete(`${RESOURCE}/users/${id}`)
}

export const getAdminProjects = async () => {
  const response = await realApiClient.get<{
    data: ListResponse<AdminProject>
  }>(`${RESOURCE}/projects`)
  return response.data.data
}

export const deleteAdminProject = async (id: string) => {
  await realApiClient.delete(`${RESOURCE}/projects/${id}`)
}

export const getAdminComments = async () => {
  const response = await realApiClient.get<{
    data: ListResponse<AdminComment>
  }>(`${RESOURCE}/comments`)
  return response.data.data
}

export const deleteAdminComment = async (id: string) => {
  await realApiClient.delete(`${RESOURCE}/comments/${id}`)
}

export const getAdminCategories = async () => {
  const response = await realApiClient.get<{ data: AdminCategory[] }>(
    `${RESOURCE}/categories`,
  )
  return response.data.data
}

export const createAdminCategory = async (name: string, icon?: string) => {
  const response = await realApiClient.post<{ data: AdminCategory }>(
    `${RESOURCE}/categories`,
    { name, icon },
  )
  return response.data.data
}

export const renameAdminCategory = async (
  id: string,
  name: string,
  icon?: string,
) => {
  const response = await realApiClient.patch<{ data: AdminCategory }>(
    `${RESOURCE}/categories/${id}`,
    { name, icon },
  )
  return response.data.data
}

export const deleteAdminCategory = async (id: string) => {
  await realApiClient.delete(`${RESOURCE}/categories/${id}`)
}

export const getAdminTechs = async () => {
  const response = await realApiClient.get<{ data: AdminTech[] }>(
    `${RESOURCE}/technologies`,
  )
  return response.data.data
}

export const createAdminTech = async (name: string) => {
  const response = await realApiClient.post<{ data: AdminTech }>(
    `${RESOURCE}/technologies`,
    { name },
  )
  return response.data.data
}

export const deleteAdminTech = async (id: string) => {
  await realApiClient.delete(`${RESOURCE}/technologies/${id}`)
}

export const getAdminAuditLogs = async ({
  page = 1,
  limit = 20,
  action,
  search,
  from,
  to,
}: {
  page?: number
  limit?: number
  action?: string
  search?: string
  from?: string
  to?: string
} = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  if (action) params.set('action', action)
  if (search) params.set('search', search)
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  const response = await realApiClient.get<{
    data: AdminAuditLog[]
    pagination: ListResponse<AdminAuditLog>['pagination']
  }>(`${RESOURCE}/audit-logs?${params.toString()}`)
  return response.data
}

export const getAdminFlags = async ({
  status,
  page = 1,
  limit = 50,
}: {
  status?: string
  page?: number
  limit?: number
} = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set('status', status)

  const response = await realApiClient.get<{
    data: AdminFlag[]
    pagination: ListResponse<AdminFlag>['pagination']
  }>(`${RESOURCE}/flags?${params.toString()}`)
  return response.data
}

export const updateAdminFlag = async (id: string, status: 'resolved' | 'dismissed') => {
  const response = await realApiClient.patch<{ data: AdminFlag }>(
    `${RESOURCE}/flags/${id}`,
    { status },
  )
  return response.data.data
}