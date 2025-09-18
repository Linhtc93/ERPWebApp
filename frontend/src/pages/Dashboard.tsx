import { Card, CardContent, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useEffect, useState } from 'react'
import { apiAuth } from '../services/api'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    apiAuth.get('/dashboard/overview').then(res => setData(res.data.data)).catch(() => {})
  }, [])

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card><CardContent>
          <Typography variant="subtitle2">Total Transactions</Typography>
          <Typography variant="h4">{data?.kpis?.totalTransactions ?? '-'}</Typography>
        </CardContent></Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card><CardContent>
          <Typography variant="subtitle2">Total Accounts</Typography>
          <Typography variant="h4">{data?.kpis?.totalAccounts ?? '-'}</Typography>
        </CardContent></Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card><CardContent>
          <Typography variant="subtitle2">Total Products</Typography>
          <Typography variant="h4">{data?.kpis?.totalProducts ?? '-'}</Typography>
        </CardContent></Card>
      </Grid>
    </Grid>
  )
}
