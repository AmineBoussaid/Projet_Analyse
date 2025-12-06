import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Upload, 
  FileText, 
  Search, 
  LogOut,
  Home,
  Menu,
  X
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ role, onLogout, isOpen, toggleSidebar }) {
  const location = useLocation();

  const adminLinks = [
    { path: '/admin', label: 'Accueil', icon: Home },
    { path: '/admin/import', label: 'Importer', icon: Upload },
    { path: '/admin/manage', label: 'Gérer les Documents', icon: FileText },
    { path: '/admin/stats', label: 'Statistiques', icon: BarChart3 },
  ];

  const userLinks = [
    { path: '/user', label: 'Accueil', icon: Home },
    { path: '/user/search', label: 'Rechercher', icon: Search },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="sidebar-toggle"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.aside 
        className={`sidebar ${isOpen ? 'open' : ''}`}
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="sidebar-header">
          <motion.div 
            className="sidebar-brand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="brand-icon">📊</div>
            <div className="brand-text">
              <h1>Analyse</h1>
              <p>v1.0</p>
            </div>
          </motion.div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link, idx) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
              >
                <Link
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 768 && toggleSidebar()}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                  {isActive(link.path) && (
                    <motion.div 
                      className="nav-indicator"
                      layoutId="indicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <motion.button
            className="logout-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div 
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
