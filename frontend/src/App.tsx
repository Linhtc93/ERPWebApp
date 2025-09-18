import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppSelector } from './store'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import Inventory from './pages/Inventory'
import Users from './pages/Users'
import Operations from './pages/Operations'
import HR from './pages/HR'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = useAppSelector(s => s.auth.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="finance" element={<Finance />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="operations" element={<Operations />} />
        <Route path="hr" element={<HR />} />
        <Route path="users" element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
