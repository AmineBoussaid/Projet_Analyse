import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './AdminManage.css';
import { Modal } from '../components/Modal';
import { showToast } from '../utils/toast';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function AdminManage() {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/files', {
        params: { q: searchQuery },
        headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` }
      });
      setFiles(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des fichiers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const [sortConfig, setSortConfig] = useState({ key: 'filename', direction: 'ascending' });

  const sortedFiles = React.useMemo(() => {
    let sortableFiles = [...files];
    if (sortConfig !== null) {
      sortableFiles.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableFiles;
  }, [files, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/admin/delete',
        { filename },
        { headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` } }
      );
      setFiles(files.filter(f => f.filename !== filename));
      showToast('Fichier supprimé avec succès', 'success');
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error(err);
    }
  };

  const [selected, setSelected] = useState([]);
  const toggleSelect = (file) => {
    const id = file.path || file.filename;
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };
  const selectAll = () => {
    if (selected.length === files.length) setSelected([]);
    else setSelected(files.map(f=>f.path || f.filename));
  };

  const bulkDelete = async () => {
    if (!selected.length) return showToast('Aucun fichier sélectionné', 'info');
    if (!window.confirm(`Supprimer ${selected.length} fichier(s) ?`)) return;
    try{
      const token = localStorage.getItem('token');
      for(const id of selected){
        const file = files.find(f=>(f.path || f.filename)===id);
        if(file) {
            await axios.post('http://localhost:5000/api/admin/delete', { filename: file.filename }, { headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` } });
        }
      }
      setFiles(files.filter(f=>!selected.includes(f.path || f.filename)));
      setSelected([]);
      showToast(`${selected.length} fichier(s) supprimé(s)`, 'success');
    }catch(err){
      showToast('Erreur suppression', 'error');
    }
  };

  const bulkDownload = async () => {
    if (!selected.length) return showToast('Aucun fichier sélectionné', 'info');
    try{
      const token = localStorage.getItem('token');
      for(const id of selected){
        const file = files.find(f=>(f.path || f.filename)===id);
        if(file){
          const resp = await axios.get('http://localhost:5000/api/admin/download', { params: { path: file.path }, headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` }, responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([resp.data]));
          const link = document.createElement('a'); link.href = url; link.setAttribute('download', file.filename); document.body.appendChild(link); link.click(); link.remove();
        }
      }
      showToast('Téléchargement démarré', 'success');
    }catch(err){ showToast('Erreur téléchargement', 'error'); }
  };

  const [modalData, setModalData] = useState(null);
  const openStats = async (filename) => {
    try{
      const token = localStorage.getItem('token');
      const resp = await axios.get('http://localhost:5000/api/admin/file_stats', { params: { filename }, headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` } });
      setModalData({ type: 'stats', data: resp.data });
    }catch(err){ showToast('Impossible de récupérer les stats', 'error'); }
  };
  const openView = async (filename) => {
    try{
      const token = localStorage.getItem('token');
      const resp = await axios.get('http://localhost:5000/api/admin/view', { params: { filename }, headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` } });
      setModalData({ type: 'view', data: resp.data });
    }catch(err){ showToast('Impossible d\'ouvrir le fichier', 'error'); }
  };

  const handleDownload = async (path, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/admin/download',
        {
          params: { path },
          headers: { 'X-Role': 'admin', 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      showToast('Téléchargement démarré', 'success');
    } catch (err) {
      setError('Erreur lors du téléchargement');
      console.error(err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div 
      className="admin-manage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="manage-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#333', margin: 0 }}>
          📁 Gestion des documents
        </h1>
        <p style={{ color: '#999', margin: '8px 0 0 0' }}>
          {files.length} document(s) indexé(s)
        </p>
      </div>

      {/* Search Section */}
      <motion.div
        className="search-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: '30px' }}
      >
        <input
          type="text"
          placeholder="🔍 Rechercher un fichier ou un terme..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '10px',
            border: '2px solid #f0f0f0',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        />
      </motion.div>

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            padding: '16px',
            color: '#c33',
            marginBottom: '20px'
          }}
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            📁
          </motion.div>
          <p style={{ color: '#999', marginTop: '16px' }}>Chargement des documents...</p>
        </div>
      ) : files.length === 0 ? (
        <motion.div 
          className="no-files"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '2px dashed #ddd'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Aucun document trouvé</p>
          <small style={{ color: '#999' }}>Commencez par importer des fichiers depuis la page "Importer"</small>
        </motion.div>
      ) : (
        <motion.div 
          className="files-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Bulk Actions */}
          <motion.div
            className="bulk-actions-bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'white',
              padding: '16px 20px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              {selected.length} / {files.length} sélectionné(s)
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button 
                onClick={bulkDownload} 
                disabled={!selected.length}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selected.length ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ddd',
                  color: 'white',
                  cursor: selected.length ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
                whileHover={selected.length ? { scale: 1.05 } : {}}
                whileTap={selected.length ? { scale: 0.98 } : {}}
              >
                ⬇️ Télécharger
              </motion.button>
              <motion.button 
                onClick={bulkDelete} 
                disabled={!selected.length}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selected.length ? '#ff6b6b' : '#ddd',
                  color: 'white',
                  cursor: selected.length ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
                whileHover={selected.length ? { scale: 1.05 } : {}}
                whileTap={selected.length ? { scale: 0.98 } : {}}
              >
                🗑️ Supprimer
              </motion.button>
            </div>
          </motion.div>

          {/* Files Table */}
          <motion.div 
            className="table-container"
            variants={rowVariants}
            style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #f0f0f0'
            }}
          >
            <table className="files-table">
              <thead style={{ background: '#f9fafb', borderBottom: '2px solid #f0f0f0' }}>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selected.length===files.length && files.length > 0} 
                      onChange={selectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', cursor: 'pointer' }} onClick={() => requestSort('filename')}>
                    Nom {sortConfig.key === 'filename' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Path</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Taille (Mo)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Type</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Pages</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Mots</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Caractères</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Date import</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiles.map((file, idx) => (
                  <motion.tr 
                    key={idx} 
                    className="file-row"
                    variants={rowVariants}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s ease'
                    }}
                    onHoverStart={{ background: '#f9fafb' }}
                  >
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selected.includes(file.path || file.filename)} 
                        onChange={()=>toggleSelect(file)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: '500', color: '#333' }}>{file.filename}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#666', fontSize: '12px' }}>
                      {file.path}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                      {(file.size / (1024*1024)).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: '#f0f3ff',
                        color: '#667eea',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {file.type || file.filename.split('.').pop().toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                      {file.pages || file.num_pages || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                      {file.word_count ? file.word_count.toLocaleString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                      {file.characters ? file.characters.toLocaleString('fr-FR') : (file.char_count ? file.char_count.toLocaleString('fr-FR') : '—')}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>
                      {file.imported_at || file.date_import ? new Date(file.imported_at || file.date_import).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <motion.button 
                          onClick={() => handleDownload(file.path, file.filename)}
                          style={{
                            padding: '6px 10px',
                            background: '#f0f3ff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#667eea',
                            fontWeight: '500'
                          }}
                          whileHover={{ scale: 1.1, background: '#e0e8ff' }}
                          whileTap={{ scale: 0.95 }}
                          title="Télécharger"
                        >
                          ⬇️
                        </motion.button>
                        <motion.button 
                          onClick={() => openView(file.filename)}
                          style={{
                            padding: '6px 10px',
                            background: '#f0f3ff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#667eea',
                            fontWeight: '500'
                          }}
                          whileHover={{ scale: 1.1, background: '#e0e8ff' }}
                          whileTap={{ scale: 0.95 }}
                          title="Voir le contenu"
                        >
                          👁️
                        </motion.button>
                        <motion.button 
                          onClick={() => openStats(file.filename)}
                          style={{
                            padding: '6px 10px',
                            background: '#f0f3ff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#667eea',
                            fontWeight: '500'
                          }}
                          whileHover={{ scale: 1.1, background: '#e0e8ff' }}
                          whileTap={{ scale: 0.95 }}
                          title="Statistiques"
                        >
                          📈
                        </motion.button>
                        <motion.button 
                          onClick={() => handleDelete(file.filename)}
                          style={{
                            padding: '6px 10px',
                            background: '#fee',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#ff6b6b',
                            fontWeight: '500'
                          }}
                          whileHover={{ scale: 1.1, background: '#fdd' }}
                          whileTap={{ scale: 0.95 }}
                          title="Supprimer"
                        >
                          🗑️
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      )}

      {/* Modal for Stats/View */}
      {modalData && (
        <Modal 
          title={modalData.type==='stats'? `📈 Statistiques - ${modalData.data.filename}` : `👁️ Aperçu - ${modalData.data.filename}`} 
          onClose={()=>setModalData(null)}
        >
          {modalData.type==='view' ? (
            <pre style={{
              whiteSpace:'pre-wrap',
              maxHeight:'60vh',
              overflow:'auto',
              background: '#f9f9f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#333'
            }}>
              {modalData.data.text}
            </pre>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: '#f0f3ff',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e0e8ff'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#999', fontWeight: '500' }}>Pages</p>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
                    {modalData.data.pages || '-'}
                  </div>
                </div>
                <div style={{
                  background: '#faf0ff',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #f0e8ff'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#999', fontWeight: '500' }}>Caractères</p>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#764ba2' }}>
                    {modalData.data.characters?.toLocaleString() || '-'}
                  </div>
                </div>
                <div style={{
                  background: '#fff0f8',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #ffe8f0'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#999', fontWeight: '500' }}>Mots</p>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#f5576c' }}>
                    {modalData.data.word_count?.toLocaleString() || '-'}
                  </div>
                </div>
              </div>
              <h4 style={{ marginTop: '24px', marginBottom: '16px', color: '#333', fontWeight: '600' }}>
                📊 Lemmes les plus fréquents
              </h4>
              <div style={{height:300, background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #f0f0f0'}}>
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
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }} 
                />
              </div>
              <h4 style={{ marginTop: '24px', marginBottom: '12px', color: '#333', fontWeight: '600' }}>
                📝 Aperçu du contenu
              </h4>
              <pre style={{
                whiteSpace:'pre-wrap',
                maxHeight:180,
                overflow:'auto',
                background: '#f9f9f9',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: '1.4',
                color: '#666',
                margin: 0
              }}>
                {modalData.data.text_sample}
              </pre>
            </>
          )}
        </Modal>
      )}
    </motion.div>
  );
}
