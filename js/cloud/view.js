// ============================================================
// NUBE: vista de listado y detalle
// ============================================================

function renderSupabaseView() {
  const { cloudOrders, cloudLoading, cloudSearch, cloudPage, cloudPageSize, cloudTotal } = appState;
  const totalPages = Math.ceil(cloudTotal / cloudPageSize);
  const from = cloudPage * cloudPageSize + 1;
  const to   = Math.min((cloudPage + 1) * cloudPageSize, cloudTotal);

  return `
    <div style="min-height:100vh; background:#f9fafb; padding:24px;">
      <div style="max-width:1200px; margin:0 auto;">

        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <button onclick="appState.setState({view:'list'})" class="btn btn-secondary">← Local</button>
            <h1 style="font-size:24px; font-weight:bold; color:#1f2937; margin:0;">☁️ ODS en Storage</h1>
            ${cloudTotal > 0 ? `<span style="background:#e0e7ff; color:#4338ca; padding:4px 10px; border-radius:99px; font-size:13px; font-weight:600;">${cloudTotal} registros</span>` : ''}
          </div>
          <button onclick="loadCloudOrders().then(()=>render())" class="btn" style="background:#6366f1; color:white;">
            🔄 Recargar
          </button>
        </div>

        <!-- Buscador -->
        <div style="margin-bottom:16px; display:flex; gap:8px;">
          <input
            type="text"
            placeholder="Buscar por ticket, cliente o ingeniero…"
            value="${cloudSearch}"
            oninput="appState.cloudSearch=this.value"
            onkeydown="if(event.key==='Enter'){appState.cloudPage=0;loadCloudOrders().then(()=>render())}"
            class="input"
            style="flex:1; max-width:400px;"
          />
          <button onclick="appState.cloudPage=0;loadCloudOrders().then(()=>render())" class="btn btn-primary">🔍 Buscar</button>
          <button onclick="appState.cloudSearch='';appState.cloudPage=0;loadCloudOrders().then(()=>render())" class="btn btn-secondary">✕ Limpiar</button>
        </div>

        <!-- Tabla -->
        <div class="card" style="overflow-x:auto;">
          ${cloudLoading ? `
            <div style="text-align:center; padding:48px; color:#6b7280;">
              <div style="font-size:32px; margin-bottom:8px;">⏳</div>
              Cargando desde la Nube…
            </div>
          ` : cloudOrders.length === 0 ? `
            <div style="text-align:center; padding:48px; color:#6b7280;">
              <div style="font-size:32px; margin-bottom:8px;">☁️</div>
              No se encontraron registros
            </div>
          ` : `
            <table style="width:100%; border-collapse:collapse;">
              <thead style="background:#f3f4f6;">
                <tr>
                  <th style="padding:12px; text-align:left; font-size:13px; font-weight:600; color:#374151;">#️⃣ Ticket</th>
                  <th style="padding:12px; text-align:left; font-size:13px; font-weight:600; color:#374151;">🗓️ Fecha</th>
                  <th style="padding:12px; text-align:left; font-size:13px; font-weight:600; color:#374151;">👤 Cliente</th>
                  <th style="padding:12px; text-align:left; font-size:13px; font-weight:600; color:#374151;">🖥️ Terminal</th>
                  <th style="padding:12px; text-align:left; font-size:13px; font-weight:600; color:#374151;">👨‍💼 Ingeniero</th>
                  <th style="padding:12px; text-align:center; font-size:13px; font-weight:600; color:#374151;">📸</th>
                  <th style="padding:12px; text-align:center; font-size:13px; font-weight:600; color:#374151;">✍️</th>
                  <th style="padding:12px; text-align:right; font-size:13px; font-weight:600; color:#374151;">🛠️ Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${cloudOrders.map(r => `
                  <tr style="border-top:1px solid #e5e7eb; transition:background 0.15s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                    <td style="padding:12px; font-weight:600; color:#4338ca;">${r.numero_ticket || '-'}</td>
                    <td style="padding:12px; font-size:13px; color:#6b7280;">${r.fecha_atencion || '-'}</td>
                    <td style="padding:12px;">${r.cliente || '-'}</td>
                    <td style="padding:12px; font-size:13px;">${r.nombre_terminal || '-'}</td>
                    <td style="padding:12px; font-size:13px;">${r.ingeniero || '-'}</td>
                    <td style="padding:12px; text-align:center;">
                      <span style="background:#dbeafe; color:#1d4ed8; padding:2px 8px; border-radius:99px; font-size:12px; font-weight:600;">
                        ${r.total_imagenes || 0}
                      </span>
                    </td>
                    <td style="padding:12px; text-align:center; font-size:16px;">
                      ${r.tiene_firma_cliente ? '✅' : '❌'} ${r.tiene_firma_ingeniero ? '✅' : '❌'}
                    </td>
                    <td style="padding:12px; text-align:right; white-space:nowrap;">
                      <button onclick='showCloudDetail(${JSON.stringify(r).replace(/'/g, "\'")})'
                        class="btn" style="background:#8b5cf6; color:white; margin:0 2px; font-size:12px; padding:6px 10px;">
                        👁️
                      </button>
                      <button onclick='editCloudOrder(${JSON.stringify(r).replace(/'/g, "\'")})'
                        class="btn" style="background:#f59e0b; color:white; margin:0 2px; font-size:12px; padding:6px 10px;">
                        ✏️ Editar
                      </button>
                      <button onclick="copyCloudOrderToLocal(${r.id})"
                        class="btn" style="background:#0ea5e9; color:white; margin:0 2px; font-size:12px; padding:6px 10px;" title="Copiar a este dispositivo (con imágenes) para editar">
                        📥 Local
                      </button>
                      <button onclick='printCloudPDF_ODS(${JSON.stringify(r).replace(/'/g, "\'")})'
                        class="btn" style="background:#10b981; color:white; margin:0 2px; font-size:12px; padding:6px 10px;">
                        📄 ODS
                      </button>
                      <button onclick='printCloudPDF_IDT(${JSON.stringify(r).replace(/'/g, "\'")})'
                        class="btn" style="background:#10b981; color:white; margin:0 2px; font-size:12px; padding:6px 10px;">
                        📄 IDT
                      </button>
                      <button onclick='printCloudPDF_CDE(${JSON.stringify(r).replace(/'/g, "\'")})'
                        class="btn" style="background:#10b981; color:white; margin:0 2px; font-size:12px; padding:6px 10px;">
                        📄 CDE
                      </button>
                      <button onclick="deleteCloudOrder(${r.id})"
                        class="btn btn-danger" style="margin:0 2px; font-size:12px; padding:6px 10px;">
                        🗑️
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- Paginación -->
        ${cloudTotal > cloudPageSize ? `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; flex-wrap:wrap; gap:8px;">
            <span style="font-size:13px; color:#6b7280;">Mostrando ${from}–${to} de ${cloudTotal}</span>
            <div style="display:flex; gap:8px;">
              <button
                onclick="appState.cloudPage--;loadCloudOrders().then(()=>render())"
                class="btn btn-secondary"
                ${cloudPage === 0 ? 'disabled style="opacity:0.4;pointer-events:none;"' : ''}>
                ← Anterior
              </button>
              <span style="padding:8px 12px; background:white; border:1px solid #e5e7eb; border-radius:6px; font-size:13px;">
                Pág. ${cloudPage + 1} / ${totalPages}
              </span>
              <button
                onclick="appState.cloudPage++;loadCloudOrders().then(()=>render())"
                class="btn btn-secondary"
                ${cloudPage >= totalPages - 1 ? 'disabled style="opacity:0.4;pointer-events:none;"' : ''}>
                Siguiente →
              </button>
            </div>
          </div>
        ` : ''}

      </div>
    </div>

    <!-- Modal detalle -->
    <div id="cloud-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1000; overflow-y:auto; padding:24px;">
      <div style="max-width:700px; margin:0 auto; background:white; border-radius:12px; padding:24px; position:relative;">
        <button onclick="document.getElementById('cloud-modal').style.display='none'"
          style="position:absolute; top:16px; right:16px; background:#f3f4f6; border:none; border-radius:6px; padding:6px 12px; cursor:pointer; font-size:14px;">
          ✕ Cerrar
        </button>
        <div id="cloud-modal-content"></div>
      </div>
    </div>
  `;
}

function showCloudDetail(r) {
  const modal = document.getElementById('cloud-modal');
  const content = document.getElementById('cloud-modal-content');
  if (!modal || !content) return;

  const row = (label, val) => val
    ? `<tr><td style="padding:6px 12px 6px 0; font-weight:500; color:#6b7280; font-size:13px; white-space:nowrap;">${label}</td><td style="padding:6px 0; font-size:14px;">${val}</td></tr>`
    : '';

  const imgSection = (cat, label) => {
    const imgs = r.imagenes?.[cat] || [];
    if (!imgs.length) return '';
    return `
      <div style="margin-bottom:12px;">
        <p style="font-weight:600; font-size:13px; color:#374151; margin:0 0 6px;">${label} (${imgs.length})</p>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${imgs.map(i => `<img src="${i.url}" style="width:100px; height:70px; object-fit:cover; border-radius:6px; border:1px solid #e5e7eb;" />`).join('')}
        </div>
      </div>`;
  };

  content.innerHTML = `
    <h2 style="font-size:20px; font-weight:bold; margin:0 0 4px;">ODS #${r.numero_ticket || r.id}</h2>
    <p style="color:#6b7280; font-size:13px; margin:0 0 20px;">Guardado: ${new Date(r.created_at).toLocaleString('es-MX')}</p>

    <table style="width:100%; margin-bottom:16px;">
      ${row('Fecha atención', r.fecha_atencion)}
      ${row('Ingeniero', r.ingeniero)}
      ${row('Tipo servicio', r.tipo_servicio)}
      ${row('Cliente', r.cliente)}
      ${row('Ubicación', r.ubicacion)}
      ${row('Dirección', r.direccion)}
      ${row('Contacto', r.contacto)}
      ${row('Cargo', r.cargo)}
      ${row('Teléfono', r.telefono)}
      ${row('Correo', r.correo)}
      ${row('Terminal', r.nombre_terminal)}
      ${row('Modelo', r.modelo_terminal)}
      ${row('Serie retirada', r.serie_retirada)}
      ${row('MAC retirada', r.mac_retirada)}
      ${row('Serie instalada', r.serie_instalada)}
      ${row('MAC instalada', r.mac_instalada)}
      ${row('Incidencia', r.incidencia)}
      ${row('Solución', r.solucion)}
      ${row('Entregas', r.entregas)}
      ${row('Comentario', r.comentario)}
    </table>

    <hr style="margin:16px 0; border-color:#e5e7eb;">
    <p style="font-weight:700; font-size:14px; margin:0 0 10px;">📸 Evidencias</p>
    ${imgSection('inicial', '🔍 Inicial')}
    ${imgSection('mediciones', '📏 Mediciones')}
    ${imgSection('instalacion', '🔧 Instalación')}
    ${imgSection('extras', '➕ Extras')}

    ${(r.firma_cliente || r.firma_ingeniero) ? `
      <hr style="margin:16px 0; border-color:#e5e7eb;">
      <p style="font-weight:700; font-size:14px; margin:0 0 10px;">✍️ Firmas</p>
      <div style="display:flex; gap:16px; flex-wrap:wrap;">
        ${r.firma_cliente    ? `<div><p style="font-size:12px; color:#6b7280; margin:0 0 4px;">Cliente</p><img src="${r.firma_cliente}"    style="height:60px; border:1px solid #e5e7eb; border-radius:6px;"/></div>` : ''}
        ${r.firma_ingeniero ? `<div><p style="font-size:12px; color:#6b7280; margin:0 0 4px;">Ingeniero</p><img src="${r.firma_ingeniero}" style="height:60px; border:1px solid #e5e7eb; border-radius:6px;"/></div>` : ''}
      </div>
    ` : ''}

    <div style="margin-top:20px; display:flex; gap:8px; justify-content:flex-end;">
      <button onclick='editCloudOrder(${JSON.stringify(r).replace(/'/g, "\'")})'
        class="btn" style="background:#f59e0b; color:white;">
        ✏️ Editar
      </button>
      <button onclick="copyCloudOrderToLocal(${r.id})"
        class="btn" style="background:#0ea5e9; color:white;">
        📥 Copiar a local
      </button>
      <button onclick="document.getElementById('cloud-modal').style.display='none'" class="btn btn-secondary">Cerrar</button>
      <button onclick='printCloudPDF(${JSON.stringify(r).replace(/'/g, "\'")});document.getElementById("cloud-modal").style.display="none"'
        class="btn" style="background:#10b981; color:white;">
        📄 Imprimir PDF
      </button>
    </div>
  `;
  modal.style.display = 'block';
}
