import React, { useState } from "react";
import { getDownloadUrl } from "../api/documentApi";
import { WordCloud } from "@isoterik/react-word-cloud";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from "./Modal";

export default function SearchResults({ results = [], query = "", onWordClick = null }) {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 5;
  const [selectedWordCloud, setSelectedWordCloud] = useState(null);

  // Ensure results is an array
  const resultsArray = Array.isArray(results) ? results : (typeof results === 'object' && results !== null ? Object.entries(results).map(([filename, data]) => ({ filename, ...data })) : []);

  const indexOfLast = currentPage * resultsPerPage;
  const indexOfFirst = indexOfLast - resultsPerPage;
  const currentResults = resultsArray.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(resultsArray.length / resultsPerPage);

  const extractSnippet = (text = "", query, windowSize = 40) => {
    const words = text.split(/\s+/);
    const idx = words.findIndex(w => w.toLowerCase().includes(query.toLowerCase()));

    if (idx === -1) return words.slice(0, 50).join(" ") + "...";

    const start = Math.max(0, idx - windowSize);
    const end = Math.min(words.length, idx + windowSize + 1);
    return words.slice(start, end).join(" ") + "...";
  };

  const highlightText = (text = "", word) => {
    if (!word) return text;
    const regex = new RegExp(`(${word})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === word.toLowerCase() ? (
        <span key={i} className="bg-warning fw-bold">
          {part}
        </span>
      ) : part
    );
  };

  const formatWords = (wordsArray = []) => {
    if (!wordsArray || wordsArray.length === 0) return [];
    
    // Trier par fréquence décroissante
    const sorted = [...wordsArray].sort((a, b) => b[1] - a[1]);
    
    // Prendre les 100 premiers
    const topWords = sorted.slice(0, 100);
    
    // Trouver la valeur max pour normaliser
    const maxValue = topWords[0]?.[1] || 1;
    const minValue = topWords[topWords.length - 1]?.[1] || 1;
    
    // Mapper avec une échelle logarithmique pour plus de contraste
    return topWords.map(([text, value]) => {
      // Normaliser entre 0 et 1
      const normalized = (value - minValue) / (maxValue - minValue + 1);
      // Appliquer une échelle exponentielle pour accentuer les différences
      const scaledValue = Math.pow(normalized, 0.6) * 100 + 10;
      
      return {
        text,
        value: scaledValue
      };
    });
  };

  return (
    <div className="mt-3">
      {currentResults.length === 0 ? (
        <div className="text-center text-muted py-5">
          <div style={{fontSize: '2rem', color: '#9aa0a6'}}>�</div>
          <p style={{ color: '#70757a', fontSize: '0.95rem' }}>Aucun résultat trouvé</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.875rem', color: '#70757a', marginBottom: '20px' }}>
            Environ {resultsArray.length} résultat{resultsArray.length > 1 ? 's' : ''}
          </div>
          {currentResults.map((item, idx) => (
            <div key={idx} className="mb-4" style={{ 
              borderBottom: '1px solid #ebebeb', 
              paddingBottom: '20px'
            }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div style={{ flex: 1 }}>
                  <h5
                    className="mb-1"
                    style={{ 
                      cursor: "pointer", 
                      fontSize: "20px",
                      color: '#1a0dab',
                      fontWeight: '400'
                    }}
                    onClick={() => {
                      const url = getDownloadUrl(item.filename || item.name);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = item.filename || item.name;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    {item.filename || item.name || "Sans nom"}
                  </h5>
                  <div style={{ fontSize: '0.875rem', color: '#70757a', marginBottom: '4px' }}>
                    📅 {item.date_import || '—'} · <strong>Type:</strong> {item.type || '—'} · <strong>Tokens:</strong> {item.total_tokens_after || 0}
                  </div>
                </div>
              </div>

              <p style={{ 
                fontSize: "14px", 
                lineHeight: "1.58", 
                color: '#4d5156',
                marginBottom: '1rem'
              }}>
                {highlightText(extractSnippet(item.context, query), query)}
              </p>

              {item.words && item.words.length > 0 && (
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setSelectedWordCloud(item)}
                    style={{ borderRadius: '20px', fontSize: '0.85rem', padding: '6px 16px' }}
                  >
                    ☁️ Voir le nuage de mots
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            title="Page précédente"
            style={{
              border: 'none',
              background: 'transparent',
              color: currentPage === 1 ? '#ccc' : '#1a0dab',
              fontSize: '1.1rem',
              padding: '8px 12px',
              cursor: currentPage === 1 ? 'default' : 'pointer'
            }}
          >
            ◀
          </button>
          
          <div className="d-flex align-items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => {
                return p === 1 || 
                       p === totalPages || 
                       (p >= currentPage - 2 && p <= currentPage + 2);
              })
              .map((pageNum, idx, arr) => {
                const prevNum = arr[idx - 1];
                const showEllipsis = prevNum && pageNum - prevNum > 1;
                
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && (
                      <span style={{ color: '#70757a', padding: '0 4px' }}>...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        border: 'none',
                        background: pageNum === currentPage ? '#4285f4' : 'transparent',
                        color: pageNum === currentPage ? 'white' : '#4285f4',
                        fontSize: '0.9rem',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: pageNum === currentPage ? '600' : '400',
                        minWidth: '36px'
                      }}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            title="Page suivante"
            style={{
              border: 'none',
              background: 'transparent',
              color: currentPage === totalPages ? '#ccc' : '#1a0dab',
              fontSize: '1.1rem',
              padding: '8px 12px',
              cursor: currentPage === totalPages ? 'default' : 'pointer'
            }}
          >
            ▶
          </button>
        </div>
      )}

      {selectedWordCloud && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedWordCloud(null)}
          title={`Nuage de mots - ${selectedWordCloud.filename || selectedWordCloud.name || 'Document'}`}
          width="900px"
        >
          <div>
            <p style={{ marginBottom: '16px', color: '#666', fontSize: '0.9rem' }}>
              💡 <strong>Astuce:</strong> Cliquez sur un mot pour l'ajouter à votre recherche. La fenêtre reste ouverte pour sélectionner plusieurs mots.
            </p>
            <div style={{ 
              width: '100%', 
              height: '500px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '2px solid #e0e0e0',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <WordCloud
                words={formatWords(selectedWordCloud.words)}
                width={800}
                height={460}
                padding={3}
              />
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedWordCloud(null)}
                style={{ borderRadius: '20px', fontSize: '0.9rem', padding: '8px 24px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
