import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit'
import { getUserLikedProjects } from '@/lib/api/likesApi'
import type { NormalizedProject } from '@/lib/api/projectsApi'
import { loginUser, logoutUser } from './authSlice'

interface LikesState {
  items: NormalizedProject[]
  loading: boolean
  error: string | null
  activeUserId: string | null
  requestId: string | null
}

const initialState: LikesState = {
  items: [],
  loading: false,
  error: null,
  activeUserId: null,
  requestId: null,
}

export const fetchLikedProjects = createAsyncThunk<NormalizedProject[], string, { rejectValue: string }>(
  'likes/fetchAll',
  async (_userId, { rejectWithValue }) => {
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
    syncLike: (state, action: { payload: { project: NormalizedProject; liked: boolean; likes?: number; userId: string } }) => {
      const { project, liked, likes, userId } = action.payload
      if (state.activeUserId !== userId) return
      const nextProject = likes === undefined ? project : { ...project, likes }
      const existingIndex = state.items.findIndex((item) => item.id === project.id)
      if (liked && existingIndex === -1) state.items.unshift(nextProject)
      if (liked && existingIndex !== -1) state.items[existingIndex] = nextProject
      if (!liked) state.items = state.items.filter((item) => item.id !== project.id)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser, (state, action) => {
        state.items = []
        state.error = null
        state.loading = false
        state.activeUserId = String(action.payload.id)
        state.requestId = null
      })
      .addCase(logoutUser, (state) => {
        state.items = []
        state.error = null
        state.loading = false
        state.activeUserId = null
        state.requestId = null
      })
      .addCase(fetchLikedProjects.pending, (state, action) => {
        const userId = action.meta.arg
        if (state.activeUserId && state.activeUserId !== userId) return
        state.activeUserId = userId
        state.loading = true
        state.error = null
        state.requestId = action.meta.requestId
      })
      .addCase(fetchLikedProjects.fulfilled, (state, action) => {
        if (
          state.activeUserId !== action.meta.arg ||
          state.requestId !== action.meta.requestId
        ) return
        state.loading = false
        state.items = action.payload
        state.requestId = null
      })
      .addCase(fetchLikedProjects.rejected, (state, action) => {
        if (
          state.activeUserId !== action.meta.arg ||
          state.requestId !== action.meta.requestId
        ) return
        state.loading = false
        state.error = action.payload ?? null
        state.requestId = null
      })
  },
})

export const { syncLike } = likesSlice.actions
export default likesSlice.reducer

const selectLikesItems = (state: { likes: LikesState }) => state.likes.items

export const selectLikedProjectIds = createSelector(
  [selectLikesItems],
  (items) => items.map((i) => String(i.id)),
)

export const selectIsLiked = (id: string | number) =>
  createSelector(
    [selectLikesItems],
    (items) => items.some((i) => String(i.id) === String(id)),
  )
