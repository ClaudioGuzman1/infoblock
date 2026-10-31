'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withApp, J, tick, jsonResponse, sampleOrder } = require('./harness');

const IMG = 'data:image/jpeg;base64,QUJD';
const SIG = 'data:image/png;base64,QUJD';
const run = (app, fn, order) => app.window.eval(`${fn}(${JSON.stringify(order)})`);
const okFetch = (app) =>
  app.setFetch(async (url) => jsonResponse(url.includes('/rest/v1/ods') ? [{ id: 1 }] : {}));

describe('generatePDF_ODS', () => {
  it('genera "ODS_<ticket>.pdf" en tamaño carta, lo guarda y lo abre en otra pestaña', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_ODS', sampleOrder());
      await tick(30);
      const pdf = app.lastPdf();
      assert.deepEqual(pdf.args, ['p', 'mm', 'letter', true]);
      assert.equal(pdf.saved, 'ODS_T-1001.pdf');
      assert.deepEqual(app.calls.opens, [['blob:fake-bloburl', '_blank']]);
    }));

  it('usa el id cuando no hay número de ticket', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_ODS', sampleOrder({ numeroTicket: '', id: 42 }));
      await tick(30);
      assert.equal(app.lastPdf().saved, 'ODS_42.pdf');
    }));

  it('imprime los datos del cliente, servicio, equipos (series y MAC en mayúsculas) y comentarios', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_ODS', sampleOrder());
      await tick(30);
      const t = app.lastPdf().texts();
      for (const s of ['Orden de Servicio', 'ACME', 'Sucursal Centro', 'Luis', '555', 'l@acme.mx', 'Correctivo',
        '2026-08-31', 'TPV-01', 'No enciende', 'Se cambió equipo', 'SR1', 'SI1', 'AA:BB', 'CC:DD', 'Todo ok',
        'Por IBServices', 'Por Cliente', 'Ana Ing']) {
        assert.ok(t.includes(s), 'falta en el PDF: ' + s);
      }
    }));

  it('pone "---" cuando no hay serie/MAC', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_ODS', sampleOrder({ serieRetirada: '', macRetirada: '', serieInstalada: '', macInstalada: '' }));
      await tick(30);
      assert.equal(app.lastPdf().texts().filter((t) => t === '---').length, 4);
    }));

  it('sin imágenes genera 1 página; incluye firmas si existen', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_ODS', sampleOrder({ firmaCliente: SIG, firmaIngeniero: SIG }));
      await tick(30);
      const pdf = app.lastPdf();
      assert.equal(pdf.pages, 1);
      // logo + barra + 2 firmas
      assert.equal(pdf.images().filter((i) => i.args[1] === 'PNG').length, 4);
    }));

  const withImages = (app, n) => {
    const ids = [];
    for (let i = 0; i < n; i++) {
      app.get(`db.saveImage('p${i}','${IMG}')`);
      ids.push('p' + i);
    }
    return sampleOrder({ images: { inicial: ids.slice(0, 2), mediciones: ids.slice(2), instalacion: [], extras: [] } });
  };

  it('4 imágenes por página (por defecto): 1 hoja de evidencia para 4 fotos, 2 hojas para 5', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_ODS', withImages(app, 4));
      await tick(30);
      assert.equal(app.lastPdf().pages, 2);
      assert.ok(app.lastPdf().texts().includes('Evidencia de soporte'));
      assert.equal(app.lastPdf().images().filter((i) => i.args[1] === 'JPEG').length, 4);
      run(app, 'generatePDF_ODS', withImages(app, 5));
      await tick(30);
      assert.equal(app.lastPdf().pages, 3);
    }));

  it('el selector #TPH=2in1 cambia a 2 imágenes por página', () =>
    withApp(async (app) => {
      okFetch(app);
      app.document.getElementById('TPH').value = '2in1';
      run(app, 'generatePDF_ODS', withImages(app, 4));
      await tick(30);
      assert.equal(app.lastPdf().pages, 3); // portada + 2 hojas de 2 fotos
    }));

  it('paginación "N de M" en el pie de cada página', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_ODS', withImages(app, 4));
      await tick(30);
      const t = app.lastPdf().texts();
      assert.ok(t.includes('1 de 2'));
      assert.ok(t.includes('2 de 2'));
    }));

  it('las imágenes de la caché de la nube (_tmpImgCache) también se incluyen', () =>
    withApp(async (app) => {
      okFetch(app);
      app.get(`window._tmpImgCache = new Map([['tmp1','${IMG}']])`);
      run(app, 'generatePDF_ODS', sampleOrder({ images: { inicial: ['tmp1'], mediciones: [], instalacion: [], extras: [] } }));
      await tick(30);
      assert.equal(app.lastPdf().pages, 2);
    }));
});

describe('generatePDF_IDT', () => {
  it('genera "IDT_<ticket>_<cliente>_<sitio>.pdf" con datos del proyecto e instalación', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_IDT', sampleOrder());
      await tick(30);
      const pdf = app.lastPdf();
      assert.equal(pdf.saved, 'IDT_T-1001_ACME_Sucursal Centro.pdf');
      const t = pdf.texts();
      for (const s of ['Instalación de terminal Libera 7', 'Datos del proyecto:', 'ACME', 'Sucursal Centro', 'Av. 1', 'Luis',
        'Gerente', 'l@acme.mx', 'TPV-01', 'si1', 'cc:dd', 'Comentario de la instalación', 'Se cambió equipo']) {
        assert.ok(t.includes(s), 'falta en IDT: ' + s);
      }
      assert.equal(app.calls.opens.length, 1);
    }));

  it('usa valores por defecto en el nombre cuando faltan datos', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_IDT', sampleOrder({ numeroTicket: '', cliente: '', ubicacion: '' }));
      await tick(30);
      assert.equal(app.lastPdf().saved, 'IDT_Ticket_Cliente_Sitio.pdf');
    }));
});

describe('generatePDF_CDE', () => {
  it('genera "CDE_<ticket>.pdf" con el destinatario y la tabla de materiales', () =>
    withApp(async (app) => {
      okFetch(app);
      const o = sampleOrder({ entregas: { materiales: [
        { cantidad: 2, marca: 'HP', modelo: 'M1', serie: 'S1', observaciones: 'obs' },
        { cantidad: 1, marca: 'Dell', modelo: 'M2', serie: 'S2', observaciones: '' },
      ] } });
      run(app, 'generatePDF_CDE', o);
      await tick(30);
      const pdf = app.lastPdf();
      assert.equal(pdf.saved, 'CDE_T-1001.pdf');
      const t = pdf.texts();
      for (const s of ['Comprobante de Entrega de Materiales', 'Datos del Destinatario', 'ACME', 'Lista de Materiales a Entregar',
        'HP', 'M1', 'S1', 'obs', 'Dell', 'M2', 'S2', 'Total de materiales: 2', 'Recibido por', 'Todo ok']) {
        assert.ok(t.includes(s), 'falta en CDE: ' + s);
      }
      assert.equal(app.calls.opens.length, 1);
    }));

  it('sin materiales igualmente genera el comprobante', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_CDE', sampleOrder());
      await tick(30);
      assert.ok(app.lastPdf().texts().includes('Comprobante de Entrega de Materiales'));
    }));
});

describe('Sincronización con la nube al imprimir', () => {
  it('ODS: sube evidencias/firmas al bucket e inserta el registro en /rest/v1/ods', () =>
    withApp(async (app) => {
      okFetch(app);
      app.get(`db.saveImage('a','${IMG}'); db.saveImage('b','${IMG}')`);
      run(app, 'generatePDF_ODS', sampleOrder({
        images: { inicial: ['a'], mediciones: [], instalacion: ['b'], extras: [] },
        firmaCliente: SIG, firmaIngeniero: SIG,
        entregas: { materiales: [{ cantidad: 1, marca: 'HP' }] },
      }));
      await tick(200);
      const calls = app.fetchCalls();
      const uploads = calls.filter((c) => c.url.includes('/storage/v1/object/ods-imagenes/'));
      assert.deepEqual(uploads.map((c) => c.url.split('/ods-imagenes/')[1]).sort(), [
        'ods/T-1001/firma_cliente.png', 'ods/T-1001/firma_ingeniero.png',
        'ods/T-1001/inicial_1.jpg', 'ods/T-1001/instalacion_1.jpg']);
      for (const u of uploads) {
        assert.equal(u.opts.method, 'POST');
        assert.equal(u.opts.headers['x-upsert'], 'true');
        assert.match(u.opts.headers.Authorization, /^Bearer eyJ/);
      }
      const insert = calls.find((c) => c.url.endsWith('/rest/v1/ods'));
      assert.ok(insert, 'no se insertó el registro');
      assert.equal(insert.opts.method, 'POST');
      assert.equal(insert.opts.headers.Prefer, 'return=representation');
      const body = JSON.parse(insert.opts.body);
      assert.equal(body.numero_ticket, 'T-1001');
      assert.equal(body.cliente, 'ACME');
      assert.equal(body.archivo_pdf, 'ODS_T-1001.pdf');
      assert.equal(body.total_imagenes, 2);
      assert.equal(body.tiene_firma_cliente, true);
      assert.deepEqual(body.entregas, [{ cantidad: 1, marca: 'HP' }]);
      assert.match(body.imagenes.inicial[0].url, /\/storage\/v1\/object\/public\/ods-imagenes\/ods\/T-1001\/inicial_1\.jpg$/);
      assert.ok(app.document.body.textContent.includes('ODS sincronizada con la Nube'));
    }));

  it('si la sincronización falla: avisa y deja el pendiente en ods_pendientes_sync', () =>
    withApp(async (app) => {
      app.setFetch(async () => jsonResponse('boom', { ok: false, status: 500 }));
      run(app, 'generatePDF_ODS', sampleOrder({ id: 8 }));
      await tick(100);
      assert.ok(app.document.body.textContent.includes('Error al sincronizar con la Nube'));
      const pend = JSON.parse(app.window.localStorage.getItem('ods_pendientes_sync'));
      assert.equal(pend.length, 1);
      assert.equal(pend[0].order_id, 8);
      assert.equal(pend[0].ticket, 'T-1001');
      assert.match(pend[0].error, /DB insert failed/);
      // el PDF se abre aunque falle la nube
      assert.equal(app.calls.opens.length, 1);
    }));

  it('CDE: inserta registro en la nube sin firmas', () =>
    withApp(async (app) => {
      okFetch(app);
      run(app, 'generatePDF_CDE', sampleOrder({ firmaCliente: SIG }));
      await tick(100);
      const insert = app.fetchCalls().find((c) => c.url.endsWith('/rest/v1/ods'));
      const body = JSON.parse(insert.opts.body);
      assert.equal(body.archivo_pdf, 'CDE_T-1001.pdf');
      assert.equal(body.tiene_firma_cliente, false);
      assert.equal(body.firma_cliente, null);
      assert.ok(app.document.body.textContent.includes('CDE sincronizado con la Nube'));
    }));

  it('IDT: también sincroniza y encola pendiente si falla', () =>
    withApp(async (app) => {
      app.setFetch(async () => jsonResponse('x', { ok: false, status: 500 }));
      run(app, 'generatePDF_IDT', sampleOrder({ id: 3 }));
      await tick(100);
      assert.equal(JSON.parse(app.window.localStorage.getItem('ods_pendientes_sync')).length, 1);
    }));
});
