import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getProjects,
  createProject,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  likeProject as likeProjectApi,
  type NormalizedProject,
  type GetProjectsResult,
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
  user_id: string | number | null
  category_id: string | number | null
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
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Async thunks
export const fetchProjects = createAsyncThunk<
  GetProjectsResult,
  { page?: number; limit?: number; search?: string; category?: string; sort?: string },
  { rejectValue: string }
>(
  'projects/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await getProjects(params)
    } catch (err) {
      return rejectWithValue('Failed to load projects. Please try again.')
    }
  },
)

export const addProject = createAsyncThunk<Project, NewProjectInput, { rejectValue: string }>(
  'projects/add',
  async (project, { rejectWithValue }) => {
    try {
      return await createProject({ ...project, likes: 0 })
    } catch (err) {
      return rejectWithValue('Failed to create project. Please try again.')
    }
  },
)

export const updateProject = createAsyncThunk<Project, { id: string | number; updatedFields: Partial<Project> }, { rejectValue: string }>(
  'projects/update',
  async ({ id, updatedFields }, { rejectWithValue }) => {
    try {
      return await updateProjectApi(id, updatedFields)
    } catch (err) {
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
    } catch (err) {
      return rejectWithValue('Failed to delete project. Please try again.')
    }
  },
)

export const likeProject = createAsyncThunk<
  NormalizedProject,
  string | number,
  { rejectValue: string }
>('projects/like', async (id, { rejectWithValue }) => {
  try {
    return await likeProjectApi(id)
  } catch (err) {
    return rejectWithValue('Failed to like project.')
  }
})

interface ProjectsState {
  items: Project[]
  loading: boolean
  error: string | null
}

const initialState: ProjectsState = {
  items: [],
  loading: false,
  error: null,
}

// Slice
const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  } as { items: Project[]; loading: boolean; error: string | null; pagination: PaginationState },
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

    // addProject
    builder
      .addCase(addProject.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(addProject.rejected, (state, action) => {
        state.error = action.payload ?? null
      })

    // updateProject
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
