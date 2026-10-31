// ============================================================
// EXPORTAR / IMPORTAR / COMBINAR datos
// ============================================================

function exportData() {
  try {
    // Crear objeto con todos los datos
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        orders: db.db.orders,
        counter: db.db.counter,
        images: [...db.images]
      }
    };
    
    // Convertir a JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Crear blob y descargar
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ODS-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Datos exportados exitosamente');
  } catch (error) {
    console.error('Error al exportar:', error);
    alert('Error al exportar los datos');
  }
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (!confirm('¿Importar datos? Esto REEMPLAZARÁ todos los datos actuales. ¿Continuar?')) {
    input.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // Validar estructura
      if (!importedData.data || !importedData.data.orders) {
        throw new Error('Formato de archivo inválido');
      }
      
      // Restaurar datos
      db.db.orders = importedData.data.orders;
      db.db.counter = importedData.data.counter;
      db.replaceImages(importedData.data.images);
      
      // Guardar en localStorage
      db.save();
      
      // Recargar vista
      loadOrders();
      
      alert(`Datos importados exitosamente\n${importedData.data.orders.length} órdenes restauradas`);
    } catch (error) {
      console.error('Error al importar:', error);
      alert('Error al importar los datos. Verifica que el archivo sea válido.');
    }
  };
  
  reader.readAsText(file);
  
  // Limpiar input
  input.value = '';
}

function mergeData(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (!confirm('¿Combinar datos? Esto AÑADIRÁ las órdenes del archivo a las existentes. ¿Continuar?')) {
    input.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // Validar estructura
      if (!importedData.data || !importedData.data.orders) {
        throw new Error('Formato de archivo inválido');
      }
      
      // Obtener el counter actual
      let maxId = db.db.counter;
      
      // Añadir órdenes con nuevos IDs
      const addedOrders = [];
      importedData.data.orders.forEach(order => {
        const newOrder = { ...order, id: maxId++ };
        db.db.orders.push(newOrder);
        addedOrders.push(newOrder);
      });
      
      // Actualizar counter
      db.db.counter = maxId;
      
      // Combinar imágenes
      const importedImages = new Map(importedData.data.images);
      importedImages.forEach((value, key) => {
        db.images.set(key, value);
      });
      
      // Guardar
      db.save();
      
      // Recargar vista
      loadOrders();
      
      alert(`Datos combinados exitosamente\n${addedOrders.length} órdenes añadidas`);
    } catch (error) {
      console.error('Error al combinar:', error);
      alert('Error al combinar los datos. Verifica que el archivo sea válido.');
    }
  };
  
  reader.readAsText(file);
  
  // Limpiar input
  input.value = '';
}
