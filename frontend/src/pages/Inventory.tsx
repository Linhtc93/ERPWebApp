import { useEffect, useState } from 'react'
import { apiAuth } from '../services/api'
import { Card, CardContent, Typography } from '@mui/material'

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([])
  useEffect(() => {
    apiAuth.get('/inventory/products').then(res => setProducts(res.data.data.products)).catch(() => {})
  }, [])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Products</Typography>
        <ul>
          {products.map(p => (
            <li key={p._id}>{p.productCode} - {p.productName} ({p.productType})</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
