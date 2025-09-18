import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type User = {
  _id: string
  username: string
  role: string
  department: string
}

type AuthState = {
  token: string | null
  user: User | null
}

const initialState: AuthState = {
  token: null,
  user: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token
      state.user = action.payload.user
      localStorage.setItem('auth', JSON.stringify(state))
    },
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('auth')
      location.href = '/login'
    },
    hydrate(state) {
      const saved = localStorage.getItem('auth')
      if (saved) {
        const parsed = JSON.parse(saved) as AuthState
        state.token = parsed.token
        state.user = parsed.user
      }
    }
  }
})

export const { setCredentials, logout, hydrate } = authSlice.actions
export default authSlice.reducer
