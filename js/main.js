// ============================================================
// INICIALIZACIÓN
// ============================================================

db.init();
loadOrders();
appState.subscribe(() => {
  render();
  if (appState.tab === 'firmas') {
    setTimeout(initSignature, 100);
  }
});
render();

// Cargar imágenes guardadas en el dispositivo (IndexedDB) sin bloquear el arranque
db.initImages().then(() => {
  if (appState.view === 'form') render();
}).catch((e) => console.warn('No se pudieron cargar las imágenes guardadas:', e));
