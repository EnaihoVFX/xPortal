import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Homepage from './pages/Homepage'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import CreateMarket from './pages/CreateMarket'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Demo from './pages/Demo'
import DemoPublic from './pages/DemoPublic'
import DemoJoin from './pages/DemoJoin'
import AgenticTrading from './pages/AgenticTrading'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      Loading...
    </div>
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/demo/public" element={<DemoPublic />} />
      <Route path="/demo/join" element={<DemoJoin />} />
      <Route path="/demo/join/public" element={<DemoJoin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/markets" 
        element={
          <ProtectedRoute>
            <Markets />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-market" 
        element={
          <ProtectedRoute>
            <CreateMarket />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/agentic" 
        element={<AgenticTrading />} 
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

