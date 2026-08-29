import realApiClient from './realApiClient'
import { normalizeProject, type NormalizedProject, type RawProject } from './projectsApi'

export interface Bookmark {
  id: string
  user_id: string
  project_id: string
  created_at: string
  project: NormalizedProject
}

interface RawBookmark {
  id: string
  user_id: string
  project_id: string
  created_at: string
  project: RawProject
}

export const getUserBookmarks = async (): Promise<Bookmark[]> => {
  const response = await realApiClient.get<{ data: RawBookmark[] }>('/bookmarks')
  return response.data.data.map((bookmark) => ({
    ...bookmark,
    project: normalizeProject(bookmark.project),
  }))
}

export const addBookmark = async ({
  project_id,
}: {
  project_id: string
}): Promise<Bookmark> => {
  const response = await realApiClient.post<{ data: RawBookmark }>('/bookmarks', {
    project_id,
  })
  const bookmark = response.data.data
  return {
    ...bookmark,
    project: normalizeProject(bookmark.project),
  }
}

export const removeBookmark = async (id: string) => {
  await realApiClient.delete(`/bookmarks/${id}`)
  return id
}
