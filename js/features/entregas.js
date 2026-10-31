// ============================================================
// ENTREGAS / MATERIALES
// ============================================================

function _getEntregas() {
  const order = appState.currentOrder;
  if (!order.entregas) order.entregas = { materiales: [] };
  if (!order.entregas.materiales) order.entregas.materiales = [];
  return order.entregas.materiales;
}
function addEquipo() {
  const materiales = _getEntregas();
  materiales.push({ cantidad: 1, marca: '', modelo: '', serie: '', observaciones: '' });
  const tabContent = document.getElementById('tab-content');
  if (tabContent) tabContent.innerHTML = renderTabContent();
}
function updateEquipo(index, field, value) {
  const materiales = _getEntregas();
  if (materiales[index]) materiales[index][field] = value;
}
function removeEquipo(index) {
  const materiales = _getEntregas();
  materiales.splice(index, 1);
  const tabContent = document.getElementById('tab-content');
  if (tabContent) tabContent.innerHTML = renderTabContent();
}
