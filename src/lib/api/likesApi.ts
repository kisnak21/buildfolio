import realApiClient from './realApiClient'
import type { NormalizedProject } from './projectsApi'

export const getUserLikedProjects = async (): Promise<NormalizedProject[]> => {
  const response = await realApiClient.get('/projects/liked')
  return response.data.data
}
