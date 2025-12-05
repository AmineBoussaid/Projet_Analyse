import React, { useState, useRef } from 'react';
import axios from 'axios';
import './AdminImport.css';
import { Modal } from '../components/Modal';
import { showToast } from '../utils/toast';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function AdminImport() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(['txt', 'pdf', 'docx', 'html']);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saveToIndex, setSaveToIndex] = useState(true);

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

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      selectedTypes.forEach(type => {
        formData.append('types', type);
      });
      formData.append('save', saveToIndex ? 'true' : 'false');

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/admin/upload',
        formData,
        {
          headers: {
            'X-Role': 'admin',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setResult(response.data);
      setSelectedFiles([]);
      document.querySelector('input[type="file"]').value = '';
      showToast('Traitement terminé', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du traitement');
      console.error(err);
      showToast('Erreur lors du traitement', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const [modalData, setModalData] = useState(null);
  const openFileStats = async (filename) => {
    try{
      const token = localStorage.getItem('token');
      const resp = await axios.get('http://localhost:5000/api/admin/file_stats', { params: { filename }, headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` } });
      setModalData({ type: 'stats', data: resp.data });
    }catch(err){
      showToast('Impossible de récupérer les stats', 'error');
    }
  };

  const openFileView = async (filename) => {
    try{
      const token = localStorage.getItem('token');
      const resp = await axios.get('http://localhost:5000/api/admin/view', { params: { filename }, headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` } });
      setModalData({ type: 'view', data: resp.data });
    }catch(err){
      showToast('Impossible d\'ouvrir le fichier', 'error');
    }
  };

  const removeUploaded = async (filename) => {
    try{
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/delete', { filename }, { headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` } });
      setResult(prev => ({...prev, files: prev.files.filter(f=>f.filename!==filename)}));
      showToast('Fichier supprimé', 'success');
    }catch(err){
      showToast('Suppression impossible', 'error');
    }
  };

  return (
    <div className="admin-import">
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
              <h4>Fichiers sélectionnés ({selectedFiles.length}):</h4>
              <ul>
                {selectedFiles.map((file, idx) => (
                  <li key={idx}>📄 {file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="form-section">
          <label>Types de fichiers à traiter:</label>
          <div className="type-checkboxes">
            {['txt', 'pdf', 'docx', 'html'].map(type => (
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

        <div className="form-section">
          <label>
            <input type="checkbox" checked={saveToIndex} onChange={(e)=>setSaveToIndex(e.target.checked)} /> Enregistrer dans l'index
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={processing} className="submit-btn">
          {processing ? 'Traitement en cours...' : 'Démarrer le traitement'}
        </button>
      </form>

      {result && (
        <div className="result-section">
          <h3>✅ Traitement Réussi</h3>
          <div className="result-grid">
            <div className="result-card">
              <div className="result-label">Fichiers traités</div>
              <div className="result-value">{result.summary.files}</div>
            </div>
            <div className="result-card">
              <div className="result-label">Taille totale</div>
              <div className="result-value">{(result.summary.total_size / 1024).toFixed(2)} KB</div>
            </div>
            <div className="result-card">
              <div className="result-label">Mots indexés</div>
              <div className="result-value">{result.summary.total_words}</div>
            </div>
            <div className="result-card">
              <div className="result-label">Mots supprimés</div>
              <div className="result-value">{result.summary.total_removed}</div>
            </div>
          </div>

          <div className="files-results">
            <h4>Détails par fichier</h4>
            <div className="files-list-container">
              {result.files.map((f) => (
                <div key={f.filename} className="file-card-item" style={{
                  background: 'white',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}>
                  <div style={{fontWeight: 'bold', fontSize: '1.1em'}}>{f.filename}</div>
                  <div><strong>Type:</strong> {f.type}</div>
                  <div><strong>Taille:</strong> {(f.size / (1024 * 1024)).toFixed(2)} Mo</div>
                  <div><strong>Pages:</strong> {f.pages}</div>
                  <div><strong>Chemin:</strong> {f.path}</div>
                  <div style={{marginTop: '10px'}}>
                    <button 
                      className="stats-btn" 
                      onClick={()=>openFileStats(f.filename)}
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.wordcloud && (
            <div className="wordcloud-section">
              <h4>Nuage de Mots</h4>
              <img src={result.wordcloud} alt="Word Cloud" className="wordcloud-img" />
            </div>
          )}
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
