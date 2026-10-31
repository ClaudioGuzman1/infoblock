// ============================================================
// PDF: CDE
// ============================================================

function generatePDF_CDE(order) {
  let imgBarra = PDF_ASSETS.imgBarra;
  // Reutilizar imgLogo de generatePDF_ODS no es posible aquí, así que se declara vacío
  // para no romper agregarCabeza. El logo se puede agregar igual que en ODS.
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'letter', true);

  // ── Dimensiones y tipografías ────────────────────────────────────
  const anchoLetter = pdf.internal.pageSize.getWidth();
  const altoLetter  = pdf.internal.pageSize.getHeight();
  const margin      = 14;
  const colRight    = anchoLetter - margin;
  const centerX     = anchoLetter / 2;

  const tipoTitulo    = 16;
  const tipoSubtitulo = 12;
  const tipoDato      = 10;
  const tipoLeyenda   = 6;

  const saltoMin  = 4;
  const saltoSenc = 6;
  const saltoDoble= 12;

  const setAzulOscuro = (p) => p.setTextColor(0, 51, 69);
  const setAzul       = (p) => p.setTextColor(0, 87, 130);
  const setNegro      = (p) => p.setTextColor(0, 0, 0);
  const setGris       = (p) => p.setTextColor(120, 120, 120);

  let yPos = 15;
  let paginaActual = 1;
  let totalPaginas = 1;

  // ── Pie de página ────────────────────────────────────────────────
  const yPosPie     = anchoLetter;
  const yPosLeyenda = (altoLetter / 64) * 62;

  function agregarPie(xPagina) {
    let y = yPosPie;
    pdf.setFontSize(tipoSubtitulo);
    setAzulOscuro(pdf);
    pdf.text('Por IBServices', centerX * 0.5, y, { align: 'center' });
    pdf.text('Recibido por', centerX * 1.5, y, { align: 'center' });
    y += saltoMin;
    if (order.firmaIngeniero) {
      pdf.addImage(order.firmaIngeniero, 'PNG', centerX * 0.5 - 30, y, 60, 30);
    }
    if (order.firmaCliente) {
      pdf.addImage(order.firmaCliente, 'PNG', centerX * 1.5 - 30, y, 60, 30);
    }
    y += 30 + saltoMin;
    pdf.setFontSize(tipoDato);
    setAzulOscuro(pdf);
    pdf.text((order.ingeniero || ' '), centerX * 0.5, y, { align: 'center' });
    pdf.text((order.contacto  || ' '), centerX * 1.5, y, { align: 'center' });
    pdf.setFontSize(tipoLeyenda);
    setGris(pdf);
    pdf.text(
      'Este comprobante acredita la recepción conforme de los materiales listados. La firma del receptor confirma que los artículos fueron recibidos en buen estado.',
      centerX, yPosLeyenda, { maxWidth: anchoLetter - margin * 2, align: 'center' }
    );
    const anchoBarra = 54;
    pdf.addImage(imgBarra, 'PNG', centerX - anchoBarra / 2, yPosLeyenda + 3, anchoBarra, 1);
    pdf.text(xPagina + ' de ' + totalPaginas, centerX, yPosLeyenda + 6.6,
      { maxWidth: anchoLetter - margin * 2, align: 'center' });
  }

  // ── Encabezado del documento ─────────────────────────────────────
  // Ticket y fecha (esquina superior derecha)
  pdf.setFontSize(tipoDato);
  setAzulOscuro(pdf);
  pdf.text('Ticket: ', centerX * 1.3, yPos, { align: 'right' });
  setAzul(pdf);
  pdf.text((order.numeroTicket || ' '), centerX * 1.3, yPos);
  yPos += saltoMin;
  setAzulOscuro(pdf);
  pdf.text('Fecha: ', centerX * 1.3, yPos, { align: 'right' });
  setAzul(pdf);
  pdf.text((order.fechaAtencion || ' '), centerX * 1.3, yPos);

  // Título principal
  yPos = 30;
  pdf.setFontSize(tipoTitulo);
  setAzulOscuro(pdf);
  pdf.text('Comprobante de Entrega de Materiales', centerX, yPos, { align: 'center' });

  // Línea divisoria
  yPos += saltoMin;
  pdf.setDrawColor(0, 87, 130);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, colRight, yPos);
  yPos += saltoDoble;

  // ── Datos del destinatario ───────────────────────────────────────
  pdf.setFontSize(tipoSubtitulo);
  setAzulOscuro(pdf);
  pdf.text('Datos del Destinatario', margin, yPos);
  yPos += saltoSenc;

  pdf.setFontSize(tipoDato);
  const col1 = margin;
  const col2 = anchoLetter / 2 + margin / 2;

  function fila2col(label1, val1, label2, val2) {
    setAzul(pdf);
    pdf.text(label1, col1, yPos);
    setNegro(pdf);
    pdf.text(val1 || '—', col1 + pdf.getTextWidth(label1) + 1, yPos);
    if (label2) {
      setAzul(pdf);
      pdf.text(label2, col2, yPos);
      setNegro(pdf);
      pdf.text(val2 || '—', col2 + pdf.getTextWidth(label2) + 1, yPos);
    }
    yPos += saltoSenc;
  }

  fila2col('Cliente: ',   order.cliente,   'Sitio: ',    order.ubicacion);
  fila2col('Contacto: ',  order.contacto,  'Cargo: ',    order.cargo);
  fila2col('Teléfono: ',  order.telefono,  'Dirección: ',order.direccion);
  fila2col('Ingeniero: ', order.ingeniero, '',           '');

  yPos += saltoMin;
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPos, colRight, yPos);
  yPos += saltoDoble;

  // ── Tabla de materiales ──────────────────────────────────────────
  pdf.setFontSize(tipoSubtitulo);
  setAzulOscuro(pdf);
  pdf.text('Lista de Materiales a Entregar', centerX, yPos, { align: 'center' });
  yPos += saltoSenc + 2;

  const materiales = (order.entregas && order.entregas.materiales)
    ? order.entregas.materiales : [];

  // Anchos de columnas (suma = colRight - margin)
  const tableWidth = colRight - margin;
  const colWidths = {
    cant:  tableWidth * 0.10,
    marca: tableWidth * 0.20,
    modelo:tableWidth * 0.22,
    serie: tableWidth * 0.22,
    obs:   tableWidth * 0.26,
  };
  const colX = {
    cant:  margin,
    marca: margin + colWidths.cant,
    modelo:margin + colWidths.cant + colWidths.marca,
    serie: margin + colWidths.cant + colWidths.marca + colWidths.modelo,
    obs:   margin + colWidths.cant + colWidths.marca + colWidths.modelo + colWidths.serie,
  };

  const rowHeight = 8;
  const headerH  = rowHeight + 2;

  // Encabezado de la tabla
  pdf.setFillColor(0, 87, 130);
  pdf.setTextColor(255, 255, 255);
  pdf.rect(margin, yPos, tableWidth, headerH, 'F');
  pdf.setFontSize(tipoDato - 1);
  pdf.setFont(undefined, 'bold');
  const headerY = yPos + headerH / 2 + 1.5;
  pdf.text('Cant.',  colX.cant   + colWidths.cant   / 2, headerY, { align: 'center' });
  pdf.text('Marca',  colX.marca  + colWidths.marca  / 2, headerY, { align: 'center' });
  pdf.text('Modelo', colX.modelo + colWidths.modelo / 2, headerY, { align: 'center' });
  pdf.text('N° Serie',colX.serie + colWidths.serie  / 2, headerY, { align: 'center' });
  pdf.text('Observaciones', colX.obs + colWidths.obs / 2, headerY, { align: 'center' });
  pdf.setFont(undefined, 'normal');
  yPos += headerH;

  if (materiales.length === 0) {
    // Fila vacía de aviso
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(tipoDato);
    pdf.setDrawColor(220, 220, 220);
    pdf.rect(margin, yPos, tableWidth, rowHeight);
    pdf.text('Sin materiales registrados', centerX, yPos + rowHeight / 2 + 1.5, { align: 'center' });
    yPos += rowHeight;
  } else {
    pdf.setFontSize(tipoDato - 1);
    pdf.setDrawColor(200, 200, 200);
    materiales.forEach((item, idx) => {
      // Verificar si necesitamos nueva página
      if (yPos + rowHeight > altoLetter - 50) {
        agregarPie(paginaActual);
        pdf.addPage();
        paginaActual++;
        totalPaginas++;
        pdf.setPage(paginaActual);
        yPos = 20;
        // Re-dibujar encabezado de tabla en nueva página
        pdf.setFillColor(0, 87, 130);
        pdf.setTextColor(255, 255, 255);
        pdf.rect(margin, yPos, tableWidth, headerH, 'F');
        pdf.setFont(undefined, 'bold');
        const hY2 = yPos + headerH / 2 + 1.5;
        pdf.text('Cant.',   colX.cant   + colWidths.cant   / 2, hY2, { align: 'center' });
        pdf.text('Marca',   colX.marca  + colWidths.marca  / 2, hY2, { align: 'center' });
        pdf.text('Modelo',  colX.modelo + colWidths.modelo / 2, hY2, { align: 'center' });
        pdf.text('N° Serie',colX.serie  + colWidths.serie  / 2, hY2, { align: 'center' });
        pdf.text('Observaciones', colX.obs + colWidths.obs / 2, hY2, { align: 'center' });
        pdf.setFont(undefined, 'normal');
        yPos += headerH;
      }

      const fillColor = idx % 2 === 0 ? [255, 255, 255] : [240, 248, 255];
      pdf.setFillColor(...fillColor);
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, yPos, tableWidth, rowHeight, 'FD');

      setNegro(pdf);
      const cellY = yPos + rowHeight / 2 + 1.5;
      pdf.text(String(item.cantidad || 1),  colX.cant   + colWidths.cant   / 2, cellY, { align: 'center' });
      pdf.text(item.marca  || '—', colX.marca  + 1, cellY);
      pdf.text(item.modelo || '—', colX.modelo + 1, cellY);
      pdf.text(item.serie  || '—', colX.serie  + 1, cellY);

      // Observaciones pueden ser largas: recortar con splitTextToSize
      const obsLines = pdf.splitTextToSize(item.observaciones || '—', colWidths.obs - 2);
      pdf.text(obsLines[0], colX.obs + 1, cellY);

      yPos += rowHeight;
    });
  }

  // Total de ítems
  yPos += saltoMin;
  pdf.setFontSize(tipoDato);
  setAzulOscuro(pdf);
  pdf.text(`Total de materiales: ${materiales.length}`, colRight, yPos, { align: 'right' });
  yPos += saltoDoble;

  // ── Observaciones generales ──────────────────────────────────────
  if (order.comentario) {
    pdf.setFontSize(tipoSubtitulo);
    setAzulOscuro(pdf);
    pdf.text('Observaciones', margin, yPos);
    yPos += saltoSenc;
    pdf.setFontSize(tipoDato);
    setNegro(pdf);
    const obsLines = pdf.splitTextToSize(order.comentario, tableWidth);
    pdf.text(obsLines, margin, yPos);
    yPos += obsLines.length * saltoSenc + saltoMin;
  }

  // ── Pie en todas las páginas ─────────────────────────────────────
  const pageCount = pdf.internal.getNumberOfPages();
  totalPaginas = pageCount;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    agregarPie(i);
  }

  // ── Guardar y abrir ──────────────────────────────────────────────
  const fileName = 'CDE_' + (order.numeroTicket || order.id) + '.pdf';
  pdf.save(fileName);
  const blobUrl = pdf.output('bloburl');

  // ── Sincronizar con Supabase ─────────────────────────────────────
  const SUPABASE_URL = window._SUPA_URL;
  const SUPABASE_KEY = window._SUPA_KEY;

  (async () => {
    try {
      showToast('☁️ Sincronizando CDE con la Nube…', '#3b82f6');

      const ticketSlug = (order.numeroTicket || order.id || Date.now())
        .toString().replace(/\s+/g, '_');

      const odsJson = {
        generado_en:   new Date().toISOString(),
        archivo_pdf:   fileName,
        local_id:      order.id           || null,
        numero_ticket: order.numeroTicket || null,
        fecha_atencion:order.fechaAtencion|| null,
        ingeniero:     order.ingeniero    || null,
        cliente:       order.cliente      || null,
        ubicacion:     order.ubicacion    || null,
        direccion:     order.direccion    || null,
        contacto:      order.contacto     || null,
        cargo:         order.cargo        || null,
        telefono:      order.telefono     || null,
        correo:        order.correo       || null,
        solucion:      order.solucion     || null,
        comentario:    order.comentario   || null,

        // Entregas / Materiales
        entregas: order.entregas && order.entregas.materiales
          ? order.entregas.materiales : [],

        // Firmas (URLs públicas de Storage)
        firma_cliente:          null,
        firma_ingeniero:        null,
        tiene_firma_cliente:    false,
        tiene_firma_ingeniero:  false
      };

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/ods`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':         SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer':        'return=representation'
        },
        body: JSON.stringify(odsJson)
      });

      if (!insertRes.ok) {
        const errText = await insertRes.text();
        throw new Error(`DB insert failed: ${errText}`);
      }
      const saved = await insertRes.json();
      console.log('✅ CDE guardado en la Nube:', saved);
      showToast('✅ CDE sincronizado con la Nube');

    } catch (err) {
      console.error('❌ Error al sincronizar CDE:', err);
      showToast('⚠️ Error al sincronizar CDE (ver consola)', '#ef4444');
      try {
        const pendientes = JSON.parse(
          localStorage.getItem('ods_pendientes_sync') || '[]'
        );
        pendientes.push({
          order_id:  order.id,
          ticket:    order.numeroTicket,
          timestamp: new Date().toISOString(),
          error:     err.message
        });
        localStorage.setItem('ods_pendientes_sync', JSON.stringify(pendientes));
      } catch (e) { /* ignorar */ }
    }
  })();

  window.open(blobUrl, '_blank');
}
