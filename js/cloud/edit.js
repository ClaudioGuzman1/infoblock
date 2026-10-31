// ============================================================
// NUBE: editar y guardar registro
// ============================================================

// Convierte un registro de la Nube (snake_case) a los campos de una orden local (camelCase).
// No incluye id, imágenes ni firmas: cada llamador las resuelve a su manera.
function cloudRecordToOrder(record) {
  return {
    numeroTicket:     record.numero_ticket     || '',
    fechaAtencion:    record.fecha_atencion    || '',
    fechaCreacion:    record.fecha_creacion    || '',
    ingeniero:        record.ingeniero         || '',
    tipoServicio:     record.tipo_servicio     || '',
    incidencia:       record.incidencia        || '',
    cliente:          record.cliente           || '',
    ubicacion:        record.ubicacion         || '',
    direccion:        record.direccion         || '',
    contacto:         record.contacto          || '',
    cargo:            record.cargo             || '',
    telefono:         record.telefono          || '',
    correo:           record.correo            || '',
    nombreTerminal:   record.nombre_terminal   || '',
    solicitaTerminal: record.solicita_terminal || false,
    modeloTerminal:   record.modelo_terminal   || '',
    serieRetirada:    record.serie_retirada    || '',
    macRetirada:      record.mac_retirada      || '',
    fallaRetirada:    record.falla_retirada    || '',
    serieInstalada:   record.serie_instalada   || '',
    macInstalada:     record.mac_instalada     || '',
    solucion:         record.solucion          || '',
    comentario:       record.comentario        || '',
    // Entregas: puede ser array directo o null
    entregas: Array.isArray(record.entregas)
      ? { materiales: record.entregas }
      : (record.entregas && Array.isArray(record.entregas.materiales)
          ? record.entregas
          : { materiales: [] })
  };
}

async function editCloudOrder(record) {
  // Cerrar modal si estaba abierto
  const modal = document.getElementById('cloud-modal');
  if (modal) modal.style.display = 'none';

  showToast('☁️ Cargando evidencias y firmas…', '#6366f1');

  // Convertir URL pública → base64 para poder editar/mostrar en el formulario

  // Cargar imágenes de evidencias en cache temporal en memoria (no persiste en localStorage)
  window._tmpImgCache = new Map();
  const tmpImages = { inicial: [], mediciones: [], instalacion: [], extras: [] };
  for (const cat of ['inicial', 'mediciones', 'instalacion', 'extras']) {
    const items = record.imagenes?.[cat] || [];
    for (const item of items) {
      if (!item.url) continue;
      const b64 = await urlToBase64(item.url);
      if (!b64) continue;
      const tmpId = 'tmp_' + cat + '_' + item.orden + '_' + Date.now() + '_' + Math.random();
      window._tmpImgCache.set(tmpId, b64);
      tmpImages[cat].push(tmpId);
    }
  }

  // Cargar firmas existentes
  let firmaCliente   = null;
  let firmaIngeniero = null;
  if (record.firma_cliente)   firmaCliente   = await urlToBase64(record.firma_cliente);
  if (record.firma_ingeniero) firmaIngeniero = await urlToBase64(record.firma_ingeniero);

  // Mapear snake_case → camelCase igual que printCloudPDF_ODS
  const order = Object.assign({ id: null }, cloudRecordToOrder(record), {
    images:         tmpImages,
    firmaCliente:   firmaCliente,
    firmaIngeniero: firmaIngeniero,
  });

  appState.setState({
    currentOrder: order,
    cloudEditId:  record.id,
    view:         'form',
    tab:          'general'
  });
}

async function saveCloudOrder() {
  const order = appState.currentOrder;
  // Modo "copia local": la orden local guarda el id del registro de la Nube (cloudId)
  const localMode = !appState.cloudEditId && !!(order && order.cloudId);
  const cloudId = appState.cloudEditId || (order && order.cloudId);
  if (!cloudId) { showToast('⚠️ No hay registro de nube activo', '#ef4444'); return; }

  const SUPABASE_URL = window._SUPA_URL;
  const SUPABASE_KEY = window._SUPA_KEY;
  const BUCKET_NAME  = window._SUPA_BUCKET;

  // Helper: subir un archivo base64 a Supabase Storage y devolver URL pública

  try {
    // En copia local, primero se guardan los cambios en el dispositivo (no se pierden si falla la subida)
    if (localMode && order.id) db.updateOrder(order.id, order);

    showToast('☁️ Subiendo evidencias y firmas…', '#3b82f6');

    const ticketSlug = (order.numeroTicket || cloudId || Date.now()).toString().replace(/\s+/g, '_');
    const prefix      = `ods/${ticketSlug}`;

    // ── 1. Subir imágenes de evidencias vigentes (nuevas y ya existentes) ──
    async function subirCategoria(categoria) {
      const ids = order.images?.[categoria] || [];
      const urls = [];
      for (let i = 0; i < ids.length; i++) {
        const base64 = db.getImage(ids[i]);
        if (!base64) continue;
        const ext  = base64.startsWith('data:image/png') ? 'png' : 'jpg';
        const path = `${prefix}/${categoria}_${i + 1}.${ext}`;
        const url  = await supabaseUploadImage(base64, path);
        urls.push({ orden: i + 1, url });
      }
      return urls;
    }

    const [urlsInicial, urlsMediciones, urlsInstalacion, urlsExtras] = await Promise.all([
      subirCategoria('inicial'),
      subirCategoria('mediciones'),
      subirCategoria('instalacion'),
      subirCategoria('extras')
    ]);

    // ── 2. Subir firmas vigentes ─────────────────────────────────────
    let urlFirmaCliente   = null;
    let urlFirmaIngeniero = null;
    if (order.firmaCliente) {
      urlFirmaCliente = await supabaseUploadImage(order.firmaCliente, `${prefix}/firma_cliente.png`);
    }
    if (order.firmaIngeniero) {
      urlFirmaIngeniero = await supabaseUploadImage(order.firmaIngeniero, `${prefix}/firma_ingeniero.png`);
    }

    const payload = {
      // Generales
      numero_ticket:     order.numeroTicket  || null,
      fecha_atencion:    order.fechaAtencion || null,
      fecha_creacion:    order.fechaCreacion || null,
      ingeniero:         order.ingeniero     || null,
      tipo_servicio:     order.tipoServicio  || null,
      incidencia:        order.incidencia    || null,
      // Cliente / Sitio
      cliente:           order.cliente       || null,
      ubicacion:         order.ubicacion     || null,
      direccion:         order.direccion     || null,
      contacto:          order.contacto      || null,
      cargo:             order.cargo         || null,
      telefono:          order.telefono      || null,
      correo:            order.correo        || null,
      // Terminal
      nombre_terminal:   order.nombreTerminal   || null,
      solicita_terminal: order.solicitaTerminal  || false,
      modelo_terminal:   order.modeloTerminal    || null,
      // Retirada / Instalada
      serie_retirada:    order.serieRetirada  || null,
      mac_retirada:      order.macRetirada    || null,
      falla_retirada:    order.fallaRetirada  || null,
      serie_instalada:   order.serieInstalada || null,
      mac_instalada:     order.macInstalada   || null,
      // Solución
      solucion:          order.solucion    || null,
      comentario:        order.comentario  || null,
      // Entregas
      entregas: order.entregas && Array.isArray(order.entregas.materiales)
        ? order.entregas.materiales : [],
      // Evidencias (URLs públicas de Storage)
      imagenes: {
        inicial:     urlsInicial,
        mediciones:  urlsMediciones,
        instalacion: urlsInstalacion,
        extras:      urlsExtras
      },
      total_imagenes: urlsInicial.length + urlsMediciones.length +
                      urlsInstalacion.length + urlsExtras.length,
      // Firmas (URLs públicas de Storage)
      firma_cliente:         urlFirmaCliente,
      firma_ingeniero:       urlFirmaIngeniero,
      tiene_firma_cliente:   !!urlFirmaCliente,
      tiene_firma_ingeniero: !!urlFirmaIngeniero
    };

    showToast('☁️ Guardando en la Nube…', '#6366f1');
    const res = await cloudFetch(`/rest/v1/ods?id=eq.${cloudId}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    showToast('✅ Registro actualizado en la Nube');
    window._tmpImgCache = new Map();
    if (localMode && order.id) {
      db.updateOrder(order.id, { cloudSyncedAt: new Date().toISOString() });
      loadOrders();
    }
    appState.setState({ cloudEditId: null, view: 'supabase' });
    await loadCloudOrders();
    render();
  } catch (err) {
    console.error('❌ Error al guardar en la Nube:', err);
    showToast('⚠️ Error al guardar: ' + err.message, '#ef4444');
  }
}

// ------------------------------------------------------------
// COPIAR UN REGISTRO DE LA NUBE AL DISPOSITIVO
// Descarga TODAS las imágenes y firmas y crea una orden local editable,
// vinculada al registro (cloudId) para volver a subirla con "Guardar en Nube".
// ------------------------------------------------------------

// Descarga una imagen pública como dataURL. Devuelve null si falla (HTTP != 200 o no es imagen).
async function downloadCloudImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    let blob = await res.blob();
    if (/^(text\/|application\/json)/.test(blob.type || '')) return null; // página de error, no imagen
    if (!(blob.type || '').startsWith('image/')) {
      blob = blob.slice(0, blob.size, /\.png(\?|$)/i.test(url) ? 'image/png' : 'image/jpeg');
    }
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// Ejecuta fn sobre cada elemento con un máximo de `limit` tareas simultáneas (conserva el orden).
async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function copyCloudOrderToLocal(recordOrId) {
  // Los botones pasan solo el id (evita romper el HTML si el registro trae comillas)
  const record = (recordOrId && typeof recordOrId === 'object')
    ? recordOrId
    : (appState.cloudOrders || []).find(r => String(r.id) === String(recordOrId));
  if (!record) { showToast('⚠️ Registro de la Nube no encontrado', '#ef4444'); return; }
  const modal = document.getElementById('cloud-modal');
  if (modal) modal.style.display = 'none';

  const existing = db.getAllOrders().find(o => o.cloudId != null && String(o.cloudId) === String(record.id));
  if (existing && !confirm(
    `Ya existe una copia local de este ticket (#${existing.numeroTicket || record.id}).\n\n` +
    '¿Reemplazarla con la versión actual de la Nube?\nSe perderán los cambios locales que no hayas enviado.')) {
    showToast('Se conservó la copia local existente', '#6b7280');
    return;
  }

  // Lista de archivos a descargar: evidencias por categoría + firmas
  const cats = ['inicial', 'mediciones', 'instalacion', 'extras'];
  const jobs = [];
  cats.forEach(cat => {
    (record.imagenes?.[cat] || [])
      .filter(item => item && item.url)
      .slice().sort((a, b) => (a.orden || 0) - (b.orden || 0))
      .forEach(item => jobs.push({ kind: 'img', cat, url: item.url }));
  });
  if (record.firma_cliente)   jobs.push({ kind: 'firmaCliente',   url: record.firma_cliente });
  if (record.firma_ingeniero) jobs.push({ kind: 'firmaIngeniero', url: record.firma_ingeniero });

  showToast(`⬇️ Descargando ${jobs.length} archivo(s) de la Nube…`, '#6366f1');
  const downloaded = await mapWithLimit(jobs, 4, job => downloadCloudImage(job.url));

  // Todo o nada: si falta algo, no se crea la copia (al volver a subir se perdería en la Nube)
  const failed = downloaded.filter(d => !d).length;
  if (failed) {
    alert(`No se pudieron descargar ${failed} de ${jobs.length} archivo(s).\n\n` +
          'No se creó la copia local para no perder información al volver a subirla.\n' +
          'Revisa tu conexión e inténtalo de nuevo.');
    return;
  }

  const savedIds = [];
  try {
    const failuresBefore = db.images.failures || 0;
    const images = { inicial: [], mediciones: [], instalacion: [], extras: [] };
    let firmaCliente = null, firmaIngeniero = null;
    jobs.forEach((job, i) => {
      if (job.kind === 'firmaCliente')        firmaCliente = downloaded[i];
      else if (job.kind === 'firmaIngeniero') firmaIngeniero = downloaded[i];
      else {
        const id = 'img_' + Date.now() + '_' + Math.random();
        db.saveImage(id, downloaded[i]);
        savedIds.push(id);
        images[job.cat].push(id);
      }
    });
    await db.images.flush();
    if ((db.images.failures || 0) > failuresBefore) {
      throw new Error('No hay espacio suficiente en el dispositivo para guardar las imágenes');
    }

    const created = db.createOrder(Object.assign(cloudRecordToOrder(record), {
      images, firmaCliente, firmaIngeniero,
      cloudId:       record.id,
      cloudCopiedAt: new Date().toISOString(),
    }));
    if (existing) db.deleteOrder(existing.id);   // sustituye la copia anterior (y borra sus imágenes)
    loadOrders();

    showToast(`✅ Copia local creada · ${savedIds.length} imagen(es) descargadas` +
              (db.persistent ? '' : ' (⚠️ no se conservarán al cerrar la app)'));
    editOrder(JSON.parse(JSON.stringify(created)));
  } catch (err) {
    savedIds.forEach(id => db.images.delete(id));  // revertir
    console.error('❌ Error al copiar a local:', err);
    alert('No se pudo crear la copia local: ' + err.message);
  }
}
