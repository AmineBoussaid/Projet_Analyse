import React from 'react';
import './Modal.css';

export function Modal({ title, children, onClose, width = '800px', isOpen = true }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width }} onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✖</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
