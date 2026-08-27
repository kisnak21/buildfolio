import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import {
  getUserBookmarks,
  addBookmark as addBookmarkApi,
  removeBookmark as removeBookmarkApi,
  type BookmarkRecord,
} from '@/lib/api/bookmarksApi'

interface BookmarkIdentity {
  id: string
  user_id: string
  project_id: string
  created_at?: string
}

export const fetchBookmarks = createAsyncThunk<
  BookmarkRecord[],
  void,
  { rejectValue: string }
>('bookmarks/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await getUserBookmarks()
  } catch {
    return rejectWithValue('Failed to load bookmarks.')
  }
})

export const addBookmark = createAsyncThunk<
  BookmarkIdentity,
  { project_id: string | number },
  { rejectValue: string }
>('bookmarks/add', async ({ project_id }, { rejectWithValue }) => {
  try {
    return await addBookmarkApi({ project_id: String(project_id) })
  } catch {
    return rejectWithValue('Failed to add bookmark.')
  }
})

export const removeBookmark = createAsyncThunk<
  string,
  { bookmarkId: string },
  { rejectValue: string }
>('bookmarks/remove', async ({ bookmarkId }, { rejectWithValue }) => {
  try {
    await removeBookmarkApi(bookmarkId)
    return bookmarkId
  } catch {
    return rejectWithValue('Failed to remove bookmark.')
  }
})

interface BookmarksState {
  items: BookmarkRecord[]
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
      .addCase(addBookmark.rejected, (state, action) => {
        state.error = action.payload ?? null
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (bookmark) => bookmark.id !== action.payload,
        )
      })
      .addCase(removeBookmark.rejected, (state, action) => {
        state.error = action.payload ?? null
      })
  },
})

export default bookmarksSlice.reducer

const selectBookmarks = (state: { bookmarks: BookmarksState }) =>
  state.bookmarks.items

export const selectBookmarkedProjectIds = createSelector(
  [selectBookmarks],
  (bookmarks) => bookmarks.map((bookmark) => bookmark.project_id),
)

export const selectBookmarkByProjectId = (projectId: string | number) =>
  createSelector([selectBookmarks], (bookmarks) =>
    bookmarks.find(
      (bookmark) => bookmark.project_id === String(projectId),
    ),
  )
