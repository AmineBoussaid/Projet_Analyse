import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ReprocessModal({ show, progress, elapsedTime, onCancel }) {
  if (!show) return null;

  return (
    <div className="modal" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Retraitement en cours</h5>
          </div>
          <div className="modal-body">
            <p>Veuillez patienter pendant que les documents sont retraités...</p>
            <div className="progress">
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <p className="mt-3">Temps écoulé: {Math.floor(elapsedTime / 1000)} secondes</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={onCancel}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
