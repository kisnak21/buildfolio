import realApiClient from './realApiClient'

export const getProjectComments = async (projectId: string) => {
  const response = await realApiClient.get(`/comments?projectId=${projectId}`)
  return response.data.data
}

export const addComment = async ({
  content,
  user_id,
  project_id,
}: {
  content: string
  user_id: string
  project_id: string
}) => {
  const response = await realApiClient.post('/comments', {
    content,
    user_id,
    project_id,
  })
  return response.data.data
}

export const deleteComment = async (id: string) => {
  await realApiClient.delete(`/comments/${id}`)
  return id
}
