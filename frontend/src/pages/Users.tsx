import { useEffect, useState } from 'react'
import { apiAuth } from '../services/api'
import { Card, CardContent, Typography } from '@mui/material'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  useEffect(() => {
    apiAuth.get('/users').then(res => setUsers(res.data.data.users)).catch(() => {})
  }, [])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Users</Typography>
        <ul>
          {users.map(u => (
            <li key={u._id}>{u.username} - {u.role} ({u.department})</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
