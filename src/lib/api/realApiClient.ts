import axios from 'axios'

const realApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_REAL_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send httpOnly cookie with every request
})

// Keep Authorization header fallback for backward compatibility
realApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('buildfolio_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return config
})

export default realApiClient
