import realApiClient from './realApiClient'

export const getUserBookmarks = async () => {
  const response = await realApiClient.get('/bookmarks')
  return response.data.data
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
