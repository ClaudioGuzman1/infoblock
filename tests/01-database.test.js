'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withApp, J } = require('./harness');

const IMG = 'data:image/jpeg;base64,QUJD';

describe('Database – arranque y persistencia', () => {
  it('sin datos previos inicia con {orders: [], counter: 1}', () =>
    withApp(async (app) => {
      assert.deepEqual(J(app.get('db.db')), { orders: [], counter: 1 });
      assert.equal(app.get('db.images.size'), 0);
    }));

  it('restaura órdenes, contador e imágenes desde localStorage (ods_data / ods_images)', () =>
    withApp({
      storage: {
        ods_data: { orders: [{ id: 5, numeroTicket: 'A-5' }], counter: 6 },
        ods_images: [['img1', IMG]],
      },
    }, async (app) => {
      assert.equal(app.get('db.getAllOrders().length'), 1);
      assert.equal(app.get('db.getOrder(5).numeroTicket'), 'A-5');
      assert.equal(app.get('db.db.counter'), 6);
      assert.equal(app.get("db.getImage('img1')"), IMG);
    }));

  it('createOrder asigna ids incrementales y persiste en ods_data', () =>
    withApp(async (app) => {
      const a = J(app.get("db.createOrder({numeroTicket:'A'})"));
      const b = J(app.get("db.createOrder({numeroTicket:'B'})"));
      assert.equal(a.id, 1);
      assert.equal(b.id, 2);
      const saved = JSON.parse(app.window.localStorage.getItem('ods_data'));
      assert.equal(saved.orders.length, 2);
      assert.equal(saved.counter, 3);
    }));

  it('createOrder no muta el objeto original recibido', () =>
    withApp(async (app) => {
      const r = app.get("(()=>{ const o={numeroTicket:'X'}; db.createOrder(o); return 'id' in o; })()");
      assert.equal(r, false);
    }));

  it('updateOrder fusiona campos, persiste y devuelve la orden actualizada', () =>
    withApp(async (app) => {
      app.get("db.createOrder({numeroTicket:'A', cliente:'C1'})");
      const upd = J(app.get("db.updateOrder(1, {cliente:'C2'})"));
      assert.equal(upd.numeroTicket, 'A');
      assert.equal(upd.cliente, 'C2');
      const saved = JSON.parse(app.window.localStorage.getItem('ods_data'));
      assert.equal(saved.orders[0].cliente, 'C2');
    }));

  it('updateOrder devuelve null si el id no existe', () =>
    withApp(async (app) => {
      assert.equal(app.get("db.updateOrder(99, {a:1})"), null);
    }));

  it('deleteOrder elimina la orden y las imágenes que referencia', () =>
    withApp(async (app) => {
      app.get(`db.saveImage('i1','${IMG}'); db.saveImage('i2','${IMG}'); db.saveImage('otra','${IMG}');
               db.createOrder({numeroTicket:'A', images:{inicial:['i1'], extras:['i2']}});`);
      app.get('db.deleteOrder(1)');
      assert.equal(app.get('db.getAllOrders().length'), 0);
      assert.equal(app.get("db.images.has('i1')"), false);
      assert.equal(app.get("db.images.has('i2')"), false);
      assert.equal(app.get("db.images.has('otra')"), true);
      assert.equal(JSON.parse(app.window.localStorage.getItem('ods_data')).orders.length, 0);
    }));

  it('duplicateOrder copia la orden con id nuevo, sin firmas y con imágenes clonadas', () =>
    withApp(async (app) => {
      app.get(`db.saveImage('i1','${IMG}');
               db.createOrder({numeroTicket:'A', firmaCliente:'F1', firmaIngeniero:'F2',
                               images:{inicial:['i1'], mediciones:[], instalacion:[], extras:[]}});`);
      const dup = J(app.get('db.duplicateOrder(1)'));
      assert.equal(dup.id, 2);
      assert.equal(dup.numeroTicket, 'A');
      assert.ok(!('firmaCliente' in dup));
      assert.ok(!('firmaIngeniero' in dup));
      assert.equal(dup.images.inicial.length, 1);
      assert.notEqual(dup.images.inicial[0], 'i1'); // id nuevo
      assert.equal(app.get(`db.getImage('${dup.images.inicial[0]}')`), IMG); // mismo contenido
      assert.equal(app.get('db.getAllOrders().length'), 2);
    }));

  it('duplicateOrder devuelve null si el id no existe', () =>
    withApp(async (app) => {
      assert.equal(app.get('db.duplicateOrder(42)'), null);
    }));

  it('getImage prioriza la caché temporal en memoria (window._tmpImgCache)', () =>
    withApp(async (app) => {
      app.get(`db.saveImage('k','LOCAL'); window._tmpImgCache = new Map([['k','NUBE'], ['solo','X']]);`);
      assert.equal(app.get("db.getImage('k')"), 'NUBE');
      assert.equal(app.get("db.getImage('solo')"), 'X');
      app.get('window._tmpImgCache = new Map()');
      assert.equal(app.get("db.getImage('k')"), 'LOCAL');
    }));

  it('COMPORTAMIENTO ACTUAL: las imágenes solo viven en memoria (save() no escribe ods_images)', () =>
    withApp(async (app) => {
      app.get(`db.saveImage('i1','${IMG}')`);
      assert.equal(app.window.localStorage.getItem('ods_images'), null);
    }));
});
