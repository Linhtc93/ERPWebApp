import { useEffect, useState } from 'react'
import { apiAuth } from '../services/api'
import { Card, CardContent, Typography } from '@mui/material'

export default function Finance() {
  const [accounts, setAccounts] = useState<any[]>([])
  useEffect(() => {
    apiAuth.get('/finance/accounts').then(res => setAccounts(res.data.data.accounts)).catch(() => {})
  }, [])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Chart of Accounts</Typography>
        <ul>
          {accounts.map(a => (
            <li key={a._id}>{a.accountCode} - {a.accountName} ({a.accountType})</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
