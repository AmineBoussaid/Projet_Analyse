import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUploader from "../components/FileUploader";
import { deleteDocuments, uploadFiles } from "../api/documentApi";

const PAGE_SIZE = 10;

export default function UploadView({ files = [], results = {}, processing = false, onFilesSelected, onFolderSelected, setResults, setFiles }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [previewFile, setPreviewFile] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t => setTimeout(() => {
      setToasts(curr => curr.filter(x => x.id !== t.id));
    }, 5000));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const pushToast = (type, message) => {
    setToasts(curr => [...curr, { id: Date.now() + Math.random(), type, message }]);
  };

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [localResults, setLocalResults] = useState({});

  const handleUpload = async (selectedFiles) => {
    // If parent provided a handler, call it (backwards compat)
    if (onFilesSelected) await onFilesSelected(selectedFiles);
    setCurrentPage(1);

    try {
      pushToast('info', `Envoi de ${selectedFiles.length} fichier(s)...`);
      const resp = await uploadFiles(selectedFiles);
      pushToast('success', resp.message || 'Fichiers importés avec succès');

      const names = [];
      const newResults = {};
      (resp.files || []).forEach(f => {
        const name = f.filename || '';
        names.push(name);
        const key = getResultKey(name);
        newResults[key] = {
          ...f,
          num_pages: f.pages ?? f.pages_count ?? f.num_pages,
          characters: f.characters ?? f.char_count ?? f.characters,
          corpus_relpath: f.path || f.path
        };
      });

      setUploadedFiles(prev => [...names, ...prev]);
      setLocalResults(prev => ({ ...newResults, ...prev }));
      if (setResults) setResults(prev => ({ ...prev, ...newResults }));
      if (setFiles) setFiles(prev => [...names, ...(prev || [])]);
    } catch (e) {
      pushToast('error', `Erreur upload: ${e.message}`);
    }
  };

  const handleFolderUpload = async (folderFiles) => {
    if (onFolderSelected) await onFolderSelected(folderFiles);
    setCurrentPage(1);

    try {
      pushToast('info', `Envoi de ${folderFiles.length} fichier(s) depuis le dossier...`);
      const resp = await uploadFiles(folderFiles);
      pushToast('success', resp.message || 'Dossier importé avec succès');

      const names = [];
      const newResults = {};
      (resp.files || []).forEach(f => {
        const name = f.filename || '';
        names.push(name);
        const key = getResultKey(name);
        newResults[key] = {
          ...f,
          num_pages: f.pages ?? f.pages_count ?? f.num_pages,
          characters: f.characters ?? f.char_count ?? f.characters,
          corpus_relpath: f.path || f.path
        };
      });

      setUploadedFiles(prev => [...names, ...prev]);
      setLocalResults(prev => ({ ...newResults, ...prev }));
      if (setResults) setResults(prev => ({ ...prev, ...newResults }));
      if (setFiles) setFiles(prev => [...names, ...(prev || [])]);
    } catch (e) {
      pushToast('error', `Erreur upload dossier: ${e.message}`);
    }
  };

  const getResultKey = (name) => name.replace(/\.[^/.]+$/, "");

  const handleDelete = async (name) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) return;

    try {
      // call deleteDocuments with full filename so backend can match
      await deleteDocuments([name]);

      const key = getResultKey(name);
      // remove from localResults and uploadedFiles
      setLocalResults(prev => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
      setUploadedFiles(prev => prev.filter(n => n !== name));

      if (setResults) {
        setResults(prev => {
          const newResults = { ...prev };
          delete newResults[key];
          return newResults;
        });
      }

      if (setFiles) {
        setFiles(prev => prev.filter(f => f.name !== name));
      }

      pushToast('success', `Document "${name}" supprimé avec succès.`);
    } catch (error) {
      pushToast('error', `Erreur lors de la suppression : ${error.message}`);
    }
  };

  const displayFiles = (files && files.length > 0) ? files : uploadedFiles;
  const totalPages = Math.max(1, Math.ceil(displayFiles.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageFiles = displayFiles.slice(start, start + PAGE_SIZE);

  return (
    <div className="container py-5">
      <h1 className="text-center mb-4">📘 Projet Analyse</h1>

          <FileUploader onFilesSelected={async (fs) => {
        await handleUpload(fs);
      }} onFolderSelected={async (fs) => {
        await handleFolderUpload(fs);
      }} />

      {processing && (
        <div className="text-center text-primary my-3">⏳ Traitement en cours...</div>
      )}

      <div style={{position:'fixed', top:10, right:10, zIndex:2000, maxWidth:'320px'}}>
        {toasts.map(t => (
          <div key={t.id} className={`alert py-2 px-3 mb-2 shadow-sm`} style={{
            fontSize:'0.85rem', 
            fontWeight: t.type==='success'?'600':'normal', 
            backgroundColor: t.type==='success'?'#10b981':t.type==='error'?'#ef4444':t.type==='info'?'#3b82f6':'#6b7280',
            color: t.type==='success'?'#ffffff':t.type==='error'?'#ffffff':t.type==='info'?'#ffffff':'#ffffff',
            border: 'none'
          }}>
            <div className="d-flex justify-content-between align-items-start">
              <span>{t.message}</span>
              <button className="btn btn-sm btn-link text-decoration-none" style={{color:'#ffffff'}} onClick={() => setToasts(curr => curr.filter(x => x.id !== t.id))}>✖</button>
            </div>
          </div>
        ))}
      </div>

      {!processing && displayFiles.length > 0 && (
        <div className="mt-4">
          <div className="row gy-3 gx-2">
            {pageFiles.map((name) => {
              const key = getResultKey(name);
              const info = (results && results[key]) || localResults[key] || {};
              return (
                <div key={name} className="col-12 col-sm-6 col-md-4 col-lg-2_4" style={{flex: '0 0 calc(20% - 1.2rem)'}}>
                  <div className="card h-100">
                    <div className="card-body d-flex flex-column p-3">
                      <div style={{position: 'relative', marginBottom: '0.5rem'}}>
                        <button 
                          className="btn btn-link text-danger p-0" 
                          onClick={() => handleDelete(name)}
                          title="Supprimer ce document"
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            zIndex: 10,
                            color: '#dc3545'
                          }}
                        >
                          ✕
                        </button>
                        
                        <h6 className="card-title" style={{fontSize: '0.95rem', wordBreak: 'break-word'}}>{name}</h6>
                      </div>

                      <div style={{flex: 1, fontSize: '0.8rem'}}>
                        <p className="mb-1"><small><strong>Type:</strong> {info.type || '—'}</small></p>
                        <p className="mb-1"><small><strong>Taille:</strong> {typeof info.size === 'number' ? (info.size / (1024*1024)).toFixed(2) + ' Mo' : '—'}</small></p>
                        <p className="mb-1"><small><strong>Pages:</strong> {info.num_pages ?? '—'}</small></p>
                        <p className="mb-1"><small><strong>Mots:</strong> {info.word_count ?? '—'}</small></p>
                        <p className="mb-1"><small><strong>Caractères:</strong> {info.characters ?? '—'}</small></p>
                        <p className="mb-2"><small><strong>Chemin:</strong> <code style={{fontSize: '0.7rem'}}>{info.path || info.corpus_relpath || '—'}</code></small></p>
                      </div>

                      <div className="mt-auto">
                        <button 
                          className="btn btn-primary btn-sm w-100" 
                          onClick={() => navigate('/results-detail', { state: { name, data: info } })}
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <div>Page {currentPage} / {totalPages}</div>
            <div>
              <button className="btn btn-outline-primary me-2" disabled={currentPage===1} onClick={() => setCurrentPage(p => Math.max(1, p-1))}>Préc</button>
              <button className="btn btn-outline-primary" disabled={currentPage===totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}>Suiv</button>
            </div>
          </div>

          {previewFile && (
            <div className="modal d-block" tabIndex="-1" role="dialog" onClick={() => setPreviewFile(null)}>
              <div className="modal-dialog modal-lg" role="document" onClick={(e)=>e.stopPropagation()}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Aperçu : {previewFile}</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setPreviewFile(null)}></button>
                  </div>
                  <div className="modal-body">
                    <pre style={{whiteSpace: 'pre-wrap'}}>{results[ getResultKey(previewFile) ]?.context || 'Aucun aperçu disponible'}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="card mt-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>Console traitement</strong>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setLogs([])}>Effacer</button>
              </div>
              <div className="card-body" style={{maxHeight:'220px', overflowY:'auto', fontSize:'0.8rem', background:'#f8f9fa'}}>
                {logs.map((l,i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
