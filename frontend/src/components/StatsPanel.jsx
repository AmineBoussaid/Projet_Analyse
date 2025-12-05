import React from "react";
import { FileText, BarChart2, HardDrive, Calendar, Type } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => (
  <div className="d-flex align-items-center p-3 bg-light" style={{ borderRadius: '10px' }}>
    <div 
      className="me-3 d-flex align-items-center justify-content-center" 
      style={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: '50%', 
        background: color, 
        color: 'white' 
      }}
    >
      {icon}
    </div>
    <div>
      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div>
      <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{value}</div>
    </div>
  </div>
);

export default function StatsPanel({ stats }) {
  return (
    <div className="row g-3">
      <div className="col-6 col-md-4 col-lg-6">
        <StatCard 
          icon={<FileText size={20} />} 
          label="Documents" 
          value={stats.num_files}
          color="#4e73df"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-6">
        <StatCard 
          icon={<BarChart2 size={20} />} 
          label="Mots Indexés" 
          value={stats.total_words.toLocaleString()}
          color="#1cc88a"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-6">
        <StatCard 
          icon={<HardDrive size={20} />} 
          label="Taille Totale" 
          value={`${stats.total_size_mo || 0} Mo`}
          color="#36b9cc"
        />
      </div>
      <div className="col-6 col-md-4 col-lg-6">
        <StatCard 
          icon={<Calendar size={20} />} 
          label="Dernier Import" 
          value={stats.last_import_date || "N/A"}
          color="#f6c23e"
        />
      </div>
      {stats.top_types && stats.top_types.length > 0 && (
        <div className="col-12 col-md-8 col-lg-12">
          <div className="p-3 bg-light" style={{ borderRadius: '10px' }}>
            <div className="d-flex align-items-center mb-2">
              <Type size={20} className="me-2 text-primary" />
              <h6 className="mb-0 fw-bold">Types de Fichiers</h6>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {stats.top_types.map(([type, count]) => (
                <span key={type} className="badge bg-primary-soft text-primary">
                  {type} <span className="fw-normal">({count})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const style = document.createElement('style');
style.innerHTML = `
.bg-primary-soft {
  background-color: rgba(78, 115, 223, 0.1);
}
.text-primary {
  color: #4e73df !important;
}
`;
document.head.appendChild(style);

const btnCircleStyle = document.createElement('style');
btnCircleStyle.innerHTML = `
.btn-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
`;
document.head.appendChild(btnCircleStyle);
