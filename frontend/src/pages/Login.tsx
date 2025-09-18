import { Box, Button, Paper, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAppDispatch } from '../store'
import { setCredentials } from '../store/authSlice'

export default function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', { login, password })
      const { token, user } = res.data.data
      dispatch(setCredentials({ token, user }))
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, width: 360 }} component="form" onSubmit={onSubmit}>
        <Typography variant="h6" gutterBottom>Login</Typography>
        <TextField label="Username or Email" fullWidth margin="normal" value={login} onChange={e => setLogin(e.target.value)} />
        <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <Typography color="error" variant="body2">{error}</Typography>}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Login</Button>
      </Paper>
    </Box>
  )
}
