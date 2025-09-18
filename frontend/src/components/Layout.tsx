import { AppBar, Box, Button, Container, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import InventoryIcon from '@mui/icons-material/Inventory'
import PeopleIcon from '@mui/icons-material/People'
import WorkHistoryIcon from '@mui/icons-material/WorkHistory'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import MenuIcon from '@mui/icons-material/Menu'
import { useState } from 'react'
import { useAppDispatch } from '../store'
import { logout } from '../store/authSlice'

const menu = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Finance', icon: <AccountBalanceIcon />, path: '/finance' },
  { label: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { label: 'Operations', icon: <LocalShippingIcon />, path: '/operations' },
  { label: 'HR', icon: <WorkHistoryIcon />, path: '/hr' },
  { label: 'Users', icon: <PeopleIcon />, path: '/users' }
]

export default function Layout() {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpen(!open)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>ERP System</Typography>
          <Button color="inherit" onClick={() => dispatch(logout())}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open} sx={{ width: open ? 240 : 64, [`& .MuiDrawer-paper`]: { width: open ? 240 : 64, top: 64 } }}>
        <List>
          {menu.map(item => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
