import React, { useState } from "react";

export default function FileUploader({ onFilesSelected, onFolderSelected }) {
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState({
    pdf: true,
    docx: true,
    doc: true,
    txt: true,
    html: true,
    htm: true,
  });

  const handleFolderChange = (e) => {
    const files = [...e.target.files];
    setPendingFiles(files);
    setShowTypeModal(true);
    e.target.value = '';
  };

  const handleConfirmTypes = () => {
    const allowedExtensions = Object.keys(selectedTypes).filter(key => selectedTypes[key]);
    const filteredFiles = pendingFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return allowedExtensions.includes(ext);
    });

    if (filteredFiles.length === 0) {
      alert("Aucun fichier ne correspond aux types sélectionnés.");
      setShowTypeModal(false);
      return;
    }

    onFolderSelected(filteredFiles);
    setShowTypeModal(false);
    setPendingFiles([]);
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const selectAllTypes = () => {
    setSelectedTypes({
      pdf: true,
      docx: true,
      doc: true,
      txt: true,
      html: true,
      htm: true,
    });
  };

  const deselectAllTypes = () => {
    setSelectedTypes({
      pdf: false,
      docx: false,
      doc: false,
      txt: false,
      html: false,
      htm: false,
    });
  };

  return (
    <>
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center gap-2 flex-wrap mb-2">
          <label htmlFor="fileInput" className="btn btn-primary">
            📁 Importer des fichiers
          </label>
          <input
            type="file"
            multiple
            id="fileInput"
            className="d-none"
            onChange={(e) => onFilesSelected([...e.target.files])}
          />

          <label htmlFor="folderInput" className="btn btn-success">
            📂 Importer un dossier
          </label>
          <input
            type="file"
            webkitdirectory="true"
            directory=""
            id="folderInput"
            className="d-none"
            onChange={handleFolderChange}
          />
        </div>
        <small className="text-muted">
          Formats supportés : PDF, DOCX, DOC, TXT, HTML, HTM
        </small>
      </div>

      {showTypeModal && (
        <div 
          className="modal d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowTypeModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: 'white' }}>Sélectionner les types de fichiers à importer</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowTypeModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={selectAllTypes}>
                    Tout sélectionner
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={deselectAllTypes}>
                    Tout désélectionner
                  </button>
                </div>
                <div className="row g-2">
                  {Object.keys(selectedTypes).map(type => (
                    <div key={type} className="col-6 col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`type-${type}`}
                          checked={selectedTypes[type]}
                          onChange={() => toggleType(type)}
                        />
                        <label className="form-check-label" htmlFor={`type-${type}`}>
                          .{type.toUpperCase()}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-muted small">
                  <strong>{pendingFiles.length}</strong> fichier(s) total dans le dossier
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowTypeModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleConfirmTypes}
                >
                  Importer les fichiers sélectionnés
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
