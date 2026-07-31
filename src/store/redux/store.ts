import { configureStore } from '@reduxjs/toolkit'
import projectsReducer from './projectsSlice'
import authReducer from './authSlice'
import bookmarksReducer from './bookmarksSlice'
import commentsReducer from './commentsSlice'
import toastReducer from './toastSlice'

const store = configureStore({
  reducer: {
    projects: projectsReducer,
    auth: authReducer,
    bookmarks: bookmarksReducer,
    comments: commentsReducer,
    toast: toastReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export { store }
export default store
