// ============================================================
// PDF: IDT
// ============================================================

function generatePDF_IDT(order) {
  let xin1 = document.querySelector("#TPH")?.value || "4in1";
  //alert(xin1);
  let imgBarra = PDF_ASSETS.imgBarra;
  let imgLogo = PDF_ASSETS.imgLogo;
  let img_blnkpxl_png = PDF_ASSETS.img_blnkpxl_png;
  let img_blnkpxl_jpg = PDF_ASSETS.img_blnkpxl_jpg;
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'letter', true);

  //Dimensiones y saltos
  const anchoLetter = pdf.internal.pageSize.getWidth();
  const altoLetter = pdf.internal.pageSize.getHeight();
  const saltoLineaMinimo = 4;
  const saltoLineaSencilla = 6;
  const saltoLineaDoble = 12;
  let yPosGraf = 55;
  let celdaAlto = 5.5;

  //Tañaños de texto
  const tipoTitulo = 16;
  const tipoSubtitulo = 12;
  const tipoDato = 10;
  const tipoLeyenda = 6;
  //Colores
  const setAzulOscuro = (pdf) => pdf.setTextColor('#003345');
  const setAzul = (pdf) => pdf.setTextColor('#005782');
  const setNegro = (pdf) => pdf.setTextColor('#000000');
  const setBlanco = (pdf) => pdf.setTextColor('#FFFFFF');
  const setGris = (pdf) => pdf.setTextColor('#BFBFBF');
  const colorAzul = ['#005782'];
  const colorAzulOscuro = ['#003345'];
  const colorNegro = ['#000000'];
  const colorBlanco = ['#FFFFFF'];
  const colorVerde = ['#008894'];
  const colorGris = ['#BFBFBF'];
  //Posiciones horizontales
  const xPosA = (anchoLetter / 48) * 5;
  const xPosB = (anchoLetter / 16) * 3;
  const xPosC = (anchoLetter / 4) * 1;
  const xPosD = (anchoLetter / 2) * 1;
  const xPosE = (anchoLetter / 4) * 3;
  const xPosEyF = (anchoLetter / 16) * 13;
  const xPosF = (anchoLetter / 48) * 45;
  const xPosMitad = (anchoLetter / 2) - xPosA;
  //Posiciones verticales
  const yPosPie = anchoLetter;
  const yPosLeyenda = (altoLetter / 64) * 62;

  let yPos = 15;
  let paginaActual = 1;
  let totalPaginas = 1;

  function agregarCabeza(Mostrar = 0) {
    if (Mostrar) {
      yPosCabeza += saltoLineaDoble;
      setAzulOscuro(pdf);
      pdf.setFontSize(tipoSubtitulo);
      pdf.text('Evidencia de instalación', xPosD, 25, "center");

    }
  };

  function agregarFirmaAlPie(xPagina = 1) {
    yPos = yPosPie;
    pdf.setFontSize(tipoSubtitulo);
    setGris(pdf);
//        pdf.text('Por IBServices', xPosC, yPos, { align: 'center' });
    pdf.text('Por IBServices', xPosD, yPos, { align: 'center' });
//        pdf.text('Por Cliente', xPosE, yPos, { align: 'center' });
    setAzulOscuro(pdf);
    yPos += saltoLineaMinimo;
    if (order.firmaIngeniero) {
//          pdf.addImage(order.firmaIngeniero, 'PNG', xPosC - 30, yPos, 60, 30);
      pdf.addImage(order.firmaIngeniero, 'PNG', xPosMitad, yPos, 60, 30);
    }
//        if (order.firmaCliente) {
//          pdf.addImage(order.firmaCliente, 'PNG', xPosE - 30, yPos, 60, 30);
//        }
    yPos += 30 + saltoLineaMinimo;
    pdf.setFontSize(tipoDato);
    setAzulOscuro(pdf);
    pdf.text((order.ingeniero || ' '), xPosD, yPos, { align: 'center' });
//        pdf.text((order.contacto || ' '), xPosE, yPos, { align: 'center' });
    yPos += 30 + saltoLineaMinimo;
    pdf.setFontSize(tipoLeyenda);
    pdf.text('Estmado cliente, revise y lea detenidamente este ticket de servicio. Su firma representa la aceptación de los trabajos aquí descritos a su entera satisfacción. Gracias', xPosD, yPosLeyenda, { maxWidth: (xPosE - xPosC), align: 'center' });
    divis = 1; // factor de redimensionamiento
    let anchoBarra = 54;
    pdf.addImage(imgBarra, 'PNG', xPosD - (anchoBarra / 2), yPosLeyenda + 3, anchoBarra, 1);
    pdf.text(xPagina + ' de ' + totalPaginas, xPosD, yPosLeyenda + 6.6, { maxWidth: (xPosE - xPosC), align: 'center' });
  };

  function agregarPie(xPagina = 1) {
    yPos = yPosPie;
    pdf.setFontSize(tipoLeyenda);
    setAzulOscuro(pdf);
    divis = 1; // factor de redimensionamiento
    let anchoBarra = 54;

    pdf.addImage(imgBarra, 'PNG', xPosD - (anchoBarra / 2), yPosLeyenda + 3, anchoBarra, 1);

    pdf.text(xPagina + ' de ' + totalPaginas, xPosD, yPosLeyenda + 6.6, { align: 'center' });

  };

  // Encabezado
  let yPosCabeza = 10;
  let divis = 15; // factor de redimensionamiento
  pdf.addImage(imgLogo, 'PNG', xPosE, yPosCabeza / 2, 725 / divis, 236 / divis, compression = 'SLOW');

  pdf.setFontSize(tipoDato);
  yPosCabeza += saltoLineaMinimo;
  setAzulOscuro(pdf);
  pdf.text('Fecha: ', xPosA, yPosCabeza, "right");
  setAzul(pdf);
  pdf.text((order.fechaAtencion || ' '), (xPosA), yPosCabeza);

  yPos += saltoLineaDoble * 2;
  pdf.setFontSize(tipoTitulo * 1.5);
  setAzulOscuro(pdf);
  pdf.text('Instalación de terminal Libera 7', xPosD, yPos, { align: 'center' });

  yPos += saltoLineaDoble;
  pdf.setFontSize(tipoSubtitulo);
  setAzulOscuro(pdf);
  pdf.text('Datos del proyecto:', xPosA, yPos);

  pdf.setDrawColor(...colorGris);
  pdf.setFillColor(...colorAzulOscuro);

  pdf.rect(xPosA, yPosGraf, xPosC, celdaAlto, 'FD');
  pdf.rect(xPosA, yPosGraf, xPosEyF, celdaAlto, 'D');
  yPosGraf += celdaAlto;
  pdf.rect(xPosA, yPosGraf, xPosC, celdaAlto, 'FD');
  pdf.rect(xPosA, yPosGraf, xPosEyF, celdaAlto, 'D');
  yPosGraf += celdaAlto;
  pdf.rect(xPosA, yPosGraf, xPosC, celdaAlto, 'FD');
  pdf.rect(xPosA, yPosGraf, xPosEyF, celdaAlto, 'D');
  yPosGraf += celdaAlto;
  pdf.rect(xPosA, yPosGraf, xPosMitad, celdaAlto, 'FD');
  pdf.rect((anchoLetter / 2), yPosGraf, (xPosF - xPosA) / 2, celdaAlto, 'FD');
  yPosGraf += celdaAlto;
  pdf.setFillColor(...colorAzul);
  pdf.rect((anchoLetter / 2), yPosGraf, (xPosEyF - xPosMitad), celdaAlto, 'FD');
  yPosGraf += celdaAlto;
  pdf.rect((anchoLetter / 2), yPosGraf, (xPosEyF - xPosMitad), celdaAlto, 'FD');
  yPosGraf += celdaAlto;
  pdf.rect((anchoLetter / 2), yPosGraf, (xPosEyF - xPosMitad), celdaAlto, 'FD');
  
  pdf.rect(xPosA, yPosGraf - (celdaAlto * 2), xPosMitad, celdaAlto * 3, 'D');
  
  yPos += saltoLineaSencilla * 1.3;

  pdf.setFontSize(tipoDato);
  setBlanco(pdf);
  pdf.text('Cliente: ', xPosA + 10, yPos);
  setAzulOscuro(pdf);
  pdf.text((order.cliente || ' '), xPosMitad, yPos);

  yPos += saltoLineaSencilla - 0.5;
  setBlanco(pdf);
  pdf.text('Nombre del sitio: ', xPosA + 10, yPos);
  setAzulOscuro(pdf);
  pdf.text((order.ubicacion || ' '), xPosMitad, yPos);
  
  yPos += saltoLineaSencilla - 0.5;
  setBlanco(pdf);
  pdf.text('Dirección: ', xPosA + 10, yPos);
  setAzulOscuro(pdf);
  pdf.text((order.direccion || ' '), xPosMitad, yPos);
  
  setBlanco(pdf);
  yPos += saltoLineaSencilla - 0.5;
  pdf.text('Ingeniero de Campo ', xPosMitad / 2 + (xPosA), yPos, 'center');
  pdf.text('Contacto en sitio ', xPosMitad * 1.5 + (xPosA), yPos, 'center');
  
  yPos += saltoLineaSencilla - 0.5;
  pdf.text('Nombre: ', xPosD + 3 , yPos, 'left');
  pdf.text((order.contacto || ' '), (xPosD + 18), yPos), 'left';
  
  yPos += saltoLineaSencilla - 0.5;
  setAzulOscuro(pdf);
  pdf.text((order.ingeniero || ' '), xPosMitad / 2 + (xPosA), yPos, 'center');

  setBlanco(pdf);
  pdf.text('Cargo: ', xPosD + 3, yPos, 'left');
  pdf.text((order.cargo || ' '), (xPosD + 18), yPos), 'left';
  yPos += saltoLineaSencilla - 0.5;
  pdf.text('Correo: ', xPosD + 3, yPos, 'left');
  pdf.text((order.correo || ' '), (xPosD + 18), yPos), 'left';
  
  let cTerm = 0;
  
  yPos += saltoLineaDoble;
  if (order.nombreTerminal){
    cTerm++;
    setAzul(pdf);
    pdf.text('Nombre de la terminal: ', xPosA, yPos);
    setAzulOscuro(pdf);
    pdf.text((order.nombreTerminal || ''), (xPosC + 5), yPos);
    yPos += saltoLineaSencilla;
  }
  
  if (order.serieInstalada){
    cTerm++;
    setAzul(pdf);
    pdf.text('Número de Serie: ', xPosA, yPos);
    setAzulOscuro(pdf);
    pdf.text((order.serieInstalada || ''), (xPosC + 5), yPos);
    yPos += saltoLineaSencilla;
  }
  
  if (order.macInstalada){
    cTerm++;
    setAzul(pdf);
    pdf.text('Dirección MAC: ', xPosA, yPos);
    setAzulOscuro(pdf);
    pdf.text((order.macInstalada || ''), (xPosC + 5), yPos);
    yPos += saltoLineaSencilla ;
  }
  
  yPos += saltoLineaSencilla ;
  pdf.setFontSize(tipoSubtitulo);
  setAzul(pdf);
  pdf.text('Comentario de la instalación', xPosD, yPos, { align: 'center' });
  
  yPos += saltoLineaSencilla;
  setAzulOscuro(pdf);

  const AnchoMaximoSolución = xPosF - xPosA;
  const text = order.solucion || ' ';

  // --- LÓGICA DE AJUSTE AUTOMÁTICO ---
  let factor = 1; // Factor inicial
  let AltoTotalSolucion = 0;
  let fuenteSolucion = 0;
  let limite = 105 + ((tipoDato * 3 * 1.5) - (tipoDato * cTerm * 1.5));
  let LineasSolucion = [];
  
  setNegro(pdf);
  for (let f = factor; f > 0.1; f -= 0.05) {
      fuenteSolucion = tipoDato * f;
      pdf.setFontSize(fuenteSolucion);
 
      LineasSolucion = pdf.splitTextToSize(text, AnchoMaximoSolución);
 
      let AltoLinea = (fuenteSolucion * 0.3527) * 1.5; 
      AltoTotalSolucion = LineasSolucion.length * AltoLinea;

      if (AltoTotalSolucion <= limite) {
          factor = f; 
          break;
      }
  }

  // --- RENDERIZADO ---
  pdf.setFontSize(fuenteSolucion);

  pdf.text((order.solucion || ' '), (xPosA), yPos, { maxWidth: (xPosF - xPosA), align: 'left' });
  yPos = altoLetter * 0.6;
  yPos += saltoLineaDoble;
  pdf.setFontSize(tipoDato);
  setAzul(pdf);
//      pdf.text('Equipo retirado', xPosC, yPos, "center");
//      pdf.text('Equipo instalado', xPosE, yPos, "center");
  yPos += saltoLineaMinimo;
  setAzul(pdf);
//      pdf.text('N° de serie: ', xPosA, yPos);
  setAzulOscuro(pdf);
//      pdf.text((order.serieRetirada.toUpperCase() || '---'), (xPosB) + 3, yPos);
  setAzul(pdf);
//      pdf.text('N° de serie: ', xPosD + xPosA, yPos);
  setAzulOscuro(pdf);
//      pdf.text((order.serieInstalada.toUpperCase() || '---'), (xPosD + xPosA + (xPosB - xPosA)) + 3, yPos);
  yPos += saltoLineaMinimo;
  setAzul(pdf);
//      pdf.text('MAC: ', xPosA, yPos);
  setAzulOscuro(pdf);
//      pdf.text((order.macRetirada.toUpperCase() || '---'), (xPosB) + 3, yPos);
  setAzul(pdf);
//      pdf.text('MAC: ', xPosD + xPosA, yPos);
  setAzulOscuro(pdf);
//      pdf.text((order.macInstalada.toUpperCase() || '---'), (xPosD + xPosA + (xPosB - xPosA)) + 3, yPos);
  yPos += saltoLineaDoble;
  pdf.setFontSize(tipoSubtitulo);
  setAzul(pdf);
//      pdf.text('Comentarios del cliente', xPosD, yPos, { align: 'center' });
  yPos += saltoLineaSencilla;
  pdf.setFontSize(tipoDato);
  setNegro(pdf);
//      pdf.text((order.comentario || ' '), (xPosA), yPos, { maxWidth: (xPosF - xPosA), align: 'justify' });
  //      agregarPie();
  const allImages = [];
  if (order.images) {
    //Combo de nueva página
    Object.keys(order.images).forEach(key => {
      (order.images[key] || []).forEach(imgId => {
        const imgData = db.getImage(imgId);
        if (imgData) allImages.push(imgData);
      });
    });
  }
  if (xin1 == "4in1") {
    if (allImages.length > 0) {
      pdf.addPage();
      paginaActual++;
      totalPaginas++;
      pdf.setPage(paginaActual);
      agregarCabeza(1);
      yPos = 50;

      for (let i = 0; i < allImages.length; i += 4) {
        const maxHeight = (108 * 0.53);
        const maxWidth = (192 * 0.53);
        let img1 = allImages[i];
        let img2 = allImages[i + 1];
        let img3 = allImages[i + 2];
        let img4 = allImages[i + 3];
        let img5 = allImages[i + 4];
        if (!img2) img2 = img_blnkpxl_jpg;
        if (!img3) img3 = img_blnkpxl_jpg;
        if (!img4) img4 = img_blnkpxl_jpg;
        let imgProps1 = pdf.getImageProperties(img1);
        let imgProps2 = pdf.getImageProperties(img2);
        let imgProps3 = pdf.getImageProperties(img3);
        let imgProps4 = pdf.getImageProperties(img4);
        const newWidth1 = (maxHeight * imgProps1.width) / imgProps1.height;
        const newWidth2 = (maxHeight * imgProps2.width) / imgProps2.height;
        const newWidth3 = (maxHeight * imgProps3.width) / imgProps3.height;
        const newWidth4 = (maxHeight * imgProps4.width) / imgProps4.height;
        const newHeight1 = (maxWidth * imgProps1.height) / imgProps1.width;
        const newHeight2 = (maxWidth * imgProps2.height) / imgProps2.width;
        const newHeight3 = (maxWidth * imgProps3.height) / imgProps3.width;
        const newHeight4 = (maxWidth * imgProps4.height) / imgProps4.width;
        let eviAlto1 = imgProps1.height; let eviAncho1 = imgProps1.width;
        let eviAlto2 = imgProps2.height; let eviAncho2 = imgProps2.width;
        let eviAlto3 = imgProps3.height; let eviAncho3 = imgProps3.width;
        let eviAlto4 = imgProps4.height; let eviAncho4 = imgProps4.width;
        if (img1) { if (imgProps1.width > maxWidth) { eviAncho1 = maxWidth; eviAlto1 = newHeight1; } }
        if (img2) { if (imgProps2.width > maxWidth) { eviAncho2 = maxWidth; eviAlto2 = newHeight2; } }
        if (img3) { if (imgProps3.width > maxWidth) { eviAncho3 = maxWidth; eviAlto3 = newHeight3; } }
        if (img4) { if (imgProps4.width > maxWidth) { eviAncho4 = maxWidth; eviAlto4 = newHeight4; } }
        if (img1) { if (imgProps1.height > maxHeight) { eviAlto1 = maxHeight; eviAncho1 = newWidth1; } }
        if (img2) { if (imgProps2.height > maxHeight) { eviAlto2 = maxHeight; eviAncho2 = newWidth2; } }
        if (img3) { if (imgProps3.height > maxHeight) { eviAlto3 = maxHeight; eviAncho3 = newWidth3; } }
        if (img4) { if (imgProps4.height > maxHeight) { eviAlto4 = maxHeight; eviAncho4 = newWidth4; } }
        if (img1) pdf.addImage(img1, 'JPEG', xPosC - (eviAncho1 / 2) + 2, yPos, eviAncho1, eviAlto1);
        if (img2) pdf.addImage(img2, 'JPEG', xPosE - (eviAncho2 / 2) - 2, yPos, eviAncho2, eviAlto2);
        yPos += eviAlto2 + saltoLineaDoble * 2;
        if (img3) pdf.addImage(img3, 'JPEG', xPosC - (eviAncho3 / 2) + 2, yPos, eviAncho3, eviAlto3);
        if (img4) pdf.addImage(img4, 'JPEG', xPosE - (eviAncho4 / 2) - 2, yPos, eviAncho4, eviAlto4);
        if (img5) {
          //Combo de nueva página
          pdf.addPage();
          yPos = 50;
          paginaActual++;
          totalPaginas++;
          pdf.setPage(paginaActual);
        }
      }
    }
  } else {
    if (allImages.length > 0) {
      pdf.addPage();
      yPos = 30;
      paginaActual++;
      totalPaginas++;
      pdf.setPage(paginaActual);
      agregarCabeza(1);
      for (let i = 0; i < allImages.length; i += 2) {
        const maxHeight = 108 * 0.75;
        let img1 = allImages[i];
        let img2 = allImages[i + 1];
        let img3 = allImages[i + 2];
        if (!img2) img2 = img_blnkpxl_jpg;
        let imgProps1 = pdf.getImageProperties(img1);
        let imgProps2 = pdf.getImageProperties(img2);
        const newWidth1 = (maxHeight * imgProps1.width) / imgProps1.height;
        const newWidth2 = (maxHeight * imgProps2.width) / imgProps2.height;
        const newHeight1 = maxHeight;
        let eviAlto1 = imgProps1.height;
        let eviAncho1 = imgProps1.width;
        if (imgProps1.height > maxHeight) {
          eviAlto1 = maxHeight;
          eviAncho1 = newWidth1;
        }
        if (imgProps2.height > maxHeight) {
          eviAlto2 = maxHeight;
          eviAncho2 = newWidth2;
        }
        if (img1) pdf.addImage(img1, 'JPEG', xPosD - (eviAncho1 / 2), yPos, eviAncho1, eviAlto1);
        if (img2) pdf.addImage(img2, 'JPEG', xPosD - (eviAncho2 / 2), yPos + eviAlto2 + saltoLineaDoble, eviAncho2, eviAlto2);
        if (img3) {
          //Combo de nueva página
          pdf.addPage();
          yPos = 30;
          paginaActual++;
          totalPaginas++;
          pdf.setPage(paginaActual);
        }
      }
    }
  }
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    if(i >1){agregarCabeza(1);}
    agregarPie(i);
    agregarFirmaAlPie();
  }

  const fileName = 'IDT_' + (order.numeroTicket || 'Ticket') + '_' + (order.cliente || 'Cliente') + '_' + (order.ubicacion || 'Sitio') + '.pdf';
  pdf.save(fileName);
  const blobUrl = pdf.output('bloburl');

  // ==================== GUARDAR EN SUPABASE ====================
  // Credenciales tomadas de la configuración global (ver inicio del script)
  const SUPABASE_URL = window._SUPA_URL;
  const SUPABASE_KEY = window._SUPA_KEY;
  const BUCKET_NAME  = window._SUPA_BUCKET;

  // Helper: subir un archivo base64 a Supabase Storage y devolver URL pública

  (async () => {
    try {
      showToast('☁️ Sincronizando IDT con la Nube…', '#3b82f6');

      const ticketSlug = (order.numeroTicket || order.id || Date.now()).toString().replace(/\s+/g, '_');
      const prefix     = `ods/${ticketSlug}`;

      // ── 1. Subir imágenes de evidencias y obtener URLs ──────────────
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

      // ── 2. Subir firmas ──────────────────────────────────────────────
      let urlFirmaCliente   = null;
      let urlFirmaIngeniero = null;

      if (order.firmaCliente) {
        urlFirmaCliente = await supabaseUploadImage(
          order.firmaCliente, `${prefix}/firma_cliente.png`
        );
      }
      if (order.firmaIngeniero) {
        urlFirmaIngeniero = await supabaseUploadImage(
          order.firmaIngeniero, `${prefix}/firma_ingeniero.png`
        );
      }

      // ── 3. Construir JSON limpio para la tabla `ods` ─────────────────
      const odsJson = {
        // Metadatos
        generado_en:  new Date().toISOString(),
        archivo_pdf:  fileName,

        // Generales
        local_id:          order.id            || null,
        numero_ticket:     order.numeroTicket  || null,
        fecha_atencion:    order.fechaAtencion  || null,
        fecha_creacion:    order.fechaCreacion  || null,
        ingeniero:         order.ingeniero      || null,
        tipo_servicio:     order.tipoServicio   || null,
        incidencia:        order.incidencia     || null,

        // Cliente / Sitio
        cliente:           order.cliente        || null,
        ubicacion:         order.ubicacion      || null,
        direccion:         order.direccion      || null,
        contacto:          order.contacto       || null,
        cargo:             order.cargo          || null,
        telefono:          order.telefono       || null,
        correo:            order.correo         || null,

        // Terminal
        nombre_terminal:   order.nombreTerminal  || null,
        solicita_terminal: order.solicitaTerminal || false,
        modelo_terminal:   order.modeloTerminal  || null,

        // Terminal retirada
        serie_retirada:    order.serieRetirada  || null,
        mac_retirada:      order.macRetirada    || null,
        falla_retirada:    order.fallaRetirada  || null,

        // Terminal instalada
        serie_instalada:   order.serieInstalada || null,
        mac_instalada:     order.macInstalada   || null,

        // Solución
        solucion:          order.solucion       || null,
        comentario:        order.comentario     || null,
        
        // Entrega de Materiales
        entregas:          order.entregas       || null,

        // Evidencias (URLs públicas de Storage)
        imagenes: {
          inicial:     urlsInicial,
          mediciones:  urlsMediciones,
          instalacion: urlsInstalacion,
          extras:      urlsExtras
        },
        total_imagenes: urlsInicial.length + urlsMediciones.length +
                        urlsInstalacion.length + urlsExtras.length,

        // Entregas / Materiales
        entregas:          order.entregas && order.entregas.materiales ? order.entregas.materiales : [],

        // Firmas (URLs públicas de Storage)
        firma_cliente:    urlFirmaCliente,
        firma_ingeniero:  urlFirmaIngeniero,
        tiene_firma_cliente:    !!urlFirmaCliente,
        tiene_firma_ingeniero:  !!urlFirmaIngeniero
      };

      // ── 4. Insertar registro en tabla `ods` de Supabase ──────────────
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
      console.log('✅ IDT guardada la Nube:', saved);
      showToast('✅ IDT sincronizada con la Nube');

    } catch (err) {
      console.error('❌ Error al sincronizar con la Nube:', err);
      showToast('⚠️ Error al sincronizar con la Nube (ver consola)', '#ef4444');
      // Cola de reintentos local
      try {
        const pendientes = JSON.parse(localStorage.getItem('ods_pendientes_sync') || '[]');
        pendientes.push({
          order_id:  order.id,
          ticket:    order.numeroTicket,
          timestamp: new Date().toISOString(),
          error:     err.message
        });
        localStorage.setItem('ods_pendientes_sync', JSON.stringify(pendientes));
        console.warn(`📦 Registro en cola local (${pendientes.length} pendiente/s)`);
      } catch (e) { /* ignorar */ }
    }
  })();
  // ==================== FIN GUARDAR EN SUPABASE ====================

  window.open(blobUrl, '_blank');

}
