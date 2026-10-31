'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withApp, J, tick } = require('./harness');

const IMG = 'data:image/jpeg;base64,QUJD';
const seed = {
  ods_data: {
    orders: [
      { id: 1, numeroTicket: 'T-100', fechaAtencion: '2026-01-10', cliente: 'ACME', nombreTerminal: 'TPV-1', images: {}, entregas: { materiales: [] } },
      { id: 2, numeroTicket: 'T-200', fechaAtencion: '2026-02-20', cliente: 'Globex', nombreTerminal: '', images: {}, entregas: { materiales: [] } },
    ],
    counter: 3,
  },
};
const type = (app, el, value) => {
  el.value = value;
  el.dispatchEvent(new app.window.Event('input', { bubbles: true }));
};
const input = (app, sel) => app.document.querySelector(sel);
const tabButton = (app, label) => [...app.document.querySelectorAll('button.tab')].find((b) => b.textContent.trim() === label);

describe('Vista de lista', () => {
  it('sin órdenes muestra títulos, botones de acción, selector de impresión y mensaje vacío', () =>
    withApp(async (app) => {
      const t = app.text();
      for (const s of ['Visitas en Sitio', 'ODS Local + Nube', 'Exportar datos', 'Importar (Reemplazar)',
        'Combinar datos', 'Consultar Nube', 'Nueva Visita', 'No hay órdenes de servicio']) {
        assert.ok(t.includes(s), 'falta: ' + s);
      }
      const opts = [...app.document.querySelectorAll('#TPH option')].map((o) => o.value);
      assert.deepEqual(opts, ['4in1', '2in1']);
      assert.equal(app.document.querySelectorAll('input[type=file][accept=".json"]').length, 2);
    }));

  it('lista las órdenes más recientes primero con ticket, fecha y "cliente @ terminal"', () =>
    withApp({ storage: seed }, async (app) => {
      const rows = [...app.document.querySelectorAll('tbody tr')];
      assert.equal(rows.length, 2);
      const cells = rows.map((r) => [...r.querySelectorAll('td')].slice(0, 3).map((c) => c.textContent.trim()));
      assert.deepEqual(cells[0], ['T-200', '2026-02-20', 'Globex @']);
      assert.deepEqual(cells[1], ['T-100', '2026-01-10', 'ACME @ TPV-1']);
      assert.ok(!app.text().includes('No hay órdenes de servicio'));
    }));

  it('cada fila ofrece 6 acciones: editar, duplicar, ODS, IDT, CDE y eliminar', () =>
    withApp({ storage: seed }, async (app) => {
      const btns = app.document.querySelectorAll('tbody tr:first-child td:last-child button');
      assert.equal(btns.length, 6);
      const onclicks = [...btns].map((b) => b.getAttribute('onclick'));
      assert.match(onclicks[0], /^editOrder\(/);
      assert.match(onclicks[1], /^duplicateOrder\(2\)/);
      assert.match(onclicks[2], /^generatePDF_ODS\(/);
      assert.match(onclicks[3], /^generatePDF_IDT\(/);
      assert.match(onclicks[4], /^generatePDF_CDE\(/);
      assert.match(onclicks[5], /^deleteOrder\(2\)/);
    }));

  it('el filtro appState.search busca (sin distinguir mayúsculas) por ticket o cliente', () =>
    withApp({ storage: seed }, async (app) => {
      app.get("appState.setState({search:'globex'})");
      assert.equal(app.document.querySelectorAll('tbody tr').length, 1);
      app.get("appState.setState({search:'t-100'})");
      assert.equal(app.document.querySelectorAll('tbody tr').length, 1);
      assert.ok(app.text().includes('ACME'));
      app.get("appState.setState({search:'zzz'})");
      assert.equal(app.document.querySelectorAll('tbody tr').length, 0);
      assert.ok(app.text().includes('No hay órdenes de servicio'));
    }));

  it('botón editar abre el formulario con los datos de la orden', () =>
    withApp({ storage: seed }, async (app) => {
      app.document.querySelector('tbody tr:first-child td:last-child button').click();
      assert.equal(app.get('appState.view'), 'form');
      assert.ok(app.text().includes('Editar Visita en sitio'));
      assert.equal(input(app, 'input[type=text]').value, 'T-200');
    }));

  it('botón eliminar respeta la confirmación', () =>
    withApp({ storage: seed }, async (app) => {
      app.setConfirm(false);
      app.document.querySelector('tbody tr:first-child td:last-child button:last-child').click();
      assert.equal(app.document.querySelectorAll('tbody tr').length, 2);
      app.setConfirm(true);
      app.document.querySelector('tbody tr:first-child td:last-child button:last-child').click();
      assert.equal(app.document.querySelectorAll('tbody tr').length, 1);
    }));

  it('botón duplicar agrega una fila', () =>
    withApp({ storage: seed }, async (app) => {
      app.document.querySelector('tbody tr:first-child td:last-child button:nth-child(2)').click();
      assert.equal(app.document.querySelectorAll('tbody tr').length, 3);
    }));
});

describe('Formulario y pestañas', () => {
  it('"Nueva Visita" abre el formulario con 6 pestañas y GENERAL activa', () =>
    withApp(async (app) => {
      [...app.document.querySelectorAll('button')].find((b) => b.textContent.includes('Nueva Visita')).click();
      assert.ok(app.text().includes('Nueva Visita en Sitio'));
      const tabs = [...app.document.querySelectorAll('button.tab')];
      assert.deepEqual(tabs.map((t) => t.textContent.trim()), ['GENERAL', 'CLIENTE', 'SOLUCION', 'ENTREGAS', 'EVIDENCIAS', 'FIRMAS']);
      assert.deepEqual(tabs.filter((t) => t.classList.contains('active')).map((t) => t.textContent.trim()), ['GENERAL']);
    }));

  it('cada pestaña muestra sus campos', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      const expected = {
        GENERAL: ['Número de Ticket', 'Fecha de Atención', 'Fecha de Creación del ticket', 'Ingeniero de Campo'],
        CLIENTE: ['Cliente', 'Ubicación de Sitio', 'Dirección de Sitio', 'Contacto en Sitio', 'Cargo del contacto', 'Teléfono', 'Correo'],
        SOLUCION: ['Incidencia', 'Tipo de Servicio', 'Nombre de Terminal', '¿Solicita Terminal?', 'Solución de Incidencia', 'Equipo Retirado', 'Equipo Instalado', 'Comentario del cliente'],
        ENTREGAS: ['Materiales a Entregar', 'Agregar Fila'],
        EVIDENCIAS: ['Estado Inicial', 'Mediciones', 'Instalación', 'Fotos Adicionales', 'Tomar Foto', 'Galería'],
        FIRMAS: ['Firma del Ingeniero', 'Firma del Cliente', 'Guardar Firma', 'Cargar Imagen'],
      };
      for (const [tab, texts] of Object.entries(expected)) {
        tabButton(app, tab).click();
        assert.equal(app.get('appState.tab'), tab.toLowerCase());
        for (const s of texts) assert.ok(app.text().includes(s), `${tab}: falta "${s}"`);
      }
    }));

  it('escribir en un campo actualiza la orden en memoria y se conserva al cambiar de pestaña', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      type(app, input(app, 'input[type=text]'), 'T-777');
      assert.equal(app.get('appState.currentOrder.numeroTicket'), 'T-777');
      tabButton(app, 'CLIENTE').click();
      type(app, input(app, 'input[type=text]'), 'ACME');
      tabButton(app, 'GENERAL').click();
      assert.equal(input(app, 'input[type=text]').value, 'T-777');
      tabButton(app, 'CLIENTE').click();
      assert.equal(input(app, 'input[type=text]').value, 'ACME');
    }));

  it('pestaña solución: textarea con límite de 1320, checkbox y campos de equipos', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      tabButton(app, 'SOLUCION').click();
      const areas = [...app.document.querySelectorAll('textarea')];
      assert.equal(areas.length, 3);
      assert.ok(areas.some((a) => a.getAttribute('maxlength') === '1320'));
      const cb = input(app, 'input[type=checkbox]');
      cb.checked = true;
      cb.dispatchEvent(new app.window.Event('change', { bubbles: true }));
      assert.equal(app.get('appState.currentOrder.solicitaTerminal'), true);
      const ph = (p) => input(app, `input[placeholder="${p}"]`);
      type(app, ph('Número de serie Retirada'), 'SR9');
      type(app, ph('Dirección MAC Retirada'), 'AA');
      type(app, ph('Número de serie Instalada'), 'SI9');
      type(app, ph('Dirección MAC instalada'), 'BB');
      type(app, areas[0], 'Falla X');
      assert.deepEqual(
        J(app.get('(({serieRetirada,macRetirada,serieInstalada,macInstalada,incidencia})=>({serieRetirada,macRetirada,serieInstalada,macInstalada,incidencia}))(appState.currentOrder)')),
        { serieRetirada: 'SR9', macRetirada: 'AA', serieInstalada: 'SI9', macInstalada: 'BB', incidencia: 'Falla X' });
    }));

  it('Cancelar vuelve a la lista sin guardar; Guardar persiste la orden', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      [...app.document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Cancelar').click();
      assert.equal(app.get('appState.view'), 'list');
      assert.equal(app.get('db.getAllOrders().length'), 0);
      app.call('createNewOrder');
      type(app, input(app, 'input[type=text]'), 'GUARDADA');
      [...app.document.querySelectorAll('button')].find((b) => b.textContent.includes('Guardar')).click();
      assert.equal(app.get('appState.view'), 'list');
      assert.equal(app.get('db.getOrder(1).numeroTicket'), 'GUARDADA');
      assert.ok(app.text().includes('GUARDADA'));
    }));

  it('con cloudEditId muestra el aviso de edición de la Nube y el botón "Guardar en Nube"', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      app.get("appState.setState({cloudEditId: 55})");
      const t = app.text();
      assert.ok(t.includes('Editando registro de la Nube'));
      assert.ok(t.includes('Editar desde la Nube'));
      assert.ok(t.includes('Guardar en Nube'));
      assert.ok(t.includes('Cancelar edición'));
    }));
});

describe('Pestaña Entregas', () => {
  it('agregar fila crea un material por defecto y actualiza el total', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      tabButton(app, 'ENTREGAS').click();
      assert.ok(app.text().includes('No hay materiales registrados'));
      app.call('addEquipo');
      assert.deepEqual(J(app.get('appState.currentOrder.entregas.materiales')),
        [{ cantidad: 1, marca: '', modelo: '', serie: '', observaciones: '' }]);
      assert.ok(app.text().includes('Total de entregas: 1'));
      app.call('addEquipo');
      assert.ok(app.text().includes('Total de entregas: 2'));
    }));

  it('updateEquipo edita un campo; índice inexistente se ignora', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      app.call('addEquipo');
      app.call('updateEquipo', 0, 'marca', 'HP');
      app.call('updateEquipo', 5, 'marca', 'nada');
      assert.equal(app.get('appState.currentOrder.entregas.materiales[0].marca'), 'HP');
      assert.equal(app.get('appState.currentOrder.entregas.materiales.length'), 1);
    }));

  it('escribir en las celdas de la tabla actualiza el material', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      tabButton(app, 'ENTREGAS').click();
      app.call('addEquipo');
      const cells = app.document.querySelectorAll('tbody tr input, tbody tr textarea');
      assert.ok(cells.length >= 5);
      type(app, cells[1], 'Dell');
      assert.equal(app.get('appState.currentOrder.entregas.materiales[0].marca'), 'Dell');
    }));

  it('removeEquipo elimina la fila indicada', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      app.call('addEquipo'); app.call('addEquipo');
      app.call('updateEquipo', 0, 'marca', 'A');
      app.call('updateEquipo', 1, 'marca', 'B');
      app.call('removeEquipo', 0);
      assert.deepEqual(J(app.get('appState.currentOrder.entregas.materiales.map(m=>m.marca)')), ['B']);
    }));

  it('crea la estructura entregas si la orden no la tenía (órdenes antiguas)', () =>
    withApp(async (app) => {
      app.get("editOrder({id: 1, numeroTicket: 'viejo'})");
      app.call('addEquipo');
      assert.equal(app.get('appState.currentOrder.entregas.materiales.length'), 1);
    }));
});

describe('Pestaña Evidencias', () => {
  it('muestra miniaturas por categoría y el botón "quitar" elimina la imagen', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      app.get(`db.saveImage('a','${IMG}'); db.saveImage('b','${IMG}'); appState.currentOrder.images.extras=['a','b'];`);
      tabButton(app, 'EVIDENCIAS').click();
      const imgs = app.document.querySelectorAll('#tab-content img');
      assert.equal(imgs.length, 2);
      app.document.querySelector('#tab-content img + button').click();
      assert.deepEqual(J(app.get('appState.currentOrder.images.extras')), ['b']);
    }));

  it('ignora ids de imagen sin datos en la BD', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      app.get("appState.currentOrder.images.inicial=['fantasma']");
      tabButton(app, 'EVIDENCIAS').click();
      assert.equal(app.document.querySelectorAll('#tab-content img').length, 0);
    }));

  it('los inputs de archivo (cámara/galería) suben imágenes a su categoría', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      tabButton(app, 'EVIDENCIAS').click();
      const cam = app.document.getElementById('file_camera_instalacion');
      assert.equal(cam.getAttribute('capture'), 'environment');
      assert.equal(app.document.getElementById('file_gallery_instalacion').hasAttribute('multiple'), true);
      const f = new app.window.File(['x'], 'a.jpg', { type: 'image/jpeg' });
      await app.window.eval('handleFileInput')('instalacion', { files: [f] });
      assert.equal(app.get('appState.currentOrder.images.instalacion.length'), 1);
    }));
});

describe('Pestaña Firmas', () => {
  const openFirmas = async (app) => {
    app.call('createNewOrder');
    tabButton(app, 'FIRMAS').click();
    await tick(150); // initSignature se ejecuta con setTimeout(…, 100)
  };

  it('inicializa ambos lienzos al abrir la pestaña', () =>
    withApp(async (app) => {
      await openFirmas(app);
      assert.equal(app.get('!!canvasIngeniero'), true);
      assert.equal(app.get('!!canvasCliente'), true);
      assert.equal(app.document.querySelectorAll('canvas.signature-canvas').length, 2);
    }));

  it('dibujar con el mouse activa y desactiva el trazo por lienzo', () =>
    withApp(async (app) => {
      await openFirmas(app);
      const c = app.document.getElementById('signatureCanvasIngeniero');
      const ev = (t) => new app.window.MouseEvent(t, { clientX: 10, clientY: 10, bubbles: true });
      c.dispatchEvent(ev('mousedown'));
      assert.equal(app.get('isDrawingIngeniero'), true);
      assert.equal(app.get('isDrawingCliente'), false);
      c.dispatchEvent(ev('mousemove'));
      c.dispatchEvent(ev('mouseup'));
      assert.equal(app.get('isDrawingIngeniero'), false);
      const c2 = app.document.getElementById('signatureCanvasCliente');
      c2.dispatchEvent(ev('mousedown'));
      assert.equal(app.get('isDrawingCliente'), true);
      c2.dispatchEvent(ev('mouseleave'));
      assert.equal(app.get('isDrawingCliente'), false);
    }));

  it('"Guardar Firma" guarda el lienzo como dataURL en la orden y avisa', () =>
    withApp(async (app) => {
      await openFirmas(app);
      app.call('saveSignature', 'ingeniero');
      app.call('saveSignature', 'cliente');
      assert.match(app.get('appState.currentOrder.firmaIngeniero'), /^data:image\/png;base64,/);
      assert.match(app.get('appState.currentOrder.firmaCliente'), /^data:image\/png;base64,/);
      assert.deepEqual(app.calls.alerts, ['Firma del ingeniero guardada', 'Firma del cliente guardada']);
    }));

  it('"Limpiar" borra el lienzo', () =>
    withApp(async (app) => {
      await openFirmas(app);
      let cleared = 0;
      app.get('canvasCliente').getContext('2d').clearRect = () => { cleared++; };
      app.call('clearSignature', 'cliente');
      assert.equal(cleared, 1);
    }));

  it('"Cargar Imagen" dibuja el archivo en el lienzo, lo guarda y avisa', () =>
    withApp(async (app) => {
      await openFirmas(app);
      const f = new app.window.File(['png'], 'firma.png', { type: 'image/png' });
      app.call('loadSignatureFromFile', 'cliente', { files: [f] });
      await tick(50);
      assert.match(app.get('appState.currentOrder.firmaCliente'), /^data:image\/png;base64,/);
      assert.deepEqual(app.calls.alerts, ['Firma cargada desde archivo']);
    }));

  it('"Cargar Imagen" sin archivo no hace nada', () =>
    withApp(async (app) => {
      await openFirmas(app);
      app.call('loadSignatureFromFile', 'cliente', { files: [] });
      await tick(20);
      assert.equal(app.calls.alerts.length, 0);
    }));

  it('getCanvasCoords escala las coordenadas del cliente al tamaño real del lienzo', () =>
    withApp(async (app) => {
      await openFirmas(app);
      const canvas = app.get('canvasCliente');
      canvas.getBoundingClientRect = () => ({ left: 100, top: 50, width: 250, height: 125 }); // mitad de 500x250
      const r = J(app.window.eval('getCanvasCoords')({ clientX: 150, clientY: 100 }, canvas));
      assert.deepEqual(r, { x: 100, y: 100 });
    }));
});
