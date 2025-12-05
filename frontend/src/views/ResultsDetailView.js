import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Hash, Type, FileDigit, Eye, Trash2 } from "lucide-react";
import { deleteDocuments, getDownloadUrl } from "../api/documentApi";
import WordCloudChart from "../components/WordCloudChart";

export default function ResultsDetailView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, data } = location.state || {};

  const [showContext, setShowContext] = useState(false);
  const [showWordCloud, setShowWordCloud] = useState(false);
  const [textSearch, setTextSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  useEffect(() => {
    if (!name || !data) {
      navigate("/import");
    }
  }, [name, data, navigate]);

  if (!name || !data) return null;

  const sortedWords = [...(data.words || [])].sort((a, b) => b[1] - a[1]);
  const sortedBigrams = [...(data.bigrams || [])].sort((a, b) => b[1] - a[1]);

  const highlightText = (text, search) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase()
        ? `<mark style="background-color: yellow; font-weight: bold; font-size: 1.1em; text-decoration: underline;">${part}</mark>`
        : part
    ).join('');
  };

  const filteredWords = sortedWords.filter(([word]) =>
    word.toLowerCase().includes(tableSearch.toLowerCase())
  );
  const filteredBigrams = sortedBigrams.filter(([bigram]) =>
    bigram.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const handleOpen = () => {
    if (data.corpus_relpath) {
      const url = getDownloadUrl(data.corpus_relpath);
      window.open(url, '_blank');
    } else {
      alert('Aucun chemin disponible pour ouvrir ce document.');
    }
  };

  const handleDelete = async () => {
    const documentName = name.replace(/\.[^/.]+$/, "");
    if (!window.confirm(`Voulez-vous vraiment supprimer "${name}" ?`)) return;
    try {
      await deleteDocuments([documentName]);
      alert(`Document "${name}" supprimé avec succès.`);
      navigate("/import");
    } catch (error) {
      alert(`Erreur lors de la suppression : ${error.message}`);
    }
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '2rem' }}>
      <motion.div
        className="container-fluid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={() => navigate("/import")}
            >
              <ArrowLeft size={20} />
              Retour
            </button>
            <h2 className="mb-0" style={{ fontSize: '1.4rem', fontWeight: '600', color: '#333' }}>
              📊 Résultats détaillés
            </h2>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-success d-flex align-items-center gap-2" onClick={handleOpen}>
              <Eye size={18} /> Ouvrir
            </button>
            <button className="btn btn-danger d-flex align-items-center gap-2" onClick={handleDelete}>
              <Trash2 size={18} /> Supprimer
            </button>
          </div>
        </div>

        <motion.div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="card-body p-4">
            <h5 className="mb-0 text-primary" style={{ fontSize: '1.1rem' }}>{name}</h5>
          </div>
        </motion.div>

        <motion.div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="card-body p-4">
            <h6 className="mb-4" style={{ fontWeight: '600', fontSize: '1rem' }}>📈 Statistiques</h6>
            <div className="row g-4">
              <div className="col-md-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={24} color="white" />
                  </div>
                  <div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Type</p>
                    <p className="mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>{data.type || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileDigit size={24} color="white" />
                  </div>
                  <div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Pages</p>
                    <p className="mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>{data.num_pages ?? '—'}</p>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Hash size={24} color="white" />
                  </div>
                  <div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Tokens</p>
                    <p className="mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>{data.total_tokens_before || 0} → {data.total_tokens_after || 0}</p>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Type size={24} color="white" />
                  </div>
                  <div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Caractères</p>
                    <p className="mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>{data.char_count_before || 0} → {data.char_count_after || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="card-body p-4">
            <div className="form-check form-switch mb-3">
              <input type="checkbox" className="form-check-input" id="showContextToggle" checked={showContext} onChange={(e) => setShowContext(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label className="form-check-label fw-bold" htmlFor="showContextToggle" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>📄 Afficher le texte nettoyé complet</label>
            </div>

            {showContext && (
              <div>
                <div className="mb-3">
                  <input type="text" className="form-control" placeholder="🔍 Rechercher dans le texte..." value={textSearch} onChange={(e) => setTextSearch(e.target.value)} />
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: highlightText(data.context || 'Aucun texte disponible', textSearch) }} />
              </div>
            )}

            <div className="form-check form-switch mt-4 mb-3">
              <input type="checkbox" className="form-check-input" id="showWordCloudToggle" checked={showWordCloud} onChange={(e) => setShowWordCloud(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label className="form-check-label fw-bold" htmlFor="showWordCloudToggle" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>☁️ Afficher le nuage de mots du document</label>
            </div>

            {showWordCloud && (
              <div className="mt-3">
                <div style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                  <WordCloudChart words={data.words || []} />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="card-body p-4">
            <h6 className="mb-3" style={{ fontWeight: '600', fontSize: '0.95rem' }}>🔍 Recherche dans les statistiques</h6>
            <input type="text" className="form-control" placeholder="Filtrer les mots et bigrammes..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} />
          </div>
        </motion.div>

        <div className="row g-4">
          <div className="col-md-6">
            <motion.div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <div className="card-header bg-white border-0 pt-3 px-4">
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.95rem' }}>📝 Mots ({filteredWords.length})</h6>
              </div>
              <div className="card-body p-0">
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ width: '70%', color: '#000', fontWeight: '600' }}>Mot</th>
                        <th style={{ width: '30%', textAlign: 'center', color: '#000', fontWeight: '600' }}>Fréquence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWords.length > 0 ? (
                        filteredWords.map(([word, count], idx) => (
                          <tr key={idx}>
                            <td>{word}</td>
                            <td style={{ textAlign: 'center' }}><span className="badge bg-primary">{count}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center text-muted py-4">Aucun mot trouvé</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="col-md-6">
            <motion.div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <div className="card-header bg-white border-0 pt-3 px-4">
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.95rem' }}>🔗 Bigrammes ({filteredBigrams.length})</h6>
              </div>
              <div className="card-body p-0">
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ width: '70%', color: '#000', fontWeight: '600' }}>Bigramme</th>
                        <th style={{ width: '30%', textAlign: 'center', color: '#000', fontWeight: '600' }}>Fréquence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBigrams.length > 0 ? (
                        filteredBigrams.map(([bigram, count], idx) => (
                          <tr key={idx}>
                            <td>{bigram}</td>
                            <td style={{ textAlign: 'center' }}><span className="badge bg-success">{count}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center text-muted py-4">Aucun bigramme trouvé</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div className="text-center mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <button className="btn btn-outline-primary btn-lg d-inline-flex align-items-center gap-2" onClick={() => navigate("/import")}>Retour à l'import</button>
        </motion.div>
      </motion.div>
    </div>
  );
}
