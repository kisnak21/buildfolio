import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getUserBookmarks,
  addBookmark as addBookmarkApi,
  removeBookmark as removeBookmarkApi,
} from '../../lib/api/bookmarksApi'

interface Bookmark {
  id: number
  user_id: string
  project_id: string
  [key: string]: unknown
}

export const fetchBookmarks = createAsyncThunk<Bookmark[], number, { rejectValue: string }>(
  'bookmarks/fetchAll',
  async (userId, { rejectWithValue }) => {
    try {
      return await getUserBookmarks(userId.toString())
    } catch (err) {
      return rejectWithValue('Failed to load bookmarks.')
    }
  },
)

export const addBookmark = createAsyncThunk<Bookmark, { project_id: string | number }, { rejectValue: string }>(
  'bookmarks/add',
  async ({ project_id }, { rejectWithValue }) => {
    try {
      return await addBookmarkApi({
        project_id: String(project_id),
      })
    } catch (err) {
      return rejectWithValue('Failed to add bookmark.')
    }
  },
)

export const removeBookmark = createAsyncThunk<number, { bookmarkId: number }, { rejectValue: string }>(
  'bookmarks/remove',
  async ({ bookmarkId }, { rejectWithValue }) => {
    try {
      await removeBookmarkApi(bookmarkId.toString())
      return bookmarkId
    } catch (err) {
      return rejectWithValue('Failed to remove bookmark.')
    }
  },
)

interface BookmarksState {
  items: Bookmark[]
  loading: boolean
  error: string | null
}

const initialState: BookmarksState = {
  items: [],
  loading: false,
  error: null,
}

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? null
      })
      .addCase(addBookmark.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload)
      })
  },
})

export default bookmarksSlice.reducer
