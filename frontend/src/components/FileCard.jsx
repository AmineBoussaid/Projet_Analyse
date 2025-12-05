import React from "react";

export default function FileCard({ name, onToggle, isOpen, onPreview }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <button className="btn p-0" onClick={() => onPreview && onPreview()} title="Aperçu">
            <img src={`https://via.placeholder.com/48x64?text=${encodeURIComponent(name.split('.')[0])}`} alt="doc" style={{width:48, height:64, objectFit:'cover', borderRadius:4}} />
          </button>
          <div>
            <h5 className="card-title mb-0">{name}</h5>
            <small className="text-muted">Cliquez sur l'icône pour un aperçu, ou sur le bouton pour détails</small>
          </div>
        </div>
        <button
          className={`btn ${isOpen ? "btn-danger" : "btn-primary"}`}
          onClick={() => onToggle(name)}
        >
          {isOpen ? "Fermer" : "Voir détails"}
        </button>
      </div>
    </div>
  );
}
