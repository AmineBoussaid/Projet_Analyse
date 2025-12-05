import React, { useState } from 'react';
import axios from 'axios';
import './ClientSearch.css';

export function ClientSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('or');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wordcloud, setWordcloud] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/search', {
        params: { q: query, mode },
        headers: { 'X-Role': 'user', 'Authorization': `Bearer ${token}` }
      });
      setResults(response.data.results);

      // Try to fetch wordcloud
      try {
        const wcResponse = await axios.get('http://localhost:5000/api/wordcloud', {
          headers: { 'X-Role': 'user' }
        });
        setWordcloud(wcResponse.data.path);
      } catch {
        setWordcloud(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-search">
      <div className="search-hero">
        <h1>Recherche dans l'Index</h1>
        <p>Trouvez les documents contenant vos termes de recherche</p>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Entrez un ou plusieurs termes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              🔍 Rechercher
            </button>
          </div>

          <div className="search-options">
            <label className="radio-label">
              <input
                type="radio"
                name="mode"
                value="or"
                checked={mode === 'or'}
                onChange={(e) => setMode(e.target.value)}
              />
              <span>OU (Au moins un terme)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="mode"
                value="and"
                checked={mode === 'and'}
                onChange={(e) => setMode(e.target.value)}
              />
              <span>ET (Tous les termes)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="mode"
                value="exact"
                checked={mode === 'exact'}
                onChange={(e) => setMode(e.target.value)}
              />
              <span>Phrase exacte</span>
            </label>
          </div>
        </form>
      </div>

      {searched && (
        <div className="results-section">
          {loading ? (
            <div className="loading">Recherche en cours...</div>
          ) : results.length === 0 ? (
            <div className="no-results">
              <p>😔 Aucun résultat trouvé</p>
              <small>Essayez d'autres termes ou changez le mode de recherche</small>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h2>Résultats ({results.length} document{results.length > 1 ? 's' : ''})</h2>
              </div>
              <div className="results-list">
                {results.map((result, idx) => (
                  <div key={idx} className="result-item">
                    <h3>📄 {result.file}</h3>
                    <div className="result-meta">
                      <span className="result-count">
                        🎯 {result.count} occurrence{result.count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {wordcloud && (
            <div className="wordcloud-section">
              <h3>Nuage de Mots</h3>
              <img src={wordcloud} alt="Nuage de mots" className="wordcloud-image" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
