'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withApp, readBlob, J, tick } = require('./harness');

const IMG = 'data:image/jpeg;base64,QUJD';
const seed = () => ({
  ods_data: { orders: [{ id: 1, numeroTicket: 'LOCAL-1' }], counter: 2 },
  ods_images: [['imgLocal', IMG]],
});
const backupFile = (app, payload, name = 'backup.json') =>
  new app.window.File([typeof payload === 'string' ? payload : JSON.stringify(payload)], name, { type: 'application/json' });
const fileInput = (file) => ({ files: [file], value: 'C:\\fakepath\\backup.json' });

describe('Exportar datos', () => {
  it('descarga ODS-backup-AAAA-MM-DD.json con versión, fecha, órdenes, contador e imágenes', () =>
    withApp({ storage: seed() }, async (app) => {
      app.call('exportData');
      assert.equal(app.calls.downloads.length, 1);
      assert.match(app.calls.downloads[0].download, /^ODS-backup-\d{4}-\d{2}-\d{2}\.json$/);
      assert.deepEqual(app.calls.alerts, ['Datos exportados exitosamente']);
      const json = JSON.parse(await readBlob(app, app.calls.blobs[0]));
      assert.equal(json.version, '1.0');
      assert.ok(!Number.isNaN(Date.parse(json.exportDate)));
      assert.equal(json.data.orders[0].numeroTicket, 'LOCAL-1');
      assert.equal(json.data.counter, 2);
      assert.deepEqual(json.data.images, [['imgLocal', IMG]]);
    }));
});

describe('Importar (reemplazar)', () => {
  it('pide confirmación y, si se cancela, no toca los datos', () =>
    withApp({ storage: seed() }, async (app) => {
      app.setConfirm(false);
      const input = fileInput(backupFile(app, { data: { orders: [], counter: 1, images: [] } }));
      app.call('importData', input);
      await tick(30);
      assert.match(app.calls.confirms[0], /REEMPLAZARÁ/);
      assert.equal(app.get('db.getAllOrders().length'), 1);
      assert.equal(input.value, '');
    }));

  it('reemplaza órdenes, contador e imágenes, persiste y refresca la lista', () =>
    withApp({ storage: seed() }, async (app) => {
      const payload = {
        version: '1.0',
        data: { orders: [{ id: 10, numeroTicket: 'IMP-10' }, { id: 11, numeroTicket: 'IMP-11' }], counter: 12, images: [['imgX', IMG]] },
      };
      const input = fileInput(backupFile(app, payload));
      app.call('importData', input);
      await tick(50);
      assert.deepEqual(J(app.get('db.getAllOrders().map(o=>o.numeroTicket)')), ['IMP-10', 'IMP-11']);
      assert.equal(app.get('db.db.counter'), 12);
      assert.equal(app.get("db.getImage('imgX')"), IMG);
      assert.equal(app.get("db.images.has('imgLocal')"), false);
      assert.equal(JSON.parse(app.window.localStorage.getItem('ods_data')).orders.length, 2);
      assert.equal(app.get('appState.orders.length'), 2);
      assert.ok(app.text().includes('IMP-11'));
      assert.deepEqual(app.calls.alerts, ['Datos importados exitosamente\n2 órdenes restauradas']);
      assert.equal(input.value, '');
    }));

  it('rechaza archivos con formato inválido sin modificar los datos', () =>
    withApp({ storage: seed() }, async (app) => {
      for (const bad of ['no es json', { data: {} }, { orders: [] }]) {
        app.calls.alerts.length = 0;
        app.call('importData', fileInput(backupFile(app, bad)));
        await tick(30);
        assert.deepEqual(app.calls.alerts, ['Error al importar los datos. Verifica que el archivo sea válido.']);
        assert.equal(app.get('db.getOrder(1).numeroTicket'), 'LOCAL-1');
      }
    }));

  it('sin archivo seleccionado no hace nada', () =>
    withApp(async (app) => {
      app.call('importData', { files: [], value: '' });
      assert.equal(app.calls.confirms.length, 0);
    }));
});

describe('Combinar datos', () => {
  it('añade las órdenes importadas con ids nuevos, actualiza el contador y mezcla imágenes', () =>
    withApp({ storage: seed() }, async (app) => {
      const payload = {
        data: {
          orders: [{ id: 1, numeroTicket: 'EXT-A' }, { id: 2, numeroTicket: 'EXT-B' }],
          counter: 3,
          images: [['imgExt', IMG]],
        },
      };
      app.call('mergeData', fileInput(backupFile(app, payload)));
      await tick(50);
      assert.match(app.calls.confirms[0], /AÑADIRÁ/);
      const orders = J(app.get('db.getAllOrders().map(o=>({id:o.id,t:o.numeroTicket}))'));
      assert.deepEqual(orders, [{ id: 1, t: 'LOCAL-1' }, { id: 2, t: 'EXT-A' }, { id: 3, t: 'EXT-B' }]);
      assert.equal(app.get('db.db.counter'), 4);
      assert.equal(app.get("db.getImage('imgLocal')"), IMG);
      assert.equal(app.get("db.getImage('imgExt')"), IMG);
      assert.deepEqual(app.calls.alerts, ['Datos combinados exitosamente\n2 órdenes añadidas']);
      assert.equal(app.get('appState.orders.length'), 3);
    }));

  it('cancelar la confirmación no modifica nada; formato inválido muestra error', () =>
    withApp({ storage: seed() }, async (app) => {
      app.setConfirm(false);
      app.call('mergeData', fileInput(backupFile(app, { data: { orders: [{ id: 9 }], counter: 1, images: [] } })));
      await tick(30);
      assert.equal(app.get('db.getAllOrders().length'), 1);
      app.setConfirm(true);
      app.call('mergeData', fileInput(backupFile(app, '{{{')));
      await tick(30);
      assert.deepEqual(app.calls.alerts, ['Error al combinar los datos. Verifica que el archivo sea válido.']);
      assert.equal(app.get('db.getAllOrders().length'), 1);
    }));
});
