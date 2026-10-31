// ============================================================
// VISTA: lista local de órdenes
// ============================================================

function renderListView() {
  const filteredOrders = appState.orders.filter(o =>
    (o.numeroTicket || '').toLowerCase().includes(appState.search.toLowerCase()) ||
    (o.cliente || '').toLowerCase().includes(appState.search.toLowerCase())
  );
  return `
        <div style="min-height: 100vh; background: #f9fafb; padding: 24px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
              <h1 style="font-size: 28px; font-weight: bold; color: #1f2937;">Visitas en Sitio</h1>
              <hr>
              <h1 style="font-size: 28px; font-weight: bold; color: #1f2937;">ODS Local + Nube</h1>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button onclick="exportData()" class="btn" style="background: #10b981; color: white;">
                  💾 Exportar datos
                </button>
                <label class="btn" style="background: #8b5cf6; color: white; cursor: pointer;">
                  📥 Importar (Reemplazar)
                  <input type="file" accept=".json" onchange="importData(this)" style="display: none;">
                </label>
                <label class="btn" style="background: #f59e0b; color: white; cursor: pointer;">
                  🔄 Combinar datos
                  <input type="file" accept=".json" onchange="mergeData(this)" style="display: none;">
                </label>
                <button onclick="openSupabaseView()" class="btn" style="background: #6366f1; color: white;">
                  ☁️ Consultar Nube
                </button>
                <button onclick="createNewOrder()" class="btn btn-primary">
                  ➕ Nueva Visita
                </button>
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <label for="TPH">Imprimir:</label>
              <select id="TPH" name="frutas">
                <option value="4in1">4 imágenes por página</option>
                <option value="2in1">2 imágenes por página</option>
              </select>
              <hr>
            </div>
            <div class="card">
              <table style="width: 100%;">
                <thead style="background: #f3f4f6;">
                  <tr>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">#️⃣</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">🗓️</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 14px;">👨🏾‍💼</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 14px;">🛠️</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredOrders.reverse().map(order => `
                    <tr style="border-top: 1px solid #e5e7eb;">
                      <td style="padding: 12px;">${order.numeroTicket || '-'}${order.cloudId ? ` <span title="Copia de la Nube #${order.cloudId}">☁️</span>` : ''}</td>
                      <td style="padding: 12px;">${order.fechaAtencion || '-'}</td>
                      <td style="padding: 12px;">${order.cliente || '-'} @ ${order.nombreTerminal || ''}</td>
                      <td style="padding: 12px; text-align: right; font-weight: bold; color: rgb(255, 212, 59) !important;">
                        <button onclick="editOrder(${JSON.stringify(order).replace(/"/g, '&quot;')})" class="btn" style="background: #3b82f6; color: white; margin: 0 4px;">
                          <span class="mdi mdi-square-edit-outline"></span>
                          </button>
                        <button onclick="duplicateOrder(${order.id})" class="btn btn-success" style="margin: 0 4px;">
                          <span class="mdi mdi-content-copy" ></span>
                        </button>
                        <button onclick='generatePDF_ODS(${JSON.stringify(order)})' class="btn" style="background: #10b981; color: white; margin: 0 4px;">
                          <i class="icon-ods"></i>
                        </button>
                        <button onclick='generatePDF_IDT(${JSON.stringify(order)})' class="btn" style="background: #10b981; color: white; margin: 0 4px;">
                          <i class="icon-idt"></i>
                        </button>
                        <button onclick='generatePDF_CDE(${JSON.stringify(order)})' class="btn" style="background: #10b981; color: white; margin: 0 4px;">
                          <i class="icon-cde"></i>
                        </button>
                        <button onclick="deleteOrder(${order.id})" class="btn btn-danger" style="margin: 0 4px;">
                          <span class="mdi mdi-trash-can-outline"></span>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ${filteredOrders.length === 0 ? '<div style="text-align: center; padding: 32px; color: #6b7280;">No hay órdenes de servicio</div>' : ''}
            </div>
          </div>
        </div>
      `;
}
