import axios from 'axios'
import { getIdToken } from './firebase'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
})

api.interceptors.request.use(async (config) => {
  const token = await getIdToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unknown error'
    return Promise.reject(new Error(message))
  }
)

// â”€â”€ Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const sendMessage = (sessionId, content, files = [], userId = 'guest') =>
  api.post('/chat/', { session_id: sessionId, message: content, user_id: userId })

export const getChatHistory = (sessionId) =>
  api.get(`/chat/sessions/${sessionId}/messages`)

export const listSessions = (userId = 'guest') =>
  api.get('/chat/sessions', { params: { user_id: userId } })

export const createSession = (title = 'New Chat', userId = 'guest') =>
  api.post('/chat/sessions', { title, user_id: userId })

export const deleteSession = (sessionId) =>
  api.delete(`/chat/sessions/${sessionId}`)

// â”€â”€ Memory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Real "list all" â€” used by the Memory tab's default view (no search query typed yet)
export const getMemories = (userId = 'guest', type = null) =>
  api.get('/memory/list', { params: { user_id: userId, ...(type ? { type } : {}) } })

// Filtered list by type â€” used by the filter tabs (All / Preferences / Facts / Tasks / Conversations)
export const getMemoriesByType = (userId = 'guest', type) =>
  api.get('/memory/list', { params: { user_id: userId, type } })

export const deleteMemory = (memoryId, userId = 'guest') =>
  api.delete(`/memory/${memoryId}`, { params: { user_id: userId } })

export const searchMemory = (userId = 'guest', query = '') =>
  api.post('/memory/search', { user_id: userId, query, top_k: 10 })

// â”€â”€ Files â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const uploadFile = (file, sessionId, userId = 'guest') => {
  const form = new FormData()
  form.append('file', file)
  form.append('user_id', userId)
  if (sessionId) form.append('session_id', sessionId)

  const endpoint = file.type === 'application/pdf' ? '/upload/pdf' : '/upload/text'

  return api.post(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// â”€â”€ User / Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getProfile = (userId = 'guest') => api.get('/auth/profile', { params: { user_id: userId } }).catch(() => ({}))

export const updateProfile = (data) => api.patch('/auth/profile', data).catch(() => ({}))

export const getSettings = (userId = 'guest') => api.get('/auth/settings', { params: { user_id: userId } }).catch(() => ({}))

export const updateSettings = (data, userId = 'guest') => api.patch('/auth/settings', { ...data, user_id: userId }).catch(() => ({}))

// -- Privacy --

export const exportUserData = (userId) =>
  api.get('/memory/export', { params: { user_id: userId } })

export const clearUserData = (userId) =>
  api.delete('/memory/clear', { params: { user_id: userId } })

export const getActivityLog = (userId, limit = 20) =>
  api.get('/memory/activity-log', { params: { user_id: userId, limit } })
