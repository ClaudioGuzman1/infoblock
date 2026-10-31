'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withApp, J, tick, canvasText } = require('./harness');

const IMG = 'data:image/jpeg;base64,QUJD';
const today = () => new Date().toISOString().split('T')[0];

describe('Utilidades', () => {
  it('showToast crea un aviso con el texto/color, inyecta el <style> una sola vez y se autoelimina', () =>
    withApp(async (app) => {
      const timers = [];
      app.window.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return 1; };
      app.get("showToast('Hola', '#123456')");
      app.get("showToast('Otro')");
      const toasts = [...app.document.body.children].filter((e) => e.style.position === 'fixed');
      assert.equal(toasts.length, 2);
      assert.equal(toasts[0].textContent, 'Hola');
      assert.match(toasts[0].style.cssText, /#123456|rgb\(18, 52, 86\)/);
      assert.match(toasts[1].style.cssText, /#10b981|rgb\(16, 185, 129\)/); // color por defecto
      assert.equal(app.document.querySelectorAll('#toast-style').length, 1);
      assert.equal(timers[0].ms, 3600);
      timers[0].fn();
      assert.equal(app.document.body.textContent.includes('Hola'), false);
    }));

  it('compressImage reduce a 800px de ancho, mantiene proporción y exporta JPEG calidad 0.6', () =>
    withApp(async (app) => {
      const file = new app.window.File(['abc'], 'foto.jpg', { type: 'image/jpeg' });
      const out = await app.window.eval('compressImage')(file);
      assert.match(out, /^data:image\/jpeg;base64,/);
      assert.equal(canvasText(out), 'CANVAS[800x600,q=0.6]'); // imagen simulada 1600x1200 → 800x600
    }));
});

describe('AppState', () => {
  it('estado inicial', () =>
    withApp(async (app) => {
      const s = J(app.get('(()=>{ const s = new AppState(); return {view:s.view, tab:s.tab, search:s.search, cloudPage:s.cloudPage, size:s.cloudPageSize, edit:s.cloudEditId}; })()'));
      assert.deepEqual(s, { view: 'list', tab: 'general', search: '', cloudPage: 0, size: 150, edit: null });
    }));

  it('setState fusiona propiedades y notifica a todos los suscriptores', () =>
    withApp(async (app) => {
      const r = J(app.get(`(()=>{ const s = new AppState(); let a=0,b=0;
        s.subscribe(()=>a++); s.subscribe(()=>b++);
        s.setState({view:'form', tab:'cliente'}); s.setState({search:'x'});
        return {a,b,view:s.view,tab:s.tab,search:s.search}; })()`));
      assert.deepEqual(r, { a: 2, b: 2, view: 'form', tab: 'cliente', search: 'x' });
    }));
});

describe('Funciones de negocio', () => {
  it('loadOrders vuelca las órdenes de la base en appState.orders', () =>
    withApp(async (app) => {
      app.get("db.createOrder({numeroTicket:'A'}); db.createOrder({numeroTicket:'B'}); loadOrders();");
      assert.equal(app.get('appState.orders.length'), 2);
    }));

  it('createNewOrder abre el formulario con una orden vacía y valores por defecto', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      assert.equal(app.get('appState.view'), 'form');
      assert.equal(app.get('appState.tab'), 'general');
      const o = J(app.get('appState.currentOrder'));
      assert.equal(o.fechaAtencion, today());
      assert.equal(o.fechaCreacion, today());
      assert.equal(o.numeroTicket, '');
      assert.equal(o.solicitaTerminal, false);
      assert.deepEqual(o.images, { inicial: [], mediciones: [], instalacion: [], extras: [] });
      assert.deepEqual(o.entregas, { materiales: [] });
      assert.equal(o.firmaCliente, null);
      assert.equal(o.firmaIngeniero, null);
      assert.ok(!('id' in o));
    }));

  it('editOrder carga la orden indicada en el formulario (pestaña general)', () =>
    withApp(async (app) => {
      app.get("appState.setState({tab:'firmas'}); editOrder({id: 3, numeroTicket: 'Z'})");
      assert.equal(app.get('appState.view'), 'form');
      assert.equal(app.get('appState.tab'), 'general');
      assert.equal(app.get('appState.currentOrder.id'), 3);
    }));

  it('saveOrder crea una orden nueva cuando no tiene id y vuelve a la lista', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      app.call('updateField', 'numeroTicket', 'N-1');
      app.call('saveOrder');
      assert.equal(app.get('appState.view'), 'list');
      assert.equal(app.get('db.getAllOrders().length'), 1);
      assert.equal(app.get('db.getOrder(1).numeroTicket'), 'N-1');
      assert.equal(app.get('appState.orders.length'), 1);
    }));

  it('saveOrder actualiza cuando la orden ya tiene id', () =>
    withApp(async (app) => {
      app.get("db.createOrder({numeroTicket:'A', cliente:'C1'}); loadOrders();");
      app.get("editOrder(JSON.parse(JSON.stringify(db.getOrder(1))))");
      app.call('updateField', 'cliente', 'C2');
      app.call('saveOrder');
      assert.equal(app.get('db.getAllOrders().length'), 1);
      assert.equal(app.get('db.getOrder(1).cliente'), 'C2');
    }));

  it('updateField modifica solo en memoria y no falla sin orden actual', () =>
    withApp(async (app) => {
      app.call('updateField', 'cliente', 'nada'); // sin currentOrder → no hace nada
      app.call('createNewOrder');
      app.call('updateField', 'cliente', 'ACME');
      assert.equal(app.get('appState.currentOrder.cliente'), 'ACME');
      assert.equal(app.get('db.getAllOrders().length'), 0); // no persiste hasta guardar
    }));

  it('deleteOrder pide confirmación: sí elimina, no conserva', () =>
    withApp(async (app) => {
      app.get("db.createOrder({numeroTicket:'A'}); loadOrders();");
      app.setConfirm(false);
      app.call('deleteOrder', 1);
      assert.equal(app.get('db.getAllOrders().length'), 1);
      assert.deepEqual(app.calls.confirms, ['¿Eliminar esta ODS?']);
      app.setConfirm(true);
      app.call('deleteOrder', 1);
      assert.equal(app.get('db.getAllOrders().length'), 0);
      assert.equal(app.get('appState.orders.length'), 0);
    }));

  it('duplicateOrder (UI) duplica, recarga la lista y avisa', () =>
    withApp(async (app) => {
      app.get("db.createOrder({numeroTicket:'A'}); loadOrders();");
      app.call('duplicateOrder', 1);
      assert.equal(app.get('appState.orders.length'), 2);
      assert.deepEqual(app.calls.alerts, ['ODS duplicada exitosamente']);
    }));

  it('duplicateOrder con id inexistente no hace nada', () =>
    withApp(async (app) => {
      app.call('duplicateOrder', 99);
      assert.equal(app.calls.alerts.length, 0);
    }));

  it('addImage agrega/quita ids por categoría y refresca solo la pestaña evidencias', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      app.get(`db.saveImage('i1','${IMG}')`);
      app.get("appState.setState({tab:'evidencias'})");
      app.call('addImage', 'inicial', 'i1', false);
      assert.deepEqual(J(app.get('appState.currentOrder.images.inicial')), ['i1']);
      assert.ok(app.document.getElementById('tab-content').innerHTML.includes(`src="${IMG}"`));
      app.call('addImage', 'inicial', 'i1', true);
      assert.deepEqual(J(app.get('appState.currentOrder.images.inicial')), []);
      assert.ok(!app.document.getElementById('tab-content').innerHTML.includes(`src="${IMG}"`));
    }));

  it('addImage crea la categoría si no existía', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      app.call('addImage', 'nueva', 'x', false);
      assert.deepEqual(J(app.get('appState.currentOrder.images.nueva')), ['x']);
    }));

  it('handleImageUpload comprime cada archivo, lo guarda en la BD y lo agrega a la categoría', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      const f1 = new app.window.File(['1'], 'a.jpg', { type: 'image/jpeg' });
      const f2 = new app.window.File(['2'], 'b.jpg', { type: 'image/jpeg' });
      await app.window.eval('handleImageUpload')('mediciones', [f1, f2]);
      const ids = J(app.get('appState.currentOrder.images.mediciones'));
      assert.equal(ids.length, 2);
      for (const id of ids) {
        assert.match(id, /^img_\d+_/);
        const img = app.get(`db.getImage('${id}')`);
        assert.match(img, /^data:image\/jpeg;base64,/);
        assert.equal(canvasText(img), 'CANVAS[800x600,q=0.6]');
      }
    }));
});
