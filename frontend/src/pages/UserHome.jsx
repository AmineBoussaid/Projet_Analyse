import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, BookOpen, Zap } from 'lucide-react';
import './UserHome.css';

export function UserHome() {
  const [query, setQuery] = useState('');
  const [suggestedSearches, setSuggestedSearches] = useState([
    'machine learning',
    'data science',
    'artificial intelligence',
    'python'
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/user/search?q=${encodeURIComponent(query)}`;
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="user-home"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero */}
      <motion.div className="hero" variants={itemVariants}>
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Explorez votre corpus documentaire
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Recherchez et analysez des documents facilement
          </motion.p>
        </div>
      </motion.div>

      {/* Search Box */}
      <motion.form 
        className="search-box"
        variants={itemVariants}
        onSubmit={handleSearch}
      >
        <div className="search-input-wrapper">
          <Search size={24} />
          <input
            type="text"
            placeholder="Entrez votre recherche..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="search-btn"
          >
            Rechercher
          </motion.button>
        </div>
      </motion.form>

      {/* Features */}
      <motion.section className="features" variants={itemVariants}>
        <h2>Nos fonctionnalités</h2>
        <div className="features-grid">
          {[
            {
              icon: Zap,
              title: 'Recherche Rapide',
              desc: 'Trouvez ce dont vous avez besoin en millisecondes'
            },
            {
              icon: TrendingUp,
              title: 'Analyses Avancées',
              desc: 'Découvrez des tendances dans vos documents'
            },
            {
              icon: BookOpen,
              title: 'Métadonnées Enrichies',
              desc: 'Accédez à des informations détaillées sur chaque document'
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                className="feature-card"
                variants={itemVariants}
                whileHover={{ y: -8 }}
              >
                <div className="feature-icon">
                  <Icon size={32} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Suggested Searches */}
      <motion.section className="suggestions" variants={itemVariants}>
        <h3>Recherches populaires</h3>
        <div className="suggestions-list">
          {suggestedSearches.map((search, idx) => (
            <motion.button
              key={idx}
              className="suggestion-tag"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = `/user/search?q=${encodeURIComponent(search)}`}
              variants={itemVariants}
            >
              {search}
            </motion.button>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
