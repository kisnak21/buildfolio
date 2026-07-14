import realApiClient from './realApiClient'

export const getUserBookmarks = async (userId: string) => {
  const response = await realApiClient.get(`/bookmarks?userId=${userId}`)
  return response.data.data
}

export const addBookmark = async ({
  user_id,
  project_id,
}: {
  user_id: string
  project_id: string
}) => {
  const response = await realApiClient.post('/bookmarks', {
    user_id,
    project_id,
  })
  return response.data.data
}

export const removeBookmark = async (id: string) => {
  await realApiClient.delete(`/bookmarks/${id}`)
  return id
}
