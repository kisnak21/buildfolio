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
  recentSignups: AdminSignup[]
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

export const createAdminCategory = async (name: string) => {
  const response = await realApiClient.post<{ data: AdminCategory }>(
    `${RESOURCE}/categories`,
    { name },
  )
  return response.data.data
}

export const renameAdminCategory = async (id: string, name: string) => {
  const response = await realApiClient.patch<{ data: AdminCategory }>(
    `${RESOURCE}/categories/${id}`,
    { name },
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