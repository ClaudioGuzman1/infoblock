// ============================================================
// FUNCIONES DE NEGOCIO (órdenes locales e imágenes)
// ============================================================

function loadOrders() {
  appState.setState({ orders: db.getAllOrders() });
}
function createNewOrder() {
  const order = {
    numeroTicket: '',
    fechaAtencion: new Date().toISOString().split('T')[0],
    ingeniero: '',
    cliente: '',
    ubicacion: '',
    direccion: '',
    contacto: '',
    cargo: '',
    telefono: '',
    correo: '',
    incidencia: '',
    tipoServicio: '',
    fechaCreacion: new Date().toISOString().split('T')[0],
    nombreTerminal: '',
    solicitaTerminal: false,
    modeloTerminal: '',
    serieRetirada: '',
    macRetirada: '',
    fallaRetirada: '',
    serieInstalada: '',
    macInstalada: '',
    solucion: '',
    comentario: '',
    images: { inicial: [], mediciones: [], instalacion: [], extras: [] },
    entregas: { materiales: []},
    firmaCliente: null,
    firmaIngeniero: null
  };
  appState.setState({ currentOrder: order, view: 'form', tab: 'general' });
}
function editOrder(order) {
  appState.setState({ currentOrder: order, view: 'form', tab: 'general' });
}
function duplicateOrder(id) {
  const duplicated = db.duplicateOrder(id);
  if (duplicated) {
    loadOrders();
    alert('ODS duplicada exitosamente');
  }
}
function deleteOrder(id) {
  if (confirm('¿Eliminar esta ODS?')) {
    db.deleteOrder(id);
    loadOrders();
  }
}
function saveOrder() {
  if (appState.currentOrder.id) {
    db.updateOrder(appState.currentOrder.id, appState.currentOrder);
  } else {
    db.createOrder(appState.currentOrder);
  }
  loadOrders();
  appState.setState({ view: 'list' });
}
function updateField(field, value) {
  if (!appState.currentOrder) return;
  appState.currentOrder[field] = value;
  // No re-renderizar, solo actualizar el valor en memoria
}
function addImage(category, imgId, remove) {
  const images = appState.currentOrder.images;
  if (!images[category]) images[category] = [];
  if (remove) {
    images[category] = images[category].filter(id => id !== imgId);
  } else {
    images[category].push(imgId);
  }
  // Re-renderizar solo la sección de imágenes
  const tabContent = document.getElementById('tab-content');
  if (tabContent && appState.tab === 'evidencias') {
    tabContent.innerHTML = renderTabContent();
  }
}
async function handleImageUpload(category, files) {
  for (const file of files) {
    const compressed = await compressImage(file);
    const id = 'img_' + Date.now() + '_' + Math.random();
    db.saveImage(id, compressed);
    addImage(category, id, false);
  }
}
