import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [hoveredRole, setHoveredRole] = useState(null);

  const handleLogin = (role) => {
    // Connexion logique sans vérification backend
    setLoading(true);
    
    // Simuler un léger délai pour l'UX
    setTimeout(() => {
      localStorage.setItem('userRole', role);
      localStorage.setItem('token', `fake-token-${role}-${Date.now()}`);
      onLoginSuccess(role);
      setLoading(false);
    }, 500);
  };

  return (
    <div 
      className="login-container" 
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {/* Floating background elements */}
      <div className="floating-bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div 
          style={{ 
            position: 'absolute', 
            width: '300px', 
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            top: '-50px',
            left: '-50px'
          }}
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          style={{ 
            position: 'absolute', 
            width: '200px', 
            height: '200px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            bottom: '-50px',
            right: '-50px'
          }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <motion.div 
        className="login-box"
        style={{ 
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '60px 40px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative',
          zIndex: 10
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: '48px', marginBottom: '16px' }}
          >
            📊
          </motion.div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#333',
            marginBottom: '8px',
            fontFamily: "'Poppins', sans-serif"
          }}>
            Analyse Textuelle
          </h1>
          <p style={{ 
            fontSize: '14px',
            color: '#999',
            marginBottom: 0
          }}>
            Plateforme d'indexation et d'analyse de documents
          </p>
        </div>

        {/* Role Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px' }}>
          {/* Admin Card */}
          <motion.button
            onClick={() => handleLogin('admin')}
            onHoverStart={() => setHoveredRole('admin')}
            onHoverEnd={() => setHoveredRole(null)}
            disabled={loading}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: hoveredRole === 'admin' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
              border: hoveredRole === 'admin' ? 'none' : '2px solid #e0e0e0',
              borderRadius: '16px',
              padding: '28px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              color: hoveredRole === 'admin' ? '#fff' : '#333'
            }}
          >
            <div style={{ marginBottom: '12px', fontSize: '32px' }}>👤</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '8px 0' }}>
              Administrateur
            </h3>
            <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>
              Gérer & Analyser
            </p>
          </motion.button>

          {/* User Card */}
          <motion.button
            onClick={() => handleLogin('user')}
            onHoverStart={() => setHoveredRole('user')}
            onHoverEnd={() => setHoveredRole(null)}
            disabled={loading}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: hoveredRole === 'user' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#f8f9fa',
              border: hoveredRole === 'user' ? 'none' : '2px solid #e0e0e0',
              borderRadius: '16px',
              padding: '28px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              color: hoveredRole === 'user' ? '#fff' : '#333'
            }}
          >
            <div style={{ marginBottom: '12px', fontSize: '32px' }}>🔍</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '8px 0' }}>
              Utilisateur
            </h3>
            <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>
              Rechercher & Explorer
            </p>
          </motion.button>
        </div>

        {/* Loading State */}
        {loading && (
          <motion.div
            style={{ marginTop: '30px', textAlign: 'center', color: '#667eea' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Connexion en cours...</span>
            </div>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>Connexion en cours...</p>
          </motion.div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
            Plateforme v1.0 | Indexation & Analyse NLP
          </p>
        </div>
      </motion.div>
    </div>
  );
}
