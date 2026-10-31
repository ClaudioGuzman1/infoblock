// ============================================================
// FIRMAS (canvas)
// ============================================================

let canvasIngeniero, ctxIngeniero, canvasCliente, ctxCliente;
let isDrawingIngeniero = false, isDrawingCliente = false;
function initSignature() {
  // Canvas Ingeniero
  canvasIngeniero = document.getElementById('signatureCanvasIngeniero');
  if (canvasIngeniero) {
    ctxIngeniero = canvasIngeniero.getContext('2d');
    // Ajustar canvas al contenedor
    const container = canvasIngeniero.parentElement;
    const rect = container.getBoundingClientRect();
    canvasIngeniero.style.width = '100%';
    canvasIngeniero.style.height = 'auto';
    if (appState.currentOrder.firmaIngeniero) {
      const img = new Image();
      img.onload = () => ctxIngeniero.drawImage(img, 0, 0, canvasIngeniero.width, canvasIngeniero.height);
      img.src = appState.currentOrder.firmaIngeniero;
    }
    // Mouse events
    canvasIngeniero.addEventListener('mousedown', (e) => startDrawing(e, 'ingeniero'));
    canvasIngeniero.addEventListener('mousemove', (e) => draw(e, 'ingeniero'));
    canvasIngeniero.addEventListener('mouseup', () => stopDrawing('ingeniero'));
    canvasIngeniero.addEventListener('mouseleave', () => stopDrawing('ingeniero'));
    // Touch events para móvil
    canvasIngeniero.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvasIngeniero.dispatchEvent(mouseEvent);
    });
    canvasIngeniero.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvasIngeniero.dispatchEvent(mouseEvent);
    });
    canvasIngeniero.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      canvasIngeniero.dispatchEvent(mouseEvent);
    });
  }
  // Canvas Cliente
  canvasCliente = document.getElementById('signatureCanvasCliente');
  if (canvasCliente) {
    ctxCliente = canvasCliente.getContext('2d');
    canvasCliente.style.width = '100%';
    canvasCliente.style.height = 'auto';
    if (appState.currentOrder.firmaCliente) {
      const img = new Image();
      img.onload = () => ctxCliente.drawImage(img, 0, 0, canvasCliente.width, canvasCliente.height);
      img.src = appState.currentOrder.firmaCliente;
    }
    // Mouse events
    canvasCliente.addEventListener('mousedown', (e) => startDrawing(e, 'cliente'));
    canvasCliente.addEventListener('mousemove', (e) => draw(e, 'cliente'));
    canvasCliente.addEventListener('mouseup', () => stopDrawing('cliente'));
    canvasCliente.addEventListener('mouseleave', () => stopDrawing('cliente'));
    // Touch events para móvil
    canvasCliente.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvasCliente.dispatchEvent(mouseEvent);
    });
    canvasCliente.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvasCliente.dispatchEvent(mouseEvent);
    });
    canvasCliente.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      canvasCliente.dispatchEvent(mouseEvent);
    });
  }
}
function getCanvasCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}
function startDrawing(e, tipo) {
  const canvas = tipo === 'ingeniero' ? canvasIngeniero : canvasCliente;
  const ctx = tipo === 'ingeniero' ? ctxIngeniero : ctxCliente;
  if (tipo === 'ingeniero') isDrawingIngeniero = true;
  else isDrawingCliente = true;
  const coords = getCanvasCoords(e, canvas);
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';
}
function draw(e, tipo) {
  const isDrawing = tipo === 'ingeniero' ? isDrawingIngeniero : isDrawingCliente;
  if (!isDrawing) return;
  const canvas = tipo === 'ingeniero' ? canvasIngeniero : canvasCliente;
  const ctx = tipo === 'ingeniero' ? ctxIngeniero : ctxCliente;
  const coords = getCanvasCoords(e, canvas);
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
}
function stopDrawing(tipo) {
  if (tipo === 'ingeniero') isDrawingIngeniero = false;
  else isDrawingCliente = false;
}
function clearSignature(tipo) {
  const canvas = tipo === 'ingeniero' ? canvasIngeniero : canvasCliente;
  const ctx = tipo === 'ingeniero' ? ctxIngeniero : ctxCliente;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function saveSignature(tipo) {
  const canvas = tipo === 'ingeniero' ? canvasIngeniero : canvasCliente;
  const dataUrl = canvas.toDataURL();
  const field = tipo === 'ingeniero' ? 'firmaIngeniero' : 'firmaCliente';
  appState.currentOrder[field] = dataUrl;
  alert('Firma ' + (tipo === 'ingeniero' ? 'del ingeniero' : 'del cliente') + ' guardada');
}
function loadSignatureFromFile(tipo, input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = tipo === 'ingeniero' ? canvasIngeniero : canvasCliente;
      const ctx = tipo === 'ingeniero' ? ctxIngeniero : ctxCliente;
      
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calcular dimensiones para ajustar imagen manteniendo aspecto
      const canvasAspect = canvas.width / canvas.height;
      const imgAspect = img.width / img.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgAspect > canvasAspect) {
        // Imagen más ancha - ajustar al ancho
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        // Imagen más alta - ajustar a la altura
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }
      
      // Dibujar imagen centrada
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Guardar automáticamente
      const dataUrl = canvas.toDataURL();
      const field = tipo === 'ingeniero' ? 'firmaIngeniero' : 'firmaCliente';
      appState.currentOrder[field] = dataUrl;
      
      alert('Firma cargada desde archivo');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  
  // Limpiar input para permitir cargar la misma imagen nuevamente
  input.value = '';
}
