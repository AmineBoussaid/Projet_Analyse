import React, { useState } from "react";
import { getDownloadUrl } from "../api/documentApi";
import { WordCloud } from "@isoterik/react-word-cloud";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function SearchResults({ results = [], query = "", onWordClick = null }) {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 5;

  const indexOfLast = currentPage * resultsPerPage;
  const indexOfFirst = indexOfLast - resultsPerPage;
  const currentResults = results.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(results.length / resultsPerPage);

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
    return wordsArray
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([text, value]) => ({
        text,
        value: Math.max(value * 10, 500),
      }));
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
            Environ {results.length} résultat{results.length > 1 ? 's' : ''}
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
                      const url = getDownloadUrl(item.name);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = item.name;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    {item.name || "Sans nom"}
                  </h5>
                  <div style={{ fontSize: '0.875rem', color: '#70757a', marginBottom: '4px' }}>
                    📅 {item.date_import || '—'} · <strong>Pages:</strong> {item.num_pages ?? '—'} · <strong>Taille:</strong> {typeof item.size === 'number' ? (item.size / (1024*1024)).toFixed(2) + ' Mo' : '—'}
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
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>
                    ☁️ Nuage de mots - Cliquez pour rechercher
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '250px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '10px',
                    background: '#f9f9f9'
                  }}>
                    <WordCloud
                      words={formatWords(item.words)}
                      width={500}
                      height={230}
                      padding={0}
                      enableTooltip={true}
                      onWordClick={(w) => { 
                        if (onWordClick) {
                          onWordClick(w.text || w);
                        }
                      }}
                    />
                  </div>
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
    </div>
  );
}
