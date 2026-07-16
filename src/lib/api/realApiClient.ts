import axios from 'axios'

const realApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_REAL_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request if available
realApiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('buildfolio_user')
  if (stored) {
    const user = JSON.parse(stored)
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`
    }
  }
  return config
})

export default realApiClient
