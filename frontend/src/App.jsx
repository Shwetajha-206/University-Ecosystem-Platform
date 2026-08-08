import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/LandingNew'
import Login from './pages/Login'
import SuperAdmin from './pages/SuperAdmin'
import StudentLayout from './Layouts/StudentLayout'
import CRLayout from './Layouts/CRLayout'
import VendorLayout from './Layouts/VendorLayout'
import AdminLayout from './Layouts/AdminLayout'
import ProtectedRoute, { PublicOnlyRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { useToast } from './hooks/useToast'
import { ToastContainer } from './components/Toast'

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role}/dashboard`} replace />
}

export default function App() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/superadmin" element={
          <ProtectedRoute roles={['admin']}>
            <SuperAdmin />
          </ProtectedRoute>
        } />

        <Route path="/student/:page?" element={
          <ProtectedRoute roles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        } />
        <Route path="/cr/:page?" element={
          <ProtectedRoute roles={['cr']}>
            <CRLayout />
          </ProtectedRoute>
        } />
        <Route path="/vendor/:page?" element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout />
          </ProtectedRoute>
        } />
        <Route path="/admin/:page?" element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={<RoleRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
