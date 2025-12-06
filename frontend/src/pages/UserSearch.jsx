import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, FileText, Calendar } from 'lucide-react';
import './UserSearch.css';

export function UserSearch() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/search', {
        params: { q: searchTerm },
        headers: { 'X-Role': 'user', 'Authorization': `Bearer ${token}` }
      });
      // Backend returns {results: {filename: {...}}, suggestions: []}
      // Convert object to array of entries for rendering
      const resultsArray = response.data.results ? Object.entries(response.data.results).map(([filename, data]) => ({ filename, ...data })) : [];
      setResults(resultsArray);
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="user-search"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Search Bar */}
      <motion.form 
        className="search-form"
        variants={itemVariants}
        onSubmit={handleSearch}
      >
        <div className="search-wrapper">
          <Search size={24} />
          <input
            type="text"
            placeholder="Rechercher des documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="search-submit"
          >
            Rechercher
          </motion.button>
        </div>
      </motion.form>

      {/* Results Info */}
      {!loading && results.length > 0 && (
        <motion.div className="results-info" variants={itemVariants}>
          <p>
            <strong>{results.length}</strong> résultat(s) trouvé(s) pour <strong>"{query}"</strong>
          </p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div className="error-message" variants={itemVariants}>
          ⚠️ {error}
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <motion.div className="loading" variants={itemVariants}>
          <div className="spinner"></div>
          <p>Recherche en cours...</p>
        </motion.div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <motion.div 
          className="results-list"
          variants={containerVariants}
        >
          {results.map((result, idx) => (
            <motion.div
              key={idx}
              className="result-item"
              variants={itemVariants}
              whileHover={{ x: 5 }}
            >
              <div className="result-icon">
                <FileText size={24} />
              </div>
              <div className="result-content">
                <h3 className="result-title">{result.filename}</h3>
                <p className="result-text">
                  {result.preview || result.text?.substring(0, 150) + '...'}
                </p>
                <div className="result-meta">
                  <span className="result-type">{result.type || 'Document'}</span>
                  {result.imported_at && (
                    <span className="result-date">
                      <Calendar size={14} />
                      {new Date(result.imported_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              <motion.button
                className="result-action"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Voir →
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <motion.div className="no-results" variants={itemVariants}>
          <div className="no-results-icon">🔍</div>
          <h2>Aucun résultat</h2>
          <p>Nous n'avons trouvé aucun document correspondant à "{query}"</p>
          <p className="suggestion">Essayez d'autres mots-clés ou consultez la page d'accueil</p>
        </motion.div>
      )}

      {/* Initial State */}
      {!loading && results.length === 0 && !query && (
        <motion.div className="initial-state" variants={itemVariants}>
          <div className="initial-icon">📝</div>
          <h2>Commencez votre recherche</h2>
          <p>Entrez des mots-clés pour explorer le corpus documentaire</p>
        </motion.div>
      )}
    </motion.div>
  );
}
