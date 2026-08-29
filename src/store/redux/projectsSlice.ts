import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getProjects,
  getMyProjects,
  createProject,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  likeProject as likeProjectApi,
  createDraftProject,
  publishProject as publishProjectApi,
  type LikeResult,
} from '../../lib/api/projectsApi'
import type { ProjectStatus } from '@/lib/shapes'
import { loginUser, logoutUser } from './authSlice'

export interface Project {
  id: string | number
  title: string
  slug: string
  description: string
  thumbnail: string | null
  github: string
  live: string
  category: string
  technologies: string[]
  author: string
  authorUsername?: string
  likes: number
  user_id: string | number | null
  category_id: string | number | null
  featuredAt: string | null
  hiddenAt: string | null
  hiddenReason: string | null
  status: ProjectStatus
  createdAt: string | null
}

interface NewProjectInput {
  title: string
  slug: string
  description: string
  thumbnail?: string | null
  github?: string
  live?: string
  user_id: string | number
  category_id?: string | number | null
  technologies?: string[]
}

export interface ProjectsState {
  items: Project[]
  ownedItems: Project[]
  loading: boolean
  error: string | null
  catalogRequestId: string | null
  ownedLoading: boolean
  ownedError: string | null
  ownedRequestId: string | null
  ownedUserId: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Async thunks
export const fetchProjects = createAsyncThunk<
  { items: Project[]; pagination: ProjectsState['pagination'] },
  {
    page?: number
    limit?: number
    search?: string
    category?: string
    technology?: string
    author?: string
    sort?: string
  } | void,
  { rejectValue: string }
>('projects/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const result = await getProjects(params || {})
    return { items: result.items, pagination: result.pagination }
  } catch {
    return rejectWithValue('Failed to load projects. Please try again.')
  }
})

export const fetchMyProjects = createAsyncThunk<Project[], string, { rejectValue: string }>(
  'projects/fetchMine',
  async (_userId, { rejectWithValue }) => {
  try {
    return await getMyProjects()
  } catch {
    return rejectWithValue('Failed to load your projects. Please try again.')
  }
})

export const addProject = createAsyncThunk<Project, NewProjectInput, { rejectValue: string }>(
  'projects/add',
  async (project, { rejectWithValue }) => {
    try {
      return await createProject({ ...project, likes: 0 })
    } catch (err) {
      return rejectWithValue((err as Error)?.message || 'Failed to create project. Please try again.')
    }
  },
)

export const saveDraftProject = createAsyncThunk<Project, NewProjectInput, { rejectValue: string }>(
  'projects/saveDraft',
  async (project, { rejectWithValue }) => {
    try {
      return await createDraftProject(project)
    } catch (err) {
      return rejectWithValue((err as Error)?.message || 'Failed to save draft. Please try again.')
    }
  },
)

export const updateProject = createAsyncThunk<
  Project,
  { id: string | number; updatedFields: Partial<Project>; userId: string },
  { rejectValue: string }
>(
  'projects/update',
  async ({ id, updatedFields }, { rejectWithValue }) => {
    try {
      return await updateProjectApi(id, updatedFields)
    } catch {
      return rejectWithValue('Failed to update project. Please try again.')
    }
  },
)

export const deleteProject = createAsyncThunk<
  string | number,
  { id: string | number; userId: string },
  { rejectValue: string }
>(
  'projects/delete',
  async ({ id }, { rejectWithValue }) => {
    try {
      await deleteProjectApi(id)
      return id
    } catch {
      return rejectWithValue('Failed to delete project. Please try again.')
    }
  },
)

export const likeProject = createAsyncThunk<
  { id: string | number; liked: boolean; likes: number },
  { id: string | number; userId: string },
  { rejectValue: string }
>('projects/like', async ({ id }, { rejectWithValue }) => {
  try {
    const result: LikeResult = await likeProjectApi(id)
    return { id, liked: result.liked, likes: result.likes }
  } catch {
    return rejectWithValue('Failed to like project.')
  }
})

export const publishProject = createAsyncThunk<
  Project,
  { id: string | number; userId: string },
  { rejectValue: string }
>(
  'projects/publish',
  async ({ id }, { rejectWithValue }) => {
    try {
      return await publishProjectApi(id)
    } catch (err) {
      return rejectWithValue((err as Error)?.message || 'Failed to publish project.')
    }
  },
)

const initialState: ProjectsState = {
  items: [],
  ownedItems: [],
  loading: false,
  error: null,
  catalogRequestId: null,
  ownedLoading: false,
  ownedError: null,
  ownedRequestId: null,
  ownedUserId: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
}

// Slice
const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchProjects
    builder
      .addCase(loginUser, (state, action) => {
        state.ownedItems = []
        state.ownedError = null
        state.ownedLoading = false
        state.ownedRequestId = null
        state.ownedUserId = String(action.payload.id)
      })
      .addCase(logoutUser, (state) => {
        state.ownedItems = []
        state.ownedError = null
        state.ownedLoading = false
        state.ownedRequestId = null
        state.ownedUserId = null
      })
      .addCase(fetchProjects.pending, (state, action) => {
        state.loading = true
        state.error = null
        state.catalogRequestId = action.meta.requestId
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        if (state.catalogRequestId !== action.meta.requestId) return
        state.loading = false
        state.items = action.payload.items
        state.pagination = action.payload.pagination
        state.catalogRequestId = null
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        if (state.catalogRequestId !== action.meta.requestId) return
        state.loading = false
        state.error = action.payload ?? null
        state.catalogRequestId = null
      })

    builder
      .addCase(fetchMyProjects.pending, (state, action) => {
        const userId = action.meta.arg
        if (state.ownedUserId && state.ownedUserId !== userId) return
        state.ownedUserId = userId
        state.ownedLoading = true
        state.ownedError = null
        state.ownedRequestId = action.meta.requestId
      })
      .addCase(fetchMyProjects.fulfilled, (state, action) => {
        if (
          state.ownedUserId !== action.meta.arg ||
          state.ownedRequestId !== action.meta.requestId
        ) return
        state.ownedLoading = false
        state.ownedItems = action.payload
        state.ownedRequestId = null
      })
      .addCase(fetchMyProjects.rejected, (state, action) => {
        if (
          state.ownedUserId !== action.meta.arg ||
          state.ownedRequestId !== action.meta.requestId
        ) return
        state.ownedLoading = false
        state.ownedError = action.payload ?? null
        state.ownedRequestId = null
      })

    // addProject
    builder
      .addCase(addProject.pending, (state, action) => {
        const userId = String(action.meta.arg.user_id)
        if (!state.ownedUserId) state.ownedUserId = userId
      })
      .addCase(addProject.fulfilled, (state, action) => {
        if (state.ownedUserId !== String(action.meta.arg.user_id)) return
        state.ownedItems.push(action.payload)
      })
      .addCase(addProject.rejected, (state, action) => {
        if (state.ownedUserId !== String(action.meta.arg.user_id)) return
        state.ownedError = action.payload ?? null
      })

    builder
      .addCase(saveDraftProject.pending, (state, action) => {
        const userId = String(action.meta.arg.user_id)
        if (!state.ownedUserId) state.ownedUserId = userId
      })
      .addCase(saveDraftProject.fulfilled, (state, action) => {
        if (state.ownedUserId !== String(action.meta.arg.user_id)) return
        state.ownedItems.push(action.payload)
      })
      .addCase(saveDraftProject.rejected, (state, action) => {
        if (state.ownedUserId !== String(action.meta.arg.user_id)) return
        state.ownedError = action.payload ?? null
      })

    // updateProject
    builder
      .addCase(updateProject.fulfilled, (state, action) => {
        if (state.ownedUserId === action.meta.arg.userId) {
          const ownedIndex = state.ownedItems.findIndex((p) => p.id === action.payload.id)
          if (ownedIndex !== -1) state.ownedItems[ownedIndex] = action.payload
        }
        const catalogIndex = state.items.findIndex((p) => p.id === action.payload.id)
        if (catalogIndex !== -1) state.items[catalogIndex] = action.payload
      })
      .addCase(updateProject.rejected, (state, action) => {
        if (state.ownedUserId === action.meta.arg.userId) {
          state.ownedError = action.payload ?? null
        }
      })

    // deleteProject
    builder
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
        if (state.ownedUserId === action.meta.arg.userId) {
          state.ownedItems = state.ownedItems.filter((p) => p.id !== action.payload)
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        if (state.ownedUserId === action.meta.arg.userId) {
          state.ownedError = action.payload ?? null
        }
      })

    // likeProject
    builder.addCase(likeProject.fulfilled, (state, action) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) state.items[index].likes = action.payload.likes
      if (state.ownedUserId === action.meta.arg.userId) {
        const ownedIndex = state.ownedItems.findIndex((p) => p.id === action.payload.id)
        if (ownedIndex !== -1) state.ownedItems[ownedIndex].likes = action.payload.likes
      }
    })

    builder
      .addCase(publishProject.fulfilled, (state, action) => {
        if (state.ownedUserId === action.meta.arg.userId) {
          const ownedIndex = state.ownedItems.findIndex((p) => p.id === action.payload.id)
          if (ownedIndex !== -1) state.ownedItems[ownedIndex] = action.payload
        }
        const catalogIndex = state.items.findIndex((p) => p.id === action.payload.id)
        if (catalogIndex !== -1) state.items[catalogIndex] = action.payload
      })
      .addCase(publishProject.rejected, (state, action) => {
        if (state.ownedUserId === action.meta.arg.userId) {
          state.ownedError = action.payload ?? null
        }
      })
  },
})

export default projectsSlice.reducer
