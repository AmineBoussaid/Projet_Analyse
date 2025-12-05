import React, { useEffect, useState, useMemo } from "react";
import { fetchDocuments, deleteDocuments, getDownloadUrl } from "../api/documentApi";
import ReprocessModal from "../components/ReprocessModal";
import "bootstrap/dist/css/bootstrap.min.css";

export default function DocumentsView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [reprocessLoading, setReprocessLoading] = useState(false);
  const [showReprocessModal, setShowReprocessModal] = useState(false);
  const [reprocessProgress, setReprocessProgress] = useState(0);
  const [reprocessElapsedTime, setReprocessElapsedTime] = useState(0);
  const [reprocessAbortController, setReprocessAbortController] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchDocuments();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || String(e));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    let timer;
    if (reprocessLoading) {
      timer = setInterval(() => {
        setReprocessElapsedTime(prevTime => prevTime + 1000);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [reprocessLoading]);

  useEffect(() => {
    setPage(1);
  }, [q, typeFilter, dateFrom, dateTo, rows.length]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    let r = rows;
    if (text) {
      r = rows.filter((row) =>
        [row.name, row.type, row.path].some((v) => (v || "").toLowerCase().includes(text))
      );
    }
    if (typeFilter) {
      r = r.filter(row => (row.type || "").toLowerCase() === typeFilter.toLowerCase());
    }
    if (dateFrom || dateTo) {
      const dFrom = dateFrom ? new Date(dateFrom) : null;
      const dTo = dateTo ? new Date(dateTo) : null;
      r = r.filter(row => {
        if (!row.date_import) return false;
        const d = new Date(row.date_import);
        if (isNaN(d)) return false;
        if (dFrom && d < dFrom) return false;
        if (dTo && d > dTo) return false;
        return true;
      });
    }
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...r].sort((a,b) => {
      const va = a[sort.key] ?? "";
      const vb = b[sort.key] ?? "";
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [rows, q, sort, typeFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  const setSortKey = (key) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  };

  const toggleSelect = (name) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };

  const toggleSelectAll = () => {
    setSelectAll(a => !a);
    setSelected(prev => {
      const selectingAll = !selectAll;
      if (selectingAll) return new Set(filtered.map(r => r.name));
      return new Set();
    });
  };

  const pageAllSelected = paged.length > 0 && paged.every(r => selected.has(r.name));
  const togglePageSelectAll = () => {
    setSelected(prev => {
      const n = new Set(prev);
      if (pageAllSelected) {
        paged.forEach(r => n.delete(r.name));
      } else {
        paged.forEach(r => n.add(r.name));
      }
      return n;
    });
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    const ok = window.confirm(`Supprimer définitivement ${selected.size} document(s) ?`);
    if (!ok) return;
    setNotice(null);
    try {
      const res = await deleteDocuments(Array.from(selected));
      if (res.errors && res.errors.length) {
        setNotice({ type: 'danger', message: `Supprimé: ${res.deleted}. Erreurs: ${res.errors.join(' | ')}` });
      } else {
        setNotice({ type: 'success', message: `Supprimé: ${res.deleted}` });
      }
      setLoading(true);
      try {
        const data = await fetchDocuments();
        setRows(Array.isArray(data) ? data : []);
        setSelected(new Set());
        setSelectAll(false);
      } finally {
        setLoading(false);
      }
    } catch (e) {
      setNotice({ type: 'danger', message: 'Erreur suppression: ' + e.message });
    }
  };

  const handleReprocess = async () => {
    const ok = window.confirm('Confirmer le recalcul complet de tout le corpus ? Cela peut prendre du temps.');
    if (!ok) return;

    setNotice(null);
    setReprocessLoading(true);
    setShowReprocessModal(true);
    setReprocessProgress(0);
    setReprocessElapsedTime(0);

    const abortController = new AbortController();
    setReprocessAbortController(abortController);

    const progressInterval = setInterval(() => {
      setReprocessProgress(p => Math.min(p + 5, 95));
    }, 500);

    try {
      const res = await fetch('/api/upload?reprocess_all=true', { 
        method: 'POST',
        signal: abortController.signal 
      });

      clearInterval(progressInterval);
      setReprocessProgress(100);

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: 'danger', message: `Erreur reprocess_all: ${json.error || res.status}` });
      } else {
        try {
          setLoading(true);
          const data = await fetchDocuments();
          setRows(Array.isArray(data) ? data : []);
        } finally {
          setLoading(false);
        }
        if (json.summary) {
          setNotice({ type: 'success', message: `Reprocess terminé. Nouveaux: ${json.summary.new || 0}, Mis à jour: ${json.summary.updated || 0}` });
        } else {
          setNotice({ type: 'success', message: 'Reprocess complet terminé.' });
        }
      }
    } catch (e) {
      clearInterval(progressInterval);
      if (e.name === 'AbortError') {
        setNotice({ type: 'info', message: 'Le retraitement a été annulé.' });
      } else {
        setNotice({ type: 'danger', message: `Exception reprocess_all: ${e.message}` });
      }
    } finally {
      setReprocessLoading(false);
      setShowReprocessModal(false);
      setReprocessAbortController(null);
    }
  };

  const cancelReprocess = () => {
    if (reprocessAbortController) {
      reprocessAbortController.abort();
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-3">📄 Documents (Admin)</h3>

      <div className="d-flex flex-wrap align-items-center mb-2 gap-2">
        <input
          className="form-control"
          style={{ maxWidth: 360 }}
          placeholder="Rechercher (nom, type, chemin)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="form-select" style={{ maxWidth: 220 }} value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)}>
          <option value="">Tous les types</option>
          {[...new Set(rows.map(r => r.type).filter(Boolean))].sort().map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0">Du</label>
          <input type="date" className="form-control" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
          <label className="form-label mb-0">Au</label>
          <input type="date" className="form-control" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
          <button className="btn btn-sm btn-outline-secondary" onClick={()=>{setDateFrom(""); setDateTo("");}}>Effacer dates</button>
        </div>
        {loading && <span className="text-primary">⏳ Chargement…</span>}
        {error && <span className="text-danger">❌ {error}</span>}
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={toggleSelectAll} disabled={filtered.length === 0}>
            {selectAll ? '☑ Tout' : '⬜ Tout'}
          </button>
          <button className="btn btn-outline-danger btn-sm" disabled={selected.size === 0} onClick={handleDeleteSelected}>🗑️ Supprimer ({selected.size})</button>
          <button className="btn btn-outline-info btn-sm" disabled={selected.size === 0} onClick={() => {
            const names = Array.from(selected);
            if (names.length === 0) return;
            let count = 0;
            names.forEach((name, idx) => {
              const row = rows.find(r => r.name === name);
              if (!row || !row.corpus_relpath) return;
              const url = getDownloadUrl(row.corpus_relpath);
              const a = document.createElement('a');
              a.href = url;
              a.download = row.name;
              document.body.appendChild(a);
              setTimeout(() => {
                a.click();
                document.body.removeChild(a);
              }, idx * 150);
              count++;
            });
            if (count === 0) setNotice({ type:'info', message:'Aucun fichier téléchargeable trouvé pour la sélection.'});
          }}>📥 Télécharger ({selected.size})</button>
          <button className="btn btn-outline-primary btn-sm" disabled={selected.size !== 1} onClick={() => {
            const name = Array.from(selected)[0];
            const row = rows.find(r => r.name === name);
            if (!row) return;
            if (!row.corpus_relpath) { setNotice({ type:'info', message:'Pas de chemin relatif pour visualiser.'}); return; }
            const url = getDownloadUrl(row.corpus_relpath);
            window.open(url, '_blank');
          }}>👁️ Voir (1)</button>
        </div>
        
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} py-2`} role="alert">{notice.message}</div>
      )}



      <div className="table-responsive" style={{ border: "1px solid #dee2e6", borderRadius: 6 }}>
        <table className="table table-sm table-striped table-hover mb-0" style={{ fontSize: "0.9rem" }}>
          <thead className="table-light" style={{ position: "sticky", top: 0, color: "#000" }}>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" checked={pageAllSelected} onChange={togglePageSelectAll} />
              </th>
              <th style={{ cursor: "pointer", color: "#000" }} onClick={() => setSortKey("name")}>Nom {sort.key==='name' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
              <th style={{ color: "#000" }}>Path</th>
              <th style={{ cursor: "pointer", color: "#000" }} onClick={() => setSortKey("size")}>Taille (Mo) {sort.key==='size' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
              <th style={{ cursor: "pointer", color: "#000" }} onClick={() => setSortKey("type")}>Type {sort.key==='type' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
              <th style={{ cursor: "pointer", color: "#000" }} onClick={() => setSortKey("num_pages")}>Pages {sort.key==='num_pages' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
              <th style={{ cursor: "pointer", color: "#000" }} onClick={() => setSortKey("word_count")}>Mots {sort.key==='word_count' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
              <th style={{ cursor: "pointer", color: "#000" }} onClick={() => setSortKey("characters")}>Caractères {sort.key==='characters' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
              <th style={{ cursor: "pointer", color: "#000" }} onClick={() => setSortKey("date_import")}>Date import {sort.key==='date_import' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="checkbox" checked={selected.has(row.name)} onChange={() => toggleSelect(row.name)} />
                </td>
                <td>{row.name}</td>
                <td><code style={{ fontSize: '0.8rem' }}>{row.path || '—'}</code></td>
<td>{typeof row.size === 'number' ? (row.size / (1024*1024)).toFixed(2) : '—'}</td>
                <td><span className="badge bg-secondary">{row.type || '—'}</span></td>
                <td>{row.num_pages ?? '—'}</td>
                <td>{row.word_count ?? '—'}</td>
                <td>{row.characters ?? '—'}</td>
                <td>{row.date_import || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted py-4">Aucun document</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>Page {currentPage} / {totalPages} — {filtered.length} élément(s)</div>
        <div className="btn-group">
          <button className="btn btn-sm btn-outline-primary" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p-1))}>Préc</button>
          {Array.from({length: totalPages}, (_,i)=>i+1).slice(Math.max(0, currentPage-3), Math.max(0, currentPage-3)+5).map(pn => (
            <button key={pn} className={`btn btn-sm ${pn===currentPage?'btn-primary':'btn-outline-primary'}`} onClick={() => setPage(pn)}>{pn}</button>
          ))}
          <button className="btn btn-sm btn-outline-primary" disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Suiv</button>
        </div>
      </div>
    </div>
  );
}
