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
    } catch (err) {
      return rejectWithValue('Failed to load comments.')
    }
  },
)

export const addComment = createAsyncThunk<
  Comment,
  { content: string; user_id: string; project_id: string }
>(
  'comments/add',
  async (
    {
      content,
      user_id,
      project_id,
    }: { content: string; user_id: string; project_id: string },
    { rejectWithValue },
  ) => {
    try {
      return await addCommentApi({ content, user_id, project_id })
    } catch (err) {
      return rejectWithValue('Failed to post comment.')
    }
  },
)

export const deleteComment = createAsyncThunk<number, number>(
  'comments/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteCommentApi(id.toString())
      return id
    } catch (err) {
      return rejectWithValue('Failed to delete comment.')
    }
  },
)

interface Comment {
  id: number
  content: string
  user_id: string
  project_id: string
  [key: string]: any
}

interface CommentsState {
  items: Comment[]
  loading: boolean
  error: string | null
}

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    items: [],
    loading: false,
    error: null,
  } as CommentsState,
  reducers: {
    clearComments: (state) => {
      state.items = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? null
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload)
      })
  },
})

export const { clearComments } = commentsSlice.actions
export default commentsSlice.reducer
