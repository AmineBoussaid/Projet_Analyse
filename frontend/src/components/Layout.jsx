import React from 'react';
import './Layout.css';

export function Layout({ children, role, onLogout }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1>Analyse et Traitement Automatisé de Fichiers Textuels</h1>
          <nav className="navbar">
            {role === 'admin' && (
              <>
                <a href="/admin/import" className="nav-link">Importer</a>
                <a href="/admin/manage" className="nav-link">Gérer</a>
                <a href="/admin/stats" className="nav-link">Statistiques</a>
                <button onClick={onLogout} className="nav-btn logout-btn">Déconnexion</button>
              </>
            )}
            {role === 'user' && (
              <>
                <a href="/client" className="nav-link">Recherche</a>
                <button onClick={onLogout} className="nav-btn logout-btn">Déconnexion</button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
