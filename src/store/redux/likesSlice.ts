import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getUserLikedProjects } from '@/lib/api/likesApi'
import type { NormalizedProject } from '@/lib/api/projectsApi'

interface LikesState {
  items: NormalizedProject[]
  loading: boolean
  error: string | null
}

const initialState: LikesState = { items: [], loading: false, error: null }

export const fetchLikedProjects = createAsyncThunk<NormalizedProject[], void, { rejectValue: string }>(
  'likes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await getUserLikedProjects()
    } catch {
      return rejectWithValue('Failed to load liked projects.')
    }
  },
)

const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    syncLike: (state, action: { payload: { project: NormalizedProject; liked: boolean } }) => {
      const { project, liked } = action.payload
      if (liked && !state.items.some((item) => item.id === project.id)) state.items.unshift(project)
      if (!liked) state.items = state.items.filter((item) => item.id !== project.id)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLikedProjects.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchLikedProjects.fulfilled, (state, action) => { state.loading = false; state.items = action.payload })
      .addCase(fetchLikedProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload ?? null })
  },
})

export const { syncLike } = likesSlice.actions
export default likesSlice.reducer
