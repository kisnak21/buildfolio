import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getUserBookmarks,
  addBookmark as addBookmarkApi,
  removeBookmark as removeBookmarkApi,
} from '../../lib/api/bookmarksApi'
import type { Bookmark } from '../../lib/api/bookmarksApi'
import { loginUser, logoutUser } from './authSlice'
import { likeProject } from './projectsSlice'

export const fetchBookmarks = createAsyncThunk<Bookmark[], string, { rejectValue: string }>(
  'bookmarks/fetchAll',
  async (_userId, { rejectWithValue }) => {
    try {
      return await getUserBookmarks()
    } catch {
      return rejectWithValue('Failed to load bookmarks.')
    }
  },
)

export const addBookmark = createAsyncThunk<
  Bookmark,
  { project_id: string | number; userId: string },
  { rejectValue: string }
>(
  'bookmarks/add',
  async ({ project_id }, { rejectWithValue }) => {
    try {
      return await addBookmarkApi({
        project_id: String(project_id),
      })
    } catch {
      return rejectWithValue('Failed to add bookmark.')
    }
  },
)

export const removeBookmark = createAsyncThunk<
  string,
  { bookmarkId: string; userId: string },
  { rejectValue: string }
>(
  'bookmarks/remove',
  async ({ bookmarkId }, { rejectWithValue }) => {
    try {
      await removeBookmarkApi(bookmarkId)
      return bookmarkId
    } catch {
      return rejectWithValue('Failed to remove bookmark.')
    }
  },
)

interface BookmarksState {
  items: Bookmark[]
  loading: boolean
  error: string | null
  activeUserId: string | null
  requestId: string | null
}

const initialState: BookmarksState = {
  items: [],
  loading: false,
  error: null,
  activeUserId: null,
  requestId: null,
}

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {},
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
      .addCase(fetchBookmarks.pending, (state, action) => {
        const userId = action.meta.arg
        if (state.activeUserId && state.activeUserId !== userId) return
        state.activeUserId = userId
        state.loading = true
        state.error = null
        state.requestId = action.meta.requestId
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        if (
          state.activeUserId !== action.meta.arg ||
          state.requestId !== action.meta.requestId
        ) return
        state.loading = false
        state.items = action.payload
        state.requestId = null
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        if (
          state.activeUserId !== action.meta.arg ||
          state.requestId !== action.meta.requestId
        ) return
        state.loading = false
        state.error = action.payload ?? null
        state.requestId = null
      })
      .addCase(addBookmark.pending, (state, action) => {
        const userId = action.meta.arg.userId
        if (!state.activeUserId) state.activeUserId = userId
      })
      .addCase(addBookmark.fulfilled, (state, action) => {
        if (state.activeUserId !== action.meta.arg.userId) return
        state.items.push(action.payload)
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        if (state.activeUserId !== action.meta.arg.userId) return
        state.items = state.items.filter((b) => b.id !== action.payload)
      })
      .addCase(likeProject.fulfilled, (state, action) => {
        if (state.activeUserId !== action.meta.arg.userId) return
        const bookmark = state.items.find(
          (item) => String(item.project_id) === String(action.payload.id),
        )
        if (bookmark) bookmark.project.likes = action.payload.likes
      })
  },
})

export default bookmarksSlice.reducer
