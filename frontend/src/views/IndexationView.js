import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";

export default function IndexationView() {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('all_words_and');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);

  React.useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch('/api/documents');
        const docs = await response.json();
        const types = [...new Set(docs.map(d => d.type).filter(Boolean))];
        setAvailableTypes(types);
      } catch (err) {
        console.error("Erreur récupération types:", err);
      }
    };
    fetchTypes();
  }, []);

  const handleSearch = async (q, mode) => {
    setQuery(q);
    setMode(mode || 'all_words_and');
    setLoading(true);
    try {
      const typesParam = selectedTypes.length > 0 ? `&types=${selectedTypes.join(',')}` : '';
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&mode=${mode || 'all_words_and'}${typesParam}`,
        { headers: { 'X-Role': 'user' } }
      );
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Erreur de recherche :", err);
    }
    setLoading(false);
  };

  return (
    <div className="container-fluid" style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ 
        padding: '20px 40px', 
        borderBottom: results.length > 0 ? '1px solid #ebebeb' : 'none'
      }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0" style={{ color: '#4285f4', fontWeight: '400' }}>Projet Analyse</h4>
        </div>
        
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <SearchBar
            onSearch={handleSearch}
            inputValue={query}
            onInputChange={(v) => setQuery(v)}
            modeValue={mode}
            onModeChange={(m) => setMode(m)}
          />
          
          {availableTypes.length > 0 && (
            <div className="mt-3" style={{ fontSize: '0.9rem' }}>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span style={{ color: '#5f6368', fontWeight: '500' }}>Type de document:</span>
                <button
                  className={`btn btn-sm ${selectedTypes.length === 0 ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setSelectedTypes([])}
                  style={{ borderRadius: '20px', fontSize: '0.85rem', padding: '4px 12px' }}
                >
                  Tous
                </button>
                {availableTypes.map(type => (
                  <button
                    key={type}
                    className={`btn btn-sm ${selectedTypes.includes(type) ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      setSelectedTypes(prev => 
                        prev.includes(type) 
                          ? prev.filter(t => t !== type)
                          : [...prev, type]
                      );
                    }}
                    style={{ borderRadius: '20px', fontSize: '0.85rem', padding: '4px 12px' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 60px' }}>
        {loading ? (
          <div className="text-center text-muted mt-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : (
          <SearchResults
            results={results}
            query={query}
            onWordClick={(word) => {
              const newQuery = query ? `${query} ${word}` : word;
              setQuery(newQuery);
              handleSearch(newQuery, mode);
            }}
          />
        )}
      </div>
    </div>
  );
}
