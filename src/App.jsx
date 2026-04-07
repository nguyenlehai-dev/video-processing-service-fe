import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import ApiDocs from './pages/ApiDocs';
import Jobs from './pages/Jobs';
import { useAuthStore } from './store/useAuthStore';
import { apiClient } from './api/client';

export default function App() {
  const { isAuthenticated, setToken, setUser } = useAuthStore();

  useEffect(() => {
    // Optionally fetch user info on mount if authenticated
    if (isAuthenticated) {
      apiClient.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(err => console.error("Session might be expired", err));
    }
  }, [isAuthenticated, setUser]);

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Auth />} />
        
        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/studio" element={isAuthenticated ? <Studio /> : <Navigate to="/login" />} />
        <Route path="/jobs" element={isAuthenticated ? <Jobs /> : <Navigate to="/login" />} />
        <Route path="/api-docs" element={isAuthenticated ? <ApiDocs /> : <Navigate to="/login" />} />
      </Routes>
    </Layout>
  );
}
