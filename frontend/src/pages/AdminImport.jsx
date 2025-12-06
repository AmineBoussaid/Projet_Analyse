import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { uploadFiles, fetchDocuments, deleteDocuments } from '../api/documentApi';
import './AdminImport.css';
import { Modal } from '../components/Modal';
import { showToast } from '../utils/toast';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function AdminImport() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(['txt', 'pdf', 'docx', 'html', 'htm']);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [error, setError] = useState(null);

  // Charger la liste des documents au démarrage
  React.useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await fetchDocuments();
        setUploadedDocs(docs);
      } catch (err) {
        console.error('Erreur chargement documents:', err);
      }
    };
    loadDocs();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const dirInputRef = useRef(null);
  const handleDirChange = (e) => {
    // webkitRelativePath preserves folder structure
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);
    setUploadedDocs([]);

    try {
      // Ensure role is stored for headers helper
      localStorage.setItem('userRole', 'admin');

      const response = await uploadFiles(selectedFiles);
      setResult(response);

      // Attendre un peu pour que le backend finisse de traiter
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh document list to show imported docs
      const docs = await fetchDocuments();
      setUploadedDocs(docs);

      setSelectedFiles([]);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      showToast('Traitement terminé', 'success');
    } catch (err) {
      setError(err?.message || err?.response?.data?.error || 'Erreur lors du traitement');
      console.error(err);
      showToast('Erreur lors du traitement', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const [modalData, setModalData] = useState(null);
  const openFileStats = (filename) => {
    // Naviguer vers la page de stats avec le nom du fichier
    navigate(`/admin/stats?file=${encodeURIComponent(filename)}`);
  };

  const openFileView = (filename) => {
    // Ouvrir le document dans un nouvel onglet
    const viewUrl = `http://localhost:5000/api/admin/view?filename=${encodeURIComponent(filename)}`;
    window.open(viewUrl, '_blank');
  };

  const removeUploaded = async (name) => {
    try{
      await deleteDocuments([name]);
      setUploadedDocs(prev => prev.filter(f => (f.filename || f.name) !== name));
      showToast('Fichier supprimé', 'success');
    }catch(err){
      showToast('Suppression impossible', 'error');
    }
  };

  const removeAll = async () => {
    if (!uploadedDocs.length) return;
    try {
      await deleteDocuments(uploadedDocs.map(f => f.filename || f.name));
      setUploadedDocs([]);
      showToast('Tous les fichiers ont été supprimés', 'success');
    } catch (err) {
      showToast('Suppression impossible', 'error');
    }
  };

  return (
    <div className="admin-import">
      {processing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '8px solid #f3f3f3',
            borderTop: '8px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>
            📥 Importation en cours...
            <div style={{ fontSize: '1rem', marginTop: '10px', opacity: 0.8 }}>
              Traitement de {selectedFiles.length} fichier(s)
            </div>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      <h2>Importer et Traiter des Fichiers</h2>
      
      <form onSubmit={handleSubmit} className="import-form">
        <div className="form-section">
          <div className="file-actions-row">
            <label htmlFor="file-input" className="file-label">
              <span className="file-icon">📁</span>
              <span className="file-text">Sélectionner des fichiers</span>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={handleFileChange}
                className="file-input"
              />
            </label>

            <label className="file-label folder-label">
              <span className="file-icon">📂</span>
              <span className="file-text">Importer un dossier</span>
              <input
                ref={dirInputRef}
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleDirChange}
                className="file-input"
              />
            </label>
          </div>
          {selectedFiles.length > 0 && (
            <div className="file-list">
              <h4>📁 Fichiers sélectionnés: <span style={{color: '#667eea', fontWeight: 'bold'}}>{selectedFiles.length}</span></h4>
            </div>
          )}
        </div>

        <div className="form-section">
          <label>Types de fichiers à traiter:</label>
          <div className="type-checkboxes">
            {['txt', 'pdf', 'docx', 'html', 'htm'].map(type => (
              <label key={type} className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                />
                <span>.{type.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={processing} className="submit-btn">
          {processing ? 'Traitement en cours...' : 'Démarrer le traitement'}
        </button>
      </form>

      {result && (
        <div className="result-section">
          <h3>✅ Traitement Réussi</h3>
          
          {/* Résumé */}
          {result.summary && (
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0369a1' }}>Résumé du traitement:</div>
              <div>✅ Nouveaux: {result.summary.new || 0}</div>
              <div>🔄 Mis à jour: {result.summary.updated || 0}</div>
            </div>
          )}
          
          {/* Liste des documents importés */}
          <div className="files-results">
            <h4>Documents importés ({Object.keys(result.results || {}).length})</h4>
            <div className="files-list-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {Object.entries(result.results || {}).map(([filename, data]) => {
                const sizeInMo = data.size ? (data.size / (1024 * 1024)).toFixed(2) : '0.00';
                return (
                  <div key={filename} className="file-card-item" style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '600', fontSize: '1.05em', color: '#1f2937', wordBreak: 'break-word', flex: 1 }}>
                        📄 {filename}
                      </div>
                      {data.status && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75em',
                          fontWeight: 'bold',
                          background: data.status === 'new' ? '#d1fae5' : '#fef3c7',
                          color: data.status === 'new' ? '#065f46' : '#92400e',
                          marginLeft: '8px'
                        }}>
                          {data.status === 'new' ? 'NOUVEAU' : 'MÀJ'}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '0.9em', color: '#6b7280', display: 'grid', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Type:</strong></span>
                        <span>{data.type || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Taille:</strong></span>
                        <span>{sizeInMo} Mo</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Pages:</strong></span>
                        <span>{data.num_pages || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Tokens:</strong></span>
                        <span>{data.total_tokens_after || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Date:</strong></span>
                        <span>{data.date_import || '—'}</span>
                      </div>
                      {data.corpus_relpath && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginTop: '4px' }}>
                          <span><strong>Chemin:</strong></span>
                          <span style={{ textAlign: 'right', wordBreak: 'break-all', maxWidth: '60%' }} title={data.corpus_relpath}>
                            {data.corpus_relpath.length > 30 ? `...${data.corpus_relpath.slice(-27)}` : data.corpus_relpath}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        className="stats-btn" 
                        onClick={() => openFileStats(filename)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85em',
                          fontWeight: '500'
                        }}
                      >
                        📈 Statistiques
                      </button>
                      <button 
                        className="stats-btn" 
                        onClick={() => openFileView(filename)}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85em',
                          fontWeight: '500'
                        }}
                      >
                        👁️ Voir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Liste permanente des documents */}
      {!result && uploadedDocs.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>📚 Documents existants ({uploadedDocs.length})</h3>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '12px',
            maxHeight: '500px',
            maxWidth: '100%',
            width: '100%',
            overflow: 'auto',
            padding: '10px',
            boxSizing: 'border-box'
          }}>
            {uploadedDocs.slice(0, 8).map((doc) => {
              const filename = doc.filename || doc.name;
              const sizeInMo = doc.size ? (doc.size / (1024 * 1024)).toFixed(2) : '0.00';
              return (
                <div key={filename} style={{
                  background: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9em', color: '#1f2937', marginBottom: '8px', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={filename}>
                    📄 {filename}
                  </div>
                  <div style={{ fontSize: '0.75em', color: '#6b7280', display: 'grid', gap: '4px' }}>
                    <div><strong>Type:</strong> {doc.type || '—'}</div>
                    <div><strong>Taille:</strong> {sizeInMo} Mo</div>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => openFileStats(filename)}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.7em',
                        fontWeight: '500',
                        flex: 1
                      }}
                    >
                      📈
                    </button>
                    <button 
                      onClick={() => openFileView(filename)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.7em',
                        fontWeight: '500',
                        flex: 1
                      }}
                    >
                      👁️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

          {modalData && (
            <Modal title={modalData.type==='stats'? `📄 Détails complets - ${modalData.data.filename}` : `👁️ Vue - ${modalData.data.filename}`} onClose={()=>setModalData(null)}>
              {modalData.type==='view' ? (
                <pre style={{whiteSpace:'pre-wrap',maxHeight:'60vh',overflow:'auto'}}>{modalData.data.text}</pre>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '75vh', overflow: 'auto'}}>
                  <div style={{background: '#f9fafb', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb'}}>
                    <h3 style={{marginTop: 0, marginBottom: '15px', color: '#333', fontSize: '18px'}}>📋 Informations du document</h3>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                      <div style={{padding: '10px', background: 'white', borderRadius: '6px'}}>
                        <strong style={{color: '#666', fontSize: '12px'}}>Nom:</strong>
                        <div style={{marginTop: '4px', color: '#333', fontWeight: '500'}}>{modalData.data.filename}</div>
                      </div>
                      <div style={{padding: '10px', background: 'white', borderRadius: '6px'}}>
                        <strong style={{color: '#666', fontSize: '12px'}}>Type:</strong>
                        <div style={{marginTop: '4px', color: '#333', fontWeight: '500'}}>{modalData.data.type}</div>
                      </div>
                      <div style={{padding: '10px', background: 'white', borderRadius: '6px'}}>
                        <strong style={{color: '#666', fontSize: '12px'}}>Taille:</strong>
                        <div style={{marginTop: '4px', color: '#333', fontWeight: '500'}}>{(modalData.data.size / (1024 * 1024)).toFixed(2)} Mo</div>
                      </div>
                      <div style={{padding: '10px', background: 'white', borderRadius: '6px'}}>
                        <strong style={{color: '#666', fontSize: '12px'}}>Pages:</strong>
                        <div style={{marginTop: '4px', color: '#333', fontWeight: '500'}}>{modalData.data.pages}</div>
                      </div>
                      <div style={{padding: '10px', background: 'white', borderRadius: '6px'}}>
                        <strong style={{color: '#666', fontSize: '12px'}}>Mots:</strong>
                        <div style={{marginTop: '4px', color: '#333', fontWeight: '500'}}>{modalData.data.word_count?.toLocaleString('fr-FR')}</div>
                      </div>
                      <div style={{padding: '10px', background: 'white', borderRadius: '6px'}}>
                        <strong style={{color: '#666', fontSize: '12px'}}>Caractères:</strong>
                        <div style={{marginTop: '4px', color: '#333', fontWeight: '500'}}>{modalData.data.characters?.toLocaleString('fr-FR')}</div>
                      </div>
                    </div>
                    <div style={{padding: '10px', background: 'white', borderRadius: '6px', marginTop: '12px'}}>
                      <strong style={{color: '#666', fontSize: '12px'}}>Chemin:</strong>
                      <div style={{marginTop: '4px', color: '#333', fontWeight: '500', fontSize: '13px'}}>{modalData.data.path}</div>
                    </div>
                  </div>
                  
                  <div style={{background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb'}}>
                    <h4 style={{marginTop: 0, marginBottom: '15px', color: '#333', fontSize: '16px'}}>📊 Top 20 Lemmes les plus fréquents</h4>
                    <div style={{height:300}}>
                      <Bar 
                        data={{ 
                          labels: Object.keys(modalData.data.lemmas||{}).slice(0,20), 
                          datasets:[{ 
                            label:'Fréquence', 
                            data: Object.values(modalData.data.lemmas||{}).slice(0,20), 
                            backgroundColor:'#667eea',
                            borderRadius: 6
                          }] 
                        }} 
                        options={{
                          responsive:true, 
                          maintainAspectRatio: true,
                          plugins: {
                            legend: { display: false }
                          }
                        }} 
                      />
                    </div>
                  </div>
                  
                  <div style={{background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb'}}>
                    <h4 style={{marginTop: 0, marginBottom: '15px', color: '#333', fontSize: '16px'}}>📝 Aperçu du texte</h4>
                    <pre style={{
                      whiteSpace:'pre-wrap',
                      maxHeight:250,
                      overflow:'auto', 
                      background: '#f9fafb', 
                      padding: '12px', 
                      borderRadius: '6px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: '#555',
                      margin: 0,
                      border: '1px solid #e5e7eb'
                    }}>{modalData.data.text_sample}</pre>
                  </div>
                  
                  <div style={{marginTop: '10px', textAlign: 'center', paddingBottom: '10px'}}>
                    <button 
                      onClick={()=>setModalData(null)}
                      style={{
                        padding: '10px 24px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </Modal>
          )}
    </div>
  );
}
