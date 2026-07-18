import realApiClient from './realApiClient'

export const getProjectComments = async (projectId: string) => {
  const response = await realApiClient.get(`/comments?projectId=${projectId}`)
  return response.data.data
}

export const addComment = async ({
  content,
  project_id,
}: {
  content: string
  project_id: string
}) => {
  const response = await realApiClient.post('/comments', {
    content,
    project_id,
  })
  return response.data.data
}

export const deleteComment = async (id: string) => {
  await realApiClient.delete(`/comments/${id}`)
  return id
}
