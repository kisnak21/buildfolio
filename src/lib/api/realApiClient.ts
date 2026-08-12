import axios from 'axios'

const realApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_REAL_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send httpOnly cookie with every request
})

export default realApiClient