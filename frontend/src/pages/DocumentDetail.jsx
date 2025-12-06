import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import './DocumentDetail.css';
import { showToast } from '../utils/toast';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function DocumentDetail() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/admin/file_detail',
          {
            params: { filename: decodeURIComponent(filename) },
            headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` }
          }
        );
        setDoc(response.data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement du document');
        console.error(err);
        showToast('Impossible de charger le document', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (filename) {
      fetchDocument();
    }
  }, [filename]);

  if (loading) {
    return (
      <div className="document-detail">
        <div className="loading">Chargement du document...</div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="document-detail">
        <div className="error-message">
          {error || 'Document non trouvé'}
        </div>
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Retour
        </button>
      </div>
    );
  }

  const chartData = {
    labels: doc.top_lemmas.map(([word]) => word.substring(0, 15)),
    datasets: [
      {
        label: 'Fréquence',
        data: doc.top_lemmas.map(([, count]) => count),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 30 Lemmes les plus fréquents',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const formatDate = (isoDate) => {
    try {
      return new Date(isoDate).toLocaleString('fr-FR');
    } catch {
      return isoDate;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  return (
    <motion.div
      className="document-detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Retour
        </button>
        <h1>📄 {doc.filename}</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          Aperçu
        </button>
        <button
          className={`tab-btn ${tab === 'lemmas' ? 'active' : ''}`}
          onClick={() => setTab('lemmas')}
        >
          Lemmes
        </button>
        <button
          className={`tab-btn ${tab === 'text' ? 'active' : ''}`}
          onClick={() => setTab('text')}
        >
          Texte nettoyé
        </button>
      </div>

      <div className="tab-content">
        {tab === 'overview' && (
          <motion.div
            className="tab-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="info-grid">
              <div className="info-card">
                <div className="info-label">Nom du fichier</div>
                <div className="info-value">{doc.filename}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Type</div>
                <div className="info-value">{doc.type?.toUpperCase()}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Taille</div>
                <div className="info-value">{formatFileSize(doc.size)}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Pages</div>
                <div className="info-value">{doc.pages}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Mots indexés</div>
                <div className="info-value">{doc.word_count?.toLocaleString('fr-FR')}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Caractères</div>
                <div className="info-value">{doc.characters?.toLocaleString('fr-FR')}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Mots supprimés</div>
                <div className="info-value">{doc.removed?.toLocaleString('fr-FR')}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Date d'import</div>
                <div className="info-value">{formatDate(doc.imported_at)}</div>
              </div>

              <div className="info-card full-width">
                <div className="info-label">Chemin</div>
                <div className="info-value path">{doc.path}</div>
              </div>
            </div>

            <div className="stats-summary">
              <div className="stat-item">
                <div className="stat-value">{Object.keys(doc.lemmas).length.toLocaleString('fr-FR')}</div>
                <div className="stat-label">Mots uniques</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {(doc.characters / (doc.word_count || 1)).toFixed(1)}
                </div>
                <div className="stat-label">Caractères/mot</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {((doc.removed / (doc.removed + doc.word_count)) * 100).toFixed(1)}%
                </div>
                <div className="stat-label">Mots filtrés</div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'lemmas' && (
          <motion.div
            className="tab-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="chart-container">
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="lemmas-table">
              <h3>Tous les lemmes ({Object.keys(doc.lemmas).length})</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Lemme</th>
                      <th>Fréquence</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(doc.lemmas)
                      .sort((a, b) => b[1] - a[1])
                      .map(([lemma, count]) => (
                        <tr key={lemma}>
                          <td className="lemma">{lemma}</td>
                          <td className="count">{count}</td>
                          <td className="percent">
                            {((count / doc.word_count) * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'text' && (
          <motion.div
            className="tab-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-preview">
              <h3>Texte nettoyé et lemmatisé</h3>
              <div className="text-content">
                {doc.cleaned_text ? (
                  <pre>{doc.cleaned_text}</pre>
                ) : (
                  <p className="no-text">Pas de texte disponible</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
