import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchVisualisation, fetchImportStats } from "../api/documentApi";
import StatsPanel from "../components/StatsPanel";
import RelationsGraph from "../components/RelationsGraph";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function VisualisationView() {
  const [visualData, setVisualData] = useState(null);
  const [importStats, setImportStats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVisualisation()
      .then((d) => setVisualData(d))
      .catch((err) => setError(err.message));

    fetchImportStats()
      .then((stats) => setImportStats(stats))
      .catch((err) => console.error("Erreur import stats:", err));
  }, []);

  if (error)
    return (
      <div className="container py-5 text-center">
        <div style={{ fontSize: '3rem', color: '#ef4444' }}>⚠️</div>
        <p className="text-danger mt-3">Erreur : {error}</p>
      </div>
    );

  if (!visualData)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="text-muted mt-3">Chargement des visualisations...</p>
      </div>
    );

  return (
    <div className="container-fluid" style={{ background: '#f0f2f5', minHeight: '100vh', padding: '2rem' }}>
      <motion.div 
        className="mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-1" style={{ fontSize: '2rem', fontWeight: '600', color: '#333' }}>
          📊 Tableau de Bord Analytique
        </h2>
        <p className="text-muted" style={{ fontSize: '1rem' }}>
          Vue d'ensemble des documents et de leurs métadonnées.
        </p>
      </motion.div>

      <div className="row g-4">
        <div className="col-12">
          <motion.div 
            className="card border-0 shadow-sm" 
            style={{ borderRadius: '12px' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="card-body p-4">
              <StatsPanel stats={visualData} />
            </div>
          </motion.div>
        </div>

        <div className="col-12">
          <motion.div 
            className="card border-0 shadow-sm" 
            style={{ borderRadius: '12px' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="card-header bg-white border-0 pt-3 px-4">
              <h5 className="mb-0" style={{ fontWeight: '600' }}>Imports par Date</h5>
            </div>
            <div className="card-body p-3">
              {importStats && importStats.length > 0 ? (
                <RelationsGraph relations={importStats} />
              ) : (
                <div className="text-center py-5 text-muted">
                  <p>Aucune donnée d'import à afficher.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>


    </div>
  );
}
