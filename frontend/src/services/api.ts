import axios from 'axios'
import { store } from '../store'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({ baseURL })

export const apiAuth = axios.create({ baseURL })

apiAuth.interceptors.request.use(config => {
  const token = store.getState().auth.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
