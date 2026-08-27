import realApiClient from './realApiClient'
import { normalizeProject, type NormalizedProject, type RawProject } from './projectsApi'

export interface BookmarkRecord {
  id: string
  user_id: string
  project_id: string
  created_at: string
  project: NormalizedProject
}

interface RawBookmarkRecord extends Omit<BookmarkRecord, 'project'> {
  project: RawProject
}

export const getUserBookmarks = async (): Promise<BookmarkRecord[]> => {
  const response = await realApiClient.get('/bookmarks')
  return (response.data.data as RawBookmarkRecord[]).map((bookmark) => ({
    ...bookmark,
    project: normalizeProject(bookmark.project),
  }))
}

export const addBookmark = async ({
  project_id,
}: {
  project_id: string
}) => {
  const response = await realApiClient.post('/bookmarks', {
    project_id,
  })
  return response.data.data
}

export const removeBookmark = async (id: string) => {
  await realApiClient.delete(`/bookmarks/${id}`)
  return id
}
