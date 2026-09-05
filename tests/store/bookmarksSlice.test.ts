import { describe, expect, it } from 'vitest'
import bookmarksReducer, {
  fetchBookmarks,
  removeBookmark,
} from '@/store/redux/bookmarksSlice'

describe('bookmark request boundaries', () => {
  it('ignores a fetch response that started before a mutation', () => {
    let state = bookmarksReducer(undefined, { type: '@@init' })
    state = bookmarksReducer(state, fetchBookmarks.pending('fetch-old', 'user-1'))
    state = bookmarksReducer(
      state,
      removeBookmark.pending('remove', {
        bookmarkId: 'bookmark-1',
        userId: 'user-1',
      }),
    )
    state = bookmarksReducer(
      state,
      fetchBookmarks.fulfilled([], 'fetch-old', 'user-1'),
    )

    expect(state.requestId).toBeNull()
    expect(state.loading).toBe(false)
  })
})
