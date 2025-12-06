// Use relative paths so `proxy` in package.json routes to backend (/api)
const API_BASE = "/api";

function getRoleHeader() {
  const role = localStorage.getItem('userRole');
  return role ? { 'X-Role': role } : {};
}

export async function uploadFiles(files) {
  const formData = new FormData();
  for (let f of files) formData.append("files", f);

  // Backend route is /api/upload (no /admin prefix)
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: getRoleHeader(),
    body: formData,
  });

  if (!res.ok) throw new Error("Erreur lors de l'upload");
  return await res.json();
}

export async function fetchVisualisation() {
  const response = await fetch(`${API_BASE}/admin/stats`, { headers: getRoleHeader() });
  if (!response.ok) throw new Error("Erreur lors du chargement de la visualisation");
  return await response.json();
}

export async function fetchImportStats() {
  // Reuse admin/stats and convert to relations array expected by RelationsGraph
  const response = await fetch(`${API_BASE}/admin/stats`, { headers: getRoleHeader() });
  if (!response.ok) throw new Error("Erreur lors du chargement des statistiques d'import");
  const stats = await response.json();
  const by_date = stats.by_date || { labels: [], data: [] };
  const relations = (by_date.labels || []).map((d, i) => ({
    date: d,
    count: (by_date.data && by_date.data[i]) || 0,
    size: 0,
    types: {}
  }));
  return relations;
}

export async function fetchDocuments(filters) {
  const role = localStorage.getItem('userRole');
  if (role === 'admin') {
    // Admin list endpoint
    let url = `${API_BASE}/admin/files`;
    if (filters && (filters.q)) {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      url += `?${params.toString()}`;
    }
    const resp = await fetch(url, { headers: getRoleHeader() });
    if (!resp.ok) throw new Error("Erreur lors du chargement de la liste des documents (admin)");
    return await resp.json();
  }

  // Public documents endpoint for clients
  let url = `${API_BASE}/documents`;
  if (filters && (filters.q || filters.type || filters.date_from || filters.date_to)) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.type) params.set('type', filters.type);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    url += `?${params.toString()}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erreur lors du chargement de la liste des documents");
  return await response.json();
}

export async function deleteDocuments(names) {
  // Backend exposes /api/admin/delete for single filename; call it per name
  const roleHeader = getRoleHeader();
  const results = { deleted: 0, errors: [] };
  for (const name of names) {
    try {
      const res = await fetch(`${API_BASE}/admin/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...roleHeader },
        body: JSON.stringify({ filename: name })
      });
      if (!res.ok) {
        const js = await res.json().catch(() => ({}));
        results.errors.push(`${name}: ${js.error || res.status}`);
      } else {
        results.deleted += 1;
      }
    } catch (e) {
      results.errors.push(`${name}: ${e.message}`);
    }
  }
  return results;
}

export function getDownloadUrl(relpath) {
  // Use admin download endpoint
  return `${API_BASE}/admin/download?path=${encodeURIComponent(relpath)}`;
}
