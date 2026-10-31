// ============================================================
// NUBE: reimprimir PDF desde un registro
// ============================================================

async function printCloudPDF_ODS(record) {
  showToast('⏳ Cargando imágenes desde la Nube…', '#3b82f6');

  // Convertir URL pública → base64 para jsPDF

  // Reconstruir objeto `order` compatible con generatePDF
  // Usar Map en memoria para no tocar localStorage (evita QuotaExceededError)
  window._tmpImgCache = new Map();
  const tmpImages = { inicial: [], mediciones: [], instalacion: [], extras: [] };

  for (const cat of ['inicial', 'mediciones', 'instalacion', 'extras']) {
    const items = record.imagenes?.[cat] || [];
    for (const item of items) {
      if (!item.url) continue;
      const b64 = await urlToBase64(item.url);
      if (!b64) continue;
      const tmpId = 'tmp_' + cat + '_' + item.orden + '_' + Date.now();
      window._tmpImgCache.set(tmpId, b64);   // solo en RAM, nunca en localStorage
      tmpImages[cat].push(tmpId);
    }
  }

  // Firmas
  let firmaCliente   = null;
  let firmaIngeniero = null;
  if (record.firma_cliente)    firmaCliente   = await urlToBase64(record.firma_cliente);
  if (record.firma_ingeniero)  firmaIngeniero = await urlToBase64(record.firma_ingeniero);

  // Mapear columnas snake_case → camelCase que usa generatePDF
  const order = {
    id:               record.id,
    numeroTicket:     record.numero_ticket     || '',
    fechaAtencion:    record.fecha_atencion    || '',
    fechaCreacion:    record.fecha_creacion    || '',
    ingeniero:        record.ingeniero         || '',
    tipoServicio:     record.tipo_servicio     || '',
    incidencia:       record.incidencia        || '',
    cliente:          record.cliente           || '',
    ubicacion:        record.ubicacion         || '',
    direccion:        record.direccion         || null,
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
    entregas:         record.entregas          || '',
    images:           tmpImages,
    firmaCliente,
    firmaIngeniero
  };

  generatePDF_ODS(order);
  // Liberar memoria del cache temporal
  window._tmpImgCache = new Map();
}

async function printCloudPDF_IDT(record) {
  showToast('⏳ Cargando imágenes desde la Nube…', '#3b82f6');

  // Convertir URL pública → base64 para jsPDF

  // Reconstruir objeto `order` compatible con generatePDF
  // Usar Map en memoria para no tocar localStorage (evita QuotaExceededError)
  window._tmpImgCache = new Map();
  const tmpImages = { inicial: [], mediciones: [], instalacion: [], extras: [] };

  for (const cat of ['inicial', 'mediciones', 'instalacion', 'extras']) {
    const items = record.imagenes?.[cat] || [];
    for (const item of items) {
      if (!item.url) continue;
      const b64 = await urlToBase64(item.url);
      if (!b64) continue;
      const tmpId = 'tmp_' + cat + '_' + item.orden + '_' + Date.now();
      window._tmpImgCache.set(tmpId, b64);   // solo en RAM, nunca en localStorage
      tmpImages[cat].push(tmpId);
    }
  }

  // Firmas
  let firmaCliente   = null;
  let firmaIngeniero = null;
  if (record.firma_cliente)    firmaCliente   = await urlToBase64(record.firma_cliente);
  if (record.firma_ingeniero)  firmaIngeniero = await urlToBase64(record.firma_ingeniero);

  // Mapear columnas snake_case → camelCase que usa generatePDF
  const order = {
    id:               record.id,
    numeroTicket:     record.numero_ticket     || '',
    fechaAtencion:    record.fecha_atencion    || '',
    fechaCreacion:    record.fecha_creacion    || '',
    ingeniero:        record.ingeniero         || '',
    tipoServicio:     record.tipo_servicio     || '',
    incidencia:       record.incidencia        || '',
    cliente:          record.cliente           || '',
    ubicacion:        record.ubicacion         || '',
    direccion:        record.direccion         || null,
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
    entregas:         record.entregas          || '',
    images:           tmpImages,
    firmaCliente,
    firmaIngeniero
  };

  generatePDF_IDT(order);
  // Liberar memoria del cache temporal
  window._tmpImgCache = new Map();
}

async function printCloudPDF_CDE(record) {
  showToast('⏳ Cargando imágenes desde la Nube…', '#3b82f6');

  // Convertir URL pública → base64 para jsPDF

  // Reconstruir objeto `order` compatible con generatePDF
  // Usar Map en memoria para no tocar localStorage (evita QuotaExceededError)
  window._tmpImgCache = new Map();
  const tmpImages = { inicial: [], mediciones: [], instalacion: [], extras: [] };

  for (const cat of ['inicial', 'mediciones', 'instalacion', 'extras']) {
    const items = record.imagenes?.[cat] || [];
    for (const item of items) {
      if (!item.url) continue;
      const b64 = await urlToBase64(item.url);
      if (!b64) continue;
      const tmpId = 'tmp_' + cat + '_' + item.orden + '_' + Date.now();
      window._tmpImgCache.set(tmpId, b64);   // solo en RAM, nunca en localStorage
      tmpImages[cat].push(tmpId);
    }
  }

  // Firmas
  let firmaCliente   = null;
  let firmaIngeniero = null;
  if (record.firma_cliente)    firmaCliente   = await urlToBase64(record.firma_cliente);
  if (record.firma_ingeniero)  firmaIngeniero = await urlToBase64(record.firma_ingeniero);

  // Mapear columnas snake_case → camelCase que usa generatePDF
  const order = {
    id:               record.id,
    numeroTicket:     record.numero_ticket     || '',
    fechaAtencion:    record.fecha_atencion    || '',
    fechaCreacion:    record.fecha_creacion    || '',
    ingeniero:        record.ingeniero         || '',
    tipoServicio:     record.tipo_servicio     || '',
    incidencia:       record.incidencia        || '',
    cliente:          record.cliente           || '',
    ubicacion:        record.ubicacion         || '',
    direccion:        record.direccion         || null,
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
    entregas:         record.entregas          || '',
    images:           tmpImages,
    firmaCliente,
    firmaIngeniero
  };

  generatePDF_CDE(order);
  // Liberar memoria del cache temporal
  window._tmpImgCache = new Map();
}
