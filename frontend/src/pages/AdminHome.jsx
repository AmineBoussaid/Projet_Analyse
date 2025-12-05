import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, FileText, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import './AdminHome.css';

export function AdminHome() {
  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, filesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', {
          headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/files?limit=5', {
          headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` }
        })
      ]);
      setStats(statsRes.data);
      setRecentFiles(filesRes.data.slice(0, 5));
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="admin-home"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="hero-section">
        <div className="hero-content">
          <h1>Bienvenue dans votre tableau de bord</h1>
          <p>Gérez vos documents et analysez vos données en un seul endroit</p>
        </div>
        <motion.button 
          className="hero-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Upload size={20} />
          <span>Importer des documents</span>
        </motion.button>
      </motion.section>

      {/* Quick Stats */}
      {stats && (
        <motion.section variants={itemVariants} className="stats-section">
          <h2>Vue d'ensemble</h2>
          <div className="stats-grid">
            {[
              { icon: FileText, label: 'Documents', value: stats.total_docs, color: '#667eea' },
              { icon: BarChart3, label: 'Mots indexés', value: stats.total_words, color: '#764ba2' },
              { icon: TrendingUp, label: 'Taille totale', value: `${(stats.total_size / 1024 / 1024).toFixed(2)} MB`, color: '#f093fb' },
              { icon: Calendar, label: 'Dernier import', value: stats.last_import ? new Date(stats.last_import).toLocaleDateString('fr-FR') : 'Aucun', color: '#f5576c' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={idx}
                  className="stat-card"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                    <Icon size={28} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">{stat.label}</p>
                    <h3 className="stat-value">{stat.value}</h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Recent Files */}
      <motion.section variants={itemVariants} className="recent-section">
        <h2>Documents récents</h2>
        {recentFiles.length > 0 ? (
          <div className="files-preview">
            {recentFiles.map((file, idx) => (
              <motion.div
                key={idx}
                className="file-preview-card"
                variants={itemVariants}
                whileHover={{ x: 5 }}
              >
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <h4>{file.filename}</h4>
                  <p>{(file.size / 1024).toFixed(2)} KB • {file.type || 'Unknown'}</p>
                </div>
                <time>{file.imported_at ? new Date(file.imported_at).toLocaleDateString('fr-FR') : '-'}</time>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="no-files">
            <p>Aucun document importé</p>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
