import { configureStore } from '@reduxjs/toolkit'
import projectsReducer from './projectsSlice'
import authReducer from './authSlice'
import bookmarksReducer from './bookmarksSlice'
import commentsReducer from './commentsSlice'

const store = configureStore({
  reducer: {
    projects: projectsReducer,
    auth: authReducer,
    bookmarks: bookmarksReducer,
    comments: commentsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export { store }
export default store
