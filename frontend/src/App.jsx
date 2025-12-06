import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { AdminImport } from './pages/AdminImport';
import { AdminManage } from './pages/AdminManage';
import { AdminStats } from './pages/AdminStats';
import IndexationView from './views/IndexationView';
import { DocumentDetail } from './pages/DocumentDetail';
import './App.css';

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userRole) => {
    setRole(userRole);
    setSidebarOpen(true);
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <Router>
      {!role ? (
        <Routes>
          <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <div className="app-layout">
          <Sidebar role={role} onLogout={handleLogout} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          <Header role={role} />
          <main className="main-content">
            <Routes>
              {/* Admin Routes */}
              {role === 'admin' && (
                <>
                  <Route path="/admin/import" element={<AdminImport />} />
                  <Route path="/admin/manage" element={<AdminManage />} />
                  <Route path="/admin/stats" element={<AdminStats />} />
                  <Route path="/admin/document/:filename" element={<DocumentDetail />} />
                  <Route path="/admin" element={<Navigate to="/admin/import" />} />
                </>
              )}

              {/* User Routes */}
              {role === 'user' && (
                <>
                  <Route path="/user/search" element={<IndexationView />} />
                  <Route path="/user" element={<Navigate to="/user/search" />} />
                </>
              )}

              <Route path="*" element={<Navigate to={role === 'admin' ? '/admin' : '/user'} />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
}

export default App;
