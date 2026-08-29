import { describe, expect, it } from 'vitest'
import commentsReducer, { fetchComments } from '@/store/redux/commentsSlice'

const comment = {
  id: 1,
  content: 'Useful comment',
  user_id: 'user-1',
  project_id: 'project-new',
  author_name: 'Owner',
  created_at: '2026-08-28T00:00:00.000Z',
}

describe('comments state boundaries', () => {
  it('ignores a stale response after navigating to another project', () => {
    let state = commentsReducer(undefined, { type: '@@init' })
    state = commentsReducer(state, fetchComments.pending('old', 'project-old'))
    state = commentsReducer(state, fetchComments.pending('new', 'project-new'))
    state = commentsReducer(
      state,
      fetchComments.fulfilled([comment], 'old', 'project-old'),
    )

    expect(state.items).toEqual([])
    expect(state.loading).toBe(true)

    state = commentsReducer(
      state,
      fetchComments.fulfilled([comment], 'new', 'project-new'),
    )
    expect(state.items).toEqual([comment])
    expect(state.loading).toBe(false)
  })
})
