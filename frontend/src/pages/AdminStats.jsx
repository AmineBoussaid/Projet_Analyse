import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './AdminStats.css';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          📊
        </motion.div>
        <p style={{ marginTop: '20px', color: '#999' }}>Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="admin-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '8px',
          padding: '20px',
          color: '#c33',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="admin-stats"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="stats-header"
        variants={itemVariants}
        style={{ marginBottom: '40px' }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#333', margin: 0 }}>
          📊 Tableau de bord Analytics
        </h1>
        <p style={{ color: '#999', margin: '8px 0 0 0' }}>
          Vue d'ensemble de vos documents et statistiques
        </p>
      </motion.div>

      {stats && (
        <>
          {/* KPI Cards */}
          <motion.div 
            className="stats-grid"
            variants={containerVariants}
          >
            {[
              {
                icon: '📄',
                label: 'Documents',
                value: stats.total_docs ?? 0,
                color: '#667eea',
                lightColor: '#f0f3ff'
              },
              {
                icon: '🔤',
                label: 'Mots Indexés',
                value: (stats.total_words ?? 0).toLocaleString('fr-FR'),
                color: '#f093fb',
                lightColor: '#fff0f8'
              },
              {
                icon: '💾',
                label: 'Taille Totale',
                value: stats.total_size != null && stats.total_size > 0
                  ? (stats.total_size < 1024 * 1024 
                      ? `${(stats.total_size / 1024).toFixed(2)} Ko` 
                      : `${(stats.total_size / (1024 * 1024)).toFixed(2)} Mo`)
                  : '0 Mo',
                color: '#764ba2',
                lightColor: '#faf0ff'
              },
              {
                icon: '⏱️',
                label: 'Dernier Import',
                value: stats.last_import && stats.last_import !== 'N/A' && stats.last_import !== 'Aucun'
                  ? (stats.last_import.includes('-') ? new Date(stats.last_import).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : stats.last_import)
                  : 'N/A',
                color: '#f5576c',
                lightColor: '#ffe0e6'
              }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="kpi-card"
                style={{
                  background: `linear-gradient(135deg, ${card.lightColor} 0%, white 100%)`,
                  border: `2px solid ${card.color}33`,
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer'
                }}
                whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                  {card.icon}
                </div>
                <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px 0' }}>
                  {card.label}
                </p>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700',
                  color: card.color
                }}>
                  {card.value}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Section */}
          <motion.div 
            className="charts-section"
            variants={containerVariants}
            style={{ marginTop: '40px' }}
          >
            {/* Files by Type - Bar Chart */}
            <motion.div
              variants={itemVariants}
              className="chart-card"
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #f0f0f0'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: 0 }}>
                📁 Distribution par type de fichier
              </h3>
              <Bar
                data={{
                  labels: Object.keys(stats.by_type).map(t => t.toUpperCase()),
                  datasets: [{
                    label: 'Nombre de fichiers',
                    data: Object.values(stats.by_type),
                    backgroundColor: [
                      '#667eea',
                      '#764ba2',
                      '#f093fb',
                      '#f5576c',
                      '#fa9b10'
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      titleFont: { size: 13 },
                      bodyFont: { size: 12 },
                      padding: 12,
                      borderRadius: 8,
                      displayColors: true,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { color: '#999' },
                      grid: { color: '#f0f0f0' }
                    },
                    x: {
                      ticks: { color: '#999' },
                      grid: { display: false }
                    }
                  }
                }}
              />
            </motion.div>

            {/* Files by Date - Line Chart */}
            <motion.div
              variants={itemVariants}
              className="chart-card"
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #f0f0f0'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: 0 }}>
                📈 Chronologie des imports
              </h3>
              <Line
                data={{
                  labels: stats.by_date ? stats.by_date.labels : [],
                  datasets: [{
                    label: 'Fichiers importés',
                    data: stats.by_date ? stats.by_date.data : [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102,126,234,0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      titleFont: { size: 13 },
                      bodyFont: { size: 12 },
                      padding: 12,
                      borderRadius: 8,
                      displayColors: true,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { color: '#999' },
                      grid: { color: '#f0f0f0' }
                    },
                    x: {
                      ticks: { color: '#999' },
                      grid: { color: '#f0f0f0' }
                    }
                  }
                }}
              />
            </motion.div>

            {/* Files Distribution - Doughnut Chart */}
            {Object.keys(stats.by_type).length > 0 && (
              <motion.div
                variants={itemVariants}
                className="chart-card"
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  border: '1px solid #f0f0f0',
                  maxWidth: '400px',
                  margin: '0 auto'
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginTop: 0 }}>
                  🎯 Composition des documents
                </h3>
                <Doughnut
                  data={{
                    labels: Object.keys(stats.by_type).map(t => t.toUpperCase()),
                    datasets: [{
                      data: Object.values(stats.by_type),
                      backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#fa9b10'
                      ],
                      borderColor: 'white',
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#666',
                          font: { size: 12 },
                          padding: 15
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 },
                        padding: 12,
                        borderRadius: 8,
                      }
                    }
                  }}
                />
              </motion.div>
            )}
          </motion.div>

          {/* Refresh Button */}
          <motion.div 
            style={{ textAlign: 'center', marginTop: '40px' }}
            variants={itemVariants}
          >
            <motion.button 
              onClick={fetchStats}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(102,126,234,0.3)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              🔄 Actualiser les données
            </motion.button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
