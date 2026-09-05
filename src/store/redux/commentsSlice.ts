import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getProjectComments,
  addComment as addCommentApi,
  deleteComment as deleteCommentApi,
} from '../../lib/api/commentsApi'

export const fetchComments = createAsyncThunk<Comment[], string, { rejectValue: string }>(
  'comments/fetchByProject',
  async (projectId, { rejectWithValue }) => {
    try {
      return await getProjectComments(projectId)
    } catch {
      return rejectWithValue('Failed to load comments.')
    }
  },
)

export const addComment = createAsyncThunk<
  Comment,
  { content: string; project_id: string }
>('comments/add', async ({ content, project_id }, { rejectWithValue }) => {
  try {
    return await addCommentApi({ content, project_id })
  } catch {
      return rejectWithValue('Failed to post comment.')
  }
})

export const deleteComment = createAsyncThunk<
  string,
  { id: string; projectId: string }
>(
  'comments/delete',
  async ({ id }, { rejectWithValue }) => {
    try {
      await deleteCommentApi(id.toString())
      return id
    } catch {
      return rejectWithValue('Failed to delete comment.')
    }
  },
)

interface Comment {
  id: number
  content: string
  user_id: string
  project_id: string
  author_name?: string | null
  created_at?: string | null
}

interface CommentsState {
  items: Comment[]
  loading: boolean
  error: string | null
  activeProjectId: string | null
  requestId: string | null
}

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    items: [],
    loading: false,
    error: null,
    activeProjectId: null,
    requestId: null,
  } as CommentsState,
  reducers: {
    clearComments: (state) => {
      state.items = []
      state.loading = false
      state.error = null
      state.activeProjectId = null
      state.requestId = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state, action) => {
        state.activeProjectId = action.meta.arg
        state.requestId = action.meta.requestId
        state.loading = true
        state.error = null
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        if (
          state.activeProjectId !== action.meta.arg ||
          state.requestId !== action.meta.requestId
        ) return
        state.loading = false
        state.items = action.payload
        state.requestId = null
      })
      .addCase(fetchComments.rejected, (state, action) => {
        if (
          state.activeProjectId !== action.meta.arg ||
          state.requestId !== action.meta.requestId
        ) return
        state.loading = false
        state.error = action.payload ?? null
        state.requestId = null
      })
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.activeProjectId === action.meta.arg.project_id) {
          state.items.unshift(action.payload)
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        if (state.activeProjectId === action.meta.arg.projectId) {
          state.items = state.items.filter((c) => String(c.id) !== action.payload)
        }
      })
  },
})

export const { clearComments } = commentsSlice.actions
export default commentsSlice.reducer
