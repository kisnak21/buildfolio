import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string | number
  name: string
  email: string
  bio?: string
  [key: string]: unknown
}

interface AuthState {
  currentUser: User | null
  authChecked: boolean
}

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null
  try {
    const storedUser = localStorage.getItem('buildfolio_user')
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

const initialState: AuthState = {
  currentUser: getStoredUser(),
  authChecked: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload
      localStorage.setItem('buildfolio_user', JSON.stringify(action.payload))
    },
    logoutUser: (state) => {
      state.currentUser = null
      localStorage.removeItem('buildfolio_user')
      // Clear session cookie client-side
      document.cookie = 'buildfolio_session=; path=/; max-age=0'
      // Fire-and-forget: clear httpOnly cookie via server endpoint
      fetch('/api/users/logout', { method: 'POST' }).catch(() => {})
    },
    updateProfile: (state, action: PayloadAction<{ name: string; bio: string }>) => {
      const { name, bio } = action.payload
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, name, bio }
        localStorage.setItem(
          'buildfolio_user',
          JSON.stringify(state.currentUser),
        )
      }
    },
  },
})

export const { loginUser, logoutUser, updateProfile } = authSlice.actions
export default authSlice.reducer
