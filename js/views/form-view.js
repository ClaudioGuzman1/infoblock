// ============================================================
// VISTA: formulario, pestañas y evidencias
// ============================================================

function renderFormView() {
  const order = appState.currentOrder;
  const isCloud = !!appState.cloudEditId;
  const isLinked = !isCloud && !!(order && order.cloudId);   // copia local de un registro de la Nube
  return `
        <div style="min-height: 100vh; background: #f9fafb; padding: 16px;">
          <div style="max-width: 900px; margin: 0 auto;">

            ${isCloud ? `
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 16px; margin-bottom:14px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <span style="font-size:18px;">☁️</span>
              <span style="font-size:14px; color:#1e40af; font-weight:500; flex:1;">
                Editando registro de la Nube &nbsp;·&nbsp;
                <strong>#${order.numeroTicket || appState.cloudEditId}</strong>
              </span>
              <button onclick="appState.setState({cloudEditId:null, view:'supabase'})" class="btn btn-secondary" style="font-size:12px; padding:4px 10px;">
                ✕ Cancelar edición
              </button>
            </div>` : ''}

            ${isLinked ? `
            <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:10px 16px; margin-bottom:14px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <span style="font-size:18px;">📥</span>
              <span style="font-size:14px; color:#075985; font-weight:500; flex:1;">
                Copia local de la Nube &nbsp;·&nbsp; <strong>#${order.numeroTicket || order.cloudId}</strong>
                &nbsp;—&nbsp; agrega imágenes y pulsa «Guardar en Nube» para actualizar el registro.
              </span>
            </div>` : ''}

            <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h1 style="font-size: 22px; font-weight: bold; margin: 0;">
                ${isCloud ? '✏️ Editar desde la Nube' : (order.id ? 'Editar Visita en sitio' : 'Nueva Visita en Sitio')}
              </h1>
              <div style="display: flex; gap: 8px; flex-wrap:wrap;">
                <button onclick="${isCloud ? "appState.setState({cloudEditId:null,view:'supabase'})" : "appState.setState({ view: 'list' })"}" class="btn btn-secondary">Cancelar</button>
                ${isCloud
                  ? `<button onclick="saveCloudOrder()" class="btn btn-primary" style="background:#6366f1;">☁️ Guardar en Nube</button>`
                  : `<button onclick="saveOrder()" class="btn btn-primary">💾 Guardar</button>${isLinked
                      ? `<button onclick="saveCloudOrder()" class="btn btn-primary" style="background:#6366f1;">☁️ Guardar en Nube</button>` : ''}`
                }
              </div>
            </div>
            <div class="card" style="padding: 16px;">
              <div style="display: flex; gap: 4px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; overflow-x: auto;">
                ${['general', 'cliente', 'solucion', 'entregas', 'evidencias', 'firmas'].map(t => `
                  <button onclick="appState.setState({ tab: '${t}' })" class="tab ${appState.tab === t ? 'active' : ''}">${t.toUpperCase()}</button>
                `).join('')}
              </div>
              <div id="tab-content">
                ${renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      `;
}
function renderTabContent() {
  const order = appState.currentOrder;
  if (appState.tab === 'general') {
    return `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Número de Ticket</label>
              <input type="text" value="${order.numeroTicket || ''}" oninput="updateField('numeroTicket', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Fecha de Atención</label>
              <input type="date" value="${order.fechaAtencion || ''}" oninput="updateField('fechaAtencion', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Fecha de Creación del ticket</label>
              <input type="date" value="${order.fechaCreacion || ''}" oninput="updateField('fechaCreacion', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Ingeniero de Campo</label>
              <input type="text" value="${order.ingeniero || ''}" oninput="updateField('ingeniero', this.value)" class="input" />
            </div>
          </div>
        `;
  }
  if (appState.tab === 'cliente') {
    return `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Cliente</label>
              <input type="text" value="${order.cliente || ''}" oninput="updateField('cliente', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Ubicación de Sitio</label>
              <input type="text" value="${order.ubicacion || ''}" oninput="updateField('ubicacion', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Dirección de Sitio <span class="texto-xxls">(Si se requiere entregar materiales)</span></label>
              <input type="text" value="${order.direccion || ''}" oninput="updateField('direccion', this.value)" class="input" placeholder="Si se requiere entregar materiales" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Contacto en Sitio</label>
              <input type="text" value="${order.contacto || ''}" oninput="updateField('contacto', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Cargo del contacto <span class="texto-xxls">(Si se requiere entregar materiales)</span></label>
              <input type="text" value="${order.cargo || ''}" oninput="updateField('cargo', this.value)" class="input" placeholder="Si se requiere entregar materiales" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Teléfono</label>
              <input type="tel" value="${order.telefono || ''}" oninput="updateField('telefono', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Correo</label>
              <input type="email" value="${order.correo || ''}" oninput="updateField('correo', this.value)" class="input" />
            </div>
          </div>
        `;
  }
  if (appState.tab === 'solucion') {
    return `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Incidencia</label>
              <textarea oninput="updateField('incidencia', this.value)" class="input" rows="3">${order.incidencia || ''}</textarea>
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Tipo de Servicio</label>
              <input type="text" value="${order.tipoServicio || ''}" oninput="updateField('tipoServicio', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Nombre de Terminal</label>
              <input type="text" value="${order.nombreTerminal || ''}" oninput="updateField('nombreTerminal', this.value)" class="input" />
            </div>
            <div>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" ${order.solicitaTerminal ? 'checked' : ''} onchange="updateField('solicitaTerminal', this.checked)" />
                <span style="font-weight: 500; font-size: 14px;">¿Solicita Terminal?</span>
              </label>
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Solución de Incidencia</label>
              <textarea style="field-sizing: content; resize: none; min-height: 70px; " oninput="updateField('solucion', this.value)" class="input" rows="4" maxlength="1320">${order.solucion || ''}</textarea>
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Equipo Retirado</label>
              <input type="text" placeholder="Número de serie Retirada" value="${order.serieRetirada || ''}" oninput="updateField('serieRetirada', this.value)" class="input" />
              <input type="text" placeholder="Dirección MAC Retirada" value="${order.macRetirada || ''}" oninput="updateField('macRetirada', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Equipo Instalado</label>
              <input type="text" placeholder="Número de serie Instalada" value="${order.serieInstalada || ''}" oninput="updateField('serieInstalada', this.value)" class="input" />
              <input type="text" placeholder="Dirección MAC instalada" value="${order.macInstalada || ''}" oninput="updateField('macInstalada', this.value)" class="input" />
            </div>
            <div>
              <label style="display: block; font-weight: 500; margin-bottom: 4px; font-size: 14px;">Comentario del cliente</label>
              <textarea oninput="updateField('comentario', this.value)" class="input" rows="3">${order.comentario || ''}</textarea>
            </div>
          </div>
        `;
  }

  if (appState.tab === 'entregas') {
    const entregas = (order.entregas && order.entregas.materiales) ? order.entregas.materiales : [];
    return `
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="font-size: 16px; font-weight: 600; margin: 0;">Materiales a Entregar</h3>
              <button onclick="addEquipo()" class="btn btn-primary">➕ Agregar Fila</button>
            </div>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; min-width: 600px; border-collapse: collapse;">
                <thead style="background: #f3f4f6;">
                  <tr>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px; border: 1px solid #e5e7eb; width: 10%;">Cantidad</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px; border: 1px solid #e5e7eb; width: 20%;">Marca</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px; border: 1px solid #e5e7eb; width: 20%;">Modelo</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px; border: 1px solid #e5e7eb; width: 20%;">N° de Serie</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px; border: 1px solid #e5e7eb; width: 25%;">Observaciones</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 14px; border: 1px solid #e5e7eb; width: 5%;">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  ${entregas.length === 0 ? `
                    <tr>
                      <td colspan="6" style="padding: 32px; text-align: center; color: #6b7280; border: 1px solid #e5e7eb;">
                        No hay materiales registrados. Haz clic en "Agregar Fila" para comenzar.
                      </td>
                    </tr>
                  ` : ''}
                  ${entregas.map((equipo, index) => `
                    <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                      <td style="padding: 8px; border: 1px solid #e5e7eb;">
                        <input 
                        type="number" 
                        value="${equipo.cantidad || 1}" 
                        oninput="updateEquipo(${index}, 'cantidad', this.value)" 
                        style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                        />
                        </td>
                        <td style="padding: 8px; border: 1px solid #e5e7eb;">
                          <input 
                          autofocus
                          type="text" 
                          value="${equipo.marca || ''}" 
                          oninput="updateEquipo(${index}, 'marca', this.value)" 
                          placeholder="Marca"
                          style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                        />
                      </td>
                      <td style="padding: 8px; border: 1px solid #e5e7eb;">
                        <input 
                          type="text" 
                          value="${equipo.modelo || ''}" 
                          oninput="updateEquipo(${index}, 'modelo', this.value)" 
                          placeholder="Modelo"
                          style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                        />
                      </td>
                      <td style="padding: 8px; border: 1px solid #e5e7eb;">
                        <input 
                          type="text" 
                          value="${equipo.serie || ''}" 
                          oninput="updateEquipo(${index}, 'serie', this.value)" 
                          placeholder="N° Serie"
                          style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                        />
                      </td>
                      <td style="padding: 8px; border: 1px solid #e5e7eb;">
                        <input 
                          type="text" 
                          value="${equipo.observaciones || ''}" 
                          oninput="updateEquipo(${index}, 'observaciones', this.value)" 
                          placeholder="Observaciones"
                          style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                        />
                      </td>
                      <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">
                        <button 
                          onclick="removeEquipo(${index})" 
                          style="background: #dc2626; color: white; border: none; border-radius: 4px; width: 32px; height: 32px; cursor: pointer; font-size: 16px;"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            ${entregas.length > 0 ? `
              <div style="text-align: right; color: #6b7280; font-size: 14px;">
                Total de entregas: ${entregas.length}
              </div>
            ` : ''}
          </div>
        `;
  }
  if (appState.tab === 'evidencias') {
    return `
          <div style="display: flex; flex-direction: column; gap: 24px;">
            ${renderImageSection('inicial', 'Estado Inicial')}
            ${renderImageSection('mediciones', 'Mediciones')}
            ${renderImageSection('instalacion', 'Instalación')}
            ${renderImageSection('extras', 'Fotos Adicionales')}
          </div>
        `;
  }
  if (appState.tab === 'firmas') {
    return `
      <div style="display: flex; flex-direction: column; gap: 32px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Firma del Ingeniero</h3>
          <div class="signature-canvas-container">
            <canvas id="signatureCanvasIngeniero" width="500" height="250" class="signature-canvas"></canvas>
          </div>
          <input type="file" id="fileSignatureIngeniero" accept="image/*" style="display: none;" onchange="loadSignatureFromFile('ingeniero', this)" />
          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
            <button onclick="clearSignature('ingeniero')" class="btn btn-secondary">Limpiar</button>
            <button onclick="saveSignature('ingeniero')" class="btn btn-primary">Guardar Firma</button>
            <button onclick="document.getElementById('fileSignatureIngeniero').click()" class="btn" style="background: #8b5cf6; color: white;">📁 Cargar Imagen</button>
          </div>
        </div>
        
        <div>
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Firma del Cliente</h3>
          <div class="signature-canvas-container">
            <canvas id="signatureCanvasCliente" width="500" height="250" class="signature-canvas"></canvas>
          </div>
          <input type="file" id="fileSignatureCliente" accept="image/*" style="display: none;" onchange="loadSignatureFromFile('cliente', this)" />
          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
            <button onclick="clearSignature('cliente')" class="btn btn-secondary">Limpiar</button>
            <button onclick="saveSignature('cliente')" class="btn btn-primary">Guardar Firma</button>
            <button onclick="document.getElementById('fileSignatureCliente').click()" class="btn" style="background: #8b5cf6; color: white;">📁 Cargar Imagen</button>
          </div>
        </div>
      </div>
    `;
  }
  
  return '';
}
function renderImageSection(category, label) {
  const images = appState.currentOrder.images[category] || [];
  return `
        <div>
          <label style="display: block; font-weight: 500; margin-bottom: 8px; font-size: 14px;">${label}</label>
          <input type="file" id="file_camera_${category}" accept="image/*" capture="environment" style="display: none;" onchange="handleFileInput('${category}', this)" />
          <input type="file" id="file_gallery_${category}" accept="image/*" multiple style="display: none;" onchange="handleFileInput('${category}', this)" />
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
            <button onclick="document.getElementById('file_camera_${category}').click()" class="btn btn-primary" style="flex: 1; min-width: 140px;">📷 Tomar Foto</button>
            <button onclick="document.getElementById('file_gallery_${category}').click()" class="btn" style="background: #8b5cf6; color: white; flex: 1; min-width: 140px;">🖼️ Galería</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;">
            ${images.map(imgId => {
    const imgData = db.getImage(imgId);
    return imgData ? `
                <div style="position: relative;">
                  <img src="${imgData}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;" />
                  <button onclick="addImage('${category}', '${imgId}', true)" style="position: absolute; top: 4px; right: 4px; background: #dc2626; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
                </div>
              ` : '';
  }).join('')}
          </div>
        </div>
      `;
}
async function handleFileInput(category, input) {
  await handleImageUpload(category, input.files);
}
