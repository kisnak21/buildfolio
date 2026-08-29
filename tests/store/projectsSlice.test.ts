import { describe, expect, it } from 'vitest'
import projectsReducer, {
  deleteProject,
  fetchMyProjects,
  fetchProjects,
  likeProject,
  publishDraft,
  type Project,
  updateProject,
} from '@/store/redux/projectsSlice'
import { loginUser, logoutUser } from '@/store/redux/authSlice'

const project: Project = {
  id: 'project-1',
  title: 'Owned project',
  slug: 'owned-project',
  description: 'An owned project.',
  thumbnail: null,
  github: '',
  live: '',
  category: 'Web App',
  technologies: [],
  author: 'Owner',
  likes: 0,
  user_id: 'user-1',
  category_id: null,
  featuredAt: null,
  hiddenAt: null,
  hiddenReason: null,
  status: 'DRAFT',
  createdAt: '2026-08-28T00:00:00.000Z',
}

const pagination = { page: 1, limit: 6, total: 0, totalPages: 0 }

describe('projects state boundaries', () => {
  it('keeps owner results separate from the public catalog', () => {
    let state = projectsReducer(undefined, { type: '@@init' })
    state = projectsReducer(state, fetchProjects.pending('catalog', undefined))
    state = projectsReducer(
      state,
      fetchProjects.fulfilled({ items: [], pagination }, 'catalog', undefined),
    )
    state = projectsReducer(state, fetchMyProjects.pending('mine', 'user-1'))
    state = projectsReducer(state, fetchMyProjects.fulfilled([project], 'mine', 'user-1'))

    expect(state.items).toEqual([])
    expect(state.ownedItems).toEqual([project])
  })

  it('ignores a stale catalog response after a newer request starts', () => {
    let state = projectsReducer(undefined, { type: '@@init' })
    state = projectsReducer(state, fetchProjects.pending('old', undefined))
    state = projectsReducer(state, fetchProjects.pending('new', undefined))
    state = projectsReducer(
      state,
      fetchProjects.fulfilled({ items: [project], pagination }, 'old', undefined),
    )

    expect(state.loading).toBe(true)
    expect(state.items).toEqual([])

    state = projectsReducer(
      state,
      fetchProjects.fulfilled({ items: [], pagination }, 'new', undefined),
    )
    expect(state.loading).toBe(false)
  })

  it('does not write a completed private mutation into a newer account', () => {
    let state = projectsReducer(undefined, { type: '@@init' })
    state = projectsReducer(
      state,
      loginUser({ id: 'user-1', name: 'Owner', email: 'owner@example.com' }),
    )
    state = projectsReducer(state, fetchMyProjects.pending('mine', 'user-1'))
    state = projectsReducer(state, fetchMyProjects.fulfilled([project], 'mine', 'user-1'))
    state = projectsReducer(
      state,
      logoutUser(),
    )

    const updatedProject = { ...project, title: 'Private response' }
    state = projectsReducer(
      state,
      updateProject.fulfilled(
        updatedProject,
        'update-old-account',
        { id: project.id, userId: 'user-1', updatedFields: {} },
      ),
    )
    state = projectsReducer(
      state,
      publishDraft.fulfilled(
        updatedProject,
        'publish-old-account',
        { id: project.id, userId: 'user-1' },
      ),
    )
    state = projectsReducer(
      state,
      deleteProject.fulfilled(project.id, 'delete-old-account', {
        id: project.id,
        userId: 'user-1',
      }),
    )

    expect(state.ownedItems).toEqual([])
  })

  it('does not write stale like results into the current account-owned item', () => {
    let state = projectsReducer(undefined, { type: '@@init' })
    state = projectsReducer(
      state,
      loginUser({ id: 'user-2', name: 'Current user', email: 'current@example.com' }),
    )
    state = projectsReducer(state, fetchMyProjects.pending('mine', 'user-2'))
    state = projectsReducer(state, fetchMyProjects.fulfilled([project], 'mine', 'user-2'))
    state = projectsReducer(
      state,
      likeProject.fulfilled(
        { id: project.id, liked: true, likes: 99 },
        'like-old-account',
        { id: project.id, userId: 'user-1' },
      ),
    )

    expect(state.ownedItems[0].likes).toBe(0)
  })
})
