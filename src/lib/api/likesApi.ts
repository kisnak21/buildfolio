import realApiClient from './realApiClient'
import { normalizeProject, type NormalizedProject, type RawProject } from './projectsApi'

export const getUserLikedProjects = async (): Promise<NormalizedProject[]> => {
  const response = await realApiClient.get('/projects/liked')
  return (response.data.data as RawProject[]).map(normalizeProject)
}
