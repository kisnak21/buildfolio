import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getProjects,
  getMyProjects,
  createProject,
  createDraftProject,
  publishProject,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  likeProject as likeProjectApi,
  type LikeResult,
} from '../../lib/api/projectsApi'

interface Project {
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
  likes: number
  status: 'DRAFT' | 'PUBLISHED'
  user_id: string | number | null
  category_id: string | number | null
  featuredAt: string | null
  hiddenAt: string | null
  hiddenReason: string | null
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

interface ProjectsState {
  items: Project[]
  loading: boolean
  error: string | null
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

export const fetchMyProjects = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string }
>('projects/fetchMine', async (_, { rejectWithValue }) => {
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

export const addDraftProject = createAsyncThunk<
  Project,
  Omit<NewProjectInput, 'slug' | 'user_id'>,
  { rejectValue: string }
>('projects/addDraft', async (project, { rejectWithValue }) => {
  try {
    return await createDraftProject(project)
  } catch {
    return rejectWithValue('Failed to save draft. Please try again.')
  }
})

export const publishDraft = createAsyncThunk<
  Project,
  string | number,
  { rejectValue: string }
>('projects/publishDraft', async (id, { rejectWithValue }) => {
  try {
    return await publishProject(id)
  } catch {
    return rejectWithValue('Failed to publish project. Please try again.')
  }
})

export const updateProject = createAsyncThunk<Project, { id: string | number; updatedFields: Partial<Project> }, { rejectValue: string }>(
  'projects/update',
  async ({ id, updatedFields }, { rejectWithValue }) => {
    try {
      return await updateProjectApi(id, updatedFields)
    } catch {
      return rejectWithValue('Failed to update project. Please try again.')
    }
  },
)

export const deleteProject = createAsyncThunk<string | number, string | number, { rejectValue: string }>(
  'projects/delete',
  async (id, { rejectWithValue }) => {
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
  string | number,
  { rejectValue: string }
>('projects/like', async (id, { rejectWithValue }) => {
  try {
    const result: LikeResult = await likeProjectApi(id)
    return { id, liked: result.liked, likes: result.likes }
  } catch {
    return rejectWithValue('Failed to like project.')
  }
})

const initialState: ProjectsState = {
  items: [],
  loading: false,
  error: null,
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
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.pagination = action.payload.pagination
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? null
      })

    builder
      .addCase(fetchMyProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyProjects.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchMyProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? null
      })

    // addProject
    builder
      .addCase(addProject.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(addProject.rejected, (state, action) => {
        state.error = action.payload ?? null
      })

    builder
      .addCase(addDraftProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(addDraftProject.rejected, (state, action) => {
        state.error = action.payload ?? null
      })
      .addCase(publishDraft.fulfilled, (state, action) => {
        const index = state.items.findIndex((project) =>
          String(project.id) === String(action.payload.id),
        )
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(publishDraft.rejected, (state, action) => {
        state.error = action.payload ?? null
      })

    builder
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = action.payload ?? null
      })

    // deleteProject
    builder
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = action.payload ?? null
      })

    // likeProject
    builder.addCase(likeProject.fulfilled, (state, action) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) state.items[index].likes = action.payload.likes
    })
  },
})

export default projectsSlice.reducer
