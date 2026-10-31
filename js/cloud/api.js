// ============================================================
// NUBE: acceso a Supabase (REST + Storage) y listado
// ============================================================

function getSupabaseCreds() {
  // Lee las mismas constantes definidas dentro de generatePDF
  // Las exponemos globalmente aquí para reutilizarlas
  return {
    url: window._SUPA_URL || '',
    key: window._SUPA_KEY || ''
  };
}

// Inyectar credenciales globales (se setean la primera vez que generatePDF corre,
// pero también las guardamos al abrir la vista nube)
function ensureSupaCreds() {
  // Las credenciales ya están en window._SUPA_URL / _SUPA_KEY definidas al inicio
}

async function cloudFetch(path, opts = {}) {
  ensureSupaCreds();
  const { url, key } = getSupabaseCreds();
  if (!url || url.includes('TU_PROYECTO')) throw new Error('Falta SUPABASE_URL: edita window._SUPA_URL en el script');
  if (!key || key === 'TU_ANON_KEY') throw new Error('Falta SUPABASE_KEY: edita window._SUPA_KEY en el script');
  return fetch(`${url}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      ...(opts.headers || {})
    }
  });
}

async function loadCloudOrders() {
  appState.setState({ cloudLoading: true });
  try {
    const search = appState.cloudSearch.trim();
    const from = appState.cloudPage * appState.cloudPageSize;
    const to   = from + appState.cloudPageSize - 1;

    let filter = '';
    if (search) {
      filter = `&or=(numero_ticket.ilike.*${encodeURIComponent(search)}*,cliente.ilike.*${encodeURIComponent(search)}*,ingeniero.ilike.*${encodeURIComponent(search)}*)`;
    }

    const res = await cloudFetch(
      `/rest/v1/ods?select=*&order=created_at.desc&offset=${from}&limit=${appState.cloudPageSize}${filter}`,
      { headers: { 'Range-Unit': 'items', 'Range': `${from}-${to}`, 'Prefer': 'count=exact' } }
    );

    if (!res.ok) throw new Error(await res.text());

    const total = parseInt(res.headers.get('Content-Range')?.split('/')[1] || '0');
    const data  = await res.json();

    appState.cloudOrders = data;
    appState.cloudTotal  = total;
    appState.setState({ cloudLoading: false });
  } catch (err) {
    console.error('Error cargando nube:', err);
    appState.setState({ cloudLoading: false });
    alert('Error: ' + err.message);
  }
}

async function deleteCloudOrder(id) {
  if (!confirm('¿Eliminar esta ODS de la Nube? Esta acción no se puede deshacer.')) return;
  try {
    const res = await cloudFetch(`/rest/v1/ods?id=eq.${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    showToast('🗑️ ODS eliminada de la Nube');
    await loadCloudOrders();
    render();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

function openSupabaseView() {
  ensureSupaCreds();
  appState.setState({ view: 'supabase', cloudPage: 0, cloudSearch: '' });
  loadCloudOrders().then(() => render());
}

// Helpers compartidos (antes estaban copiados dentro de cada función)
async function urlToBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// Sube un archivo base64 a Supabase Storage y devuelve su URL pública
async function supabaseUploadImage(base64Data, path) {
  const SUPABASE_URL = window._SUPA_URL;
  const SUPABASE_KEY = window._SUPA_KEY;
  const BUCKET_NAME  = window._SUPA_BUCKET;
  const [meta, data] = base64Data.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });

  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${path}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': mime,
        'x-upsert': 'true'
      },
      body: blob
    }
  );
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Storage upload failed [${path}]: ${err}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}
