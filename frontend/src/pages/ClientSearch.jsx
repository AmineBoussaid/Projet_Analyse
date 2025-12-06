import React, { useState } from 'react';
import axios from 'axios';
import './ClientSearch.css';
import { Modal } from '../components/Modal';
import { WordCloud } from '@isoterik/react-word-cloud';

export function ClientSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('or');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wordcloud, setWordcloud] = useState(null);
  const [isWordCloudOpen, setIsWordCloudOpen] = useState(false);

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
      // Backend returns {results: {filename: {...}}, suggestions: []}
      // Convert object to array of entries for rendering
      const resultsArray = response.data.results ? Object.entries(response.data.results).map(([filename, data]) => ({ filename, ...data })) : [];
      setResults(resultsArray);

      // Get wordcloud data (top words)
      try {
        const wcResponse = await axios.get('http://localhost:5000/api/wordcloud', {
          headers: { 'X-Role': 'user' }
        });
        // Convertir le dict en array de [word, count]
        const wordcloudData = Object.entries(wcResponse.data || {});
        setWordcloud(wordcloudData);
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
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Professional Search Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '10px', textAlign: 'center' }}>
            🔍 Recherche de Documents
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: '30px' }}>
            Explorez votre collection de documents indexés
          </p>

          <form onSubmit={handleSearch}>
            {/* Professional Search Bar */}
            <div style={{
              display: 'flex',
              gap: '10px',
              background: 'white',
              borderRadius: '50px',
              padding: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              <input
                type="text"
                placeholder="Rechercher des documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '12px 24px',
                  fontSize: '16px',
                  borderRadius: '50px',
                  background: 'transparent'
                }}
              />
              <button 
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                Rechercher
              </button>
            </div>

            {/* Search Mode Options */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '20px',
              flexWrap: 'wrap'
            }}>
              {[
                { value: 'or', icon: '🔍', label: 'Au moins un mot' },
                { value: 'all_words_and', icon: '🎯', label: 'Tous les mots' },
                { value: 'exact', icon: '📝', label: 'Phrase exacte' }
              ].map(option => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: mode === option.value ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: mode === option.value ? '2px solid white' : '2px solid transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={(e) => setMode(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span>{option.icon} {option.label}</span>
                </label>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      {searched && (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#667eea', fontSize: '18px' }}>
              <div className="spinner-border" role="status"></div>
              <p>Recherche en cours...</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>😔</div>
              <p style={{ fontSize: '20px', color: '#666' }}>Aucun résultat trouvé</p>
              <p style={{ color: '#999' }}>Essayez d'autres termes ou changez le mode de recherche</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
                Environ {results.length} résultat{results.length > 1 ? 's' : ''}
              </div>
              {results.map((result, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    color: '#1a0dab',
                    marginBottom: '8px',
                    fontWeight: '400',
                    cursor: 'pointer'
                  }}>
                    {result.filename || result.file}
                  </h3>
                  <p style={{
                    color: '#545454',
                    lineHeight: '1.6',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    {(result.context || '').substring(0, 300)}...
                  </p>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#e8f0fe',
                      color: '#1967d2',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      🎯 {result.count} occurrence{result.count > 1 ? 's' : ''}
                    </span>
                    {result.date_import && (
                      <span style={{ color: '#70757a', fontSize: '13px' }}>
                        📅 {result.date_import}
                      </span>
                    )}
                    {result.type && (
                      <span style={{ color: '#70757a', fontSize: '13px' }}>
                        Type: {result.type}
                      </span>
                    )}
                    {result.total_tokens_after && (
                      <span style={{ color: '#70757a', fontSize: '13px' }}>
                        Tokens: {result.total_tokens_after}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Bouton Nuage de Mots */}
          {results.length > 0 && wordcloud && wordcloud.length > 0 && (
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button
                onClick={() => setIsWordCloudOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                ☁️ Voir le nuage de mots
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Nuage de Mots */}
      {isWordCloudOpen && wordcloud && (
        <Modal 
          isOpen={isWordCloudOpen} 
          onClose={() => setIsWordCloudOpen(false)}
          title="☁️ Nuage de Mots"
          width="900px"
        >
          <div style={{ 
            width: '100%', 
            height: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <WordCloud
              words={wordcloud.slice(0, 100).map(([text, value]) => ({ text, value: value * 10 }))}
              width={800}
              height={460}
              padding={3}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
