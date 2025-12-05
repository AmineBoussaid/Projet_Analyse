import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import './Header.css';

export default function Header({ role }) {
  return (
    <motion.header 
      className="header"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="header-content">
        <div className="header-left">
          <h2 className="header-title">
            {role === 'admin' ? '👨‍💼 Tableau de Bord Administrateur' : '🔍 Recherche Documentaire'}
          </h2>
        </div>

        <div className="header-right">
          <div className="header-user">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-info">
              <p className="user-role">{role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
              <p className="user-name">Utilisateur</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
