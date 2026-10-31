'use strict';
/**
 * Funcionalidad NUEVA (solo existe en la versión refactorizada):
 *  - Imágenes persistentes en IndexedDB
 *  - Copiar un registro de la Nube al dispositivo (con todas sus imágenes) y volver a subirlo
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { IDBFactory } = require('fake-indexeddb');
const { withApp, loadApp, J, tick, jsonResponse, APP_DIR } = require('./harness');

const SKIP = /original/.test(APP_DIR) ? 'solo aplica a la versión refactorizada' : false;
const IMG = 'data:image/jpeg;base64,QUJD';

const rec = (over = {}) => Object.assign({
  id: 7, numero_ticket: 'C-1', cliente: 'Cli', ingeniero: 'Ing', fecha_atencion: '2026-09-02',
  fecha_creacion: '2026-09-01', nombre_terminal: 'T1', tipo_servicio: 'Correctivo', ubicacion: 'U',
  incidencia: 'inc', solucion: 'sol', comentario: 'com',
  imagenes: {
    inicial: [{ orden: 2, url: 'https://x/i2.jpg' }, { orden: 1, url: 'https://x/i1.jpg' }],
    mediciones: [{ orden: 1, url: 'https://x/m1.jpg' }],
    instalacion: [],
    extras: [{ orden: 1, url: 'https://x/e1.jpg' }],
  },
  entregas: [{ cantidad: 1, marca: 'm', modelo: 'mo', serie: 's', observaciones: 'o' }],
  firma_cliente: 'https://x/fc.png', firma_ingeniero: 'https://x/fi.png',
}, over);

const downloadOk = (app, { failUrl } = {}) =>
  app.setFetch(async (url) => {
    if (url.startsWith('https://x/')) {
      if (failUrl && url.includes(failUrl)) return jsonResponse('nope', { ok: false, status: 404 });
      return jsonResponse('IMGDATA');
    }
    return jsonResponse({});
  });

const copy = async (app, r = rec()) => {
  await app.window.eval('copyCloudOrderToLocal')(r);
  await app.flushImages();
};

describe('Imágenes persistentes (IndexedDB)', { skip: SKIP }, () => {
  it('sobreviven a recargar la página', async () => {
    const idb = new IDBFactory();
    let saved;
    const a = await loadApp({ indexedDB: idb });
    a.get(`db.saveImage('img_${Date.now()}_a','${IMG}'); db.createOrder({numeroTicket:'A', images:{inicial:['img_${Date.now()}_a']}})`);
    await a.flushImages();
    saved = a.window.localStorage.getItem('ods_data');
    const ids = J(a.get('[...db.images.keys()]'));
    a.close();

    const b = await loadApp({ indexedDB: idb, storage: { ods_data: saved } });
    assert.equal(b.get('db.persistent'), true);
    assert.equal(b.get(`db.getImage('${ids[0]}')`), IMG);
    b.close();
  });

  it('borrar una orden elimina sus imágenes también del dispositivo', async () => {
    const idb = new IDBFactory();
    const a = await loadApp({ indexedDB: idb });
    const id = `img_${Date.now()}_z`;
    a.get(`db.saveImage('${id}','${IMG}'); db.createOrder({numeroTicket:'A', images:{inicial:['${id}']}}); db.deleteOrder(1);`);
    await a.flushImages();
    a.close();
    const b = await loadApp({ indexedDB: idb });
    assert.equal(b.get('db.images.size'), 0);
    b.close();
  });

  it('al arrancar elimina huérfanas de más de 24 h, pero conserva las recientes y las usadas', async () => {
    const idb = new IDBFactory();
    const old = `img_${Date.now() - 3 * 24 * 3600 * 1000}_old`;
    const fresh = `img_${Date.now()}_fresh`;
    const used = `img_${Date.now() - 5 * 24 * 3600 * 1000}_used`;
    const a = await loadApp({ indexedDB: idb });
    a.get(`['${old}','${fresh}','${used}'].forEach(id => db.images.set(id,'${IMG}'))`);
    await a.flushImages();
    a.close();
    const b = await loadApp({
      indexedDB: idb,
      storage: { ods_data: { orders: [{ id: 1, images: { inicial: [used] } }], counter: 2 } },
    });
    assert.deepEqual(J(b.get('[...db.images.keys()].sort()')), [fresh, used].sort());
    b.close();
  });

  it('importar (reemplazar) también persiste las imágenes importadas', async () => {
    const idb = new IDBFactory();
    const a = await loadApp({ indexedDB: idb });
    a.get(`db.replaceImages([['k1','${IMG}'],['k2','${IMG}']])`);
    await a.flushImages();
    a.get(`db.replaceImages([['k3','${IMG}']])`);
    await a.flushImages();
    a.close();
    const b = await loadApp({ indexedDB: idb });
    assert.deepEqual(J(b.get('[...db.images.keys()]')), ['k3']);
    b.close();
  });

  it('sin IndexedDB la app sigue funcionando en memoria (persistent=false)', () =>
    withApp({ indexedDB: null }, async (app) => {
      assert.equal(app.get('db.persistent'), false);
      app.get(`db.saveImage('k','${IMG}')`);
      assert.equal(app.get("db.getImage('k')"), IMG);
    }));
});

describe('Copiar registro de la Nube a local', { skip: SKIP }, () => {
  it('descarga TODAS las imágenes y firmas, crea la orden local vinculada y abre el formulario', () =>
    withApp(async (app) => {
      downloadOk(app);
      await copy(app);
      const urls = app.fetchCalls().map((c) => c.url).sort();
      assert.deepEqual(urls, ['https://x/e1.jpg', 'https://x/fc.png', 'https://x/fi.png',
        'https://x/i1.jpg', 'https://x/i2.jpg', 'https://x/m1.jpg']);

      assert.equal(app.get('db.getAllOrders().length'), 1);
      const o = J(app.get('db.getAllOrders()[0]'));
      assert.equal(o.cloudId, 7);
      assert.ok(o.cloudCopiedAt);
      assert.equal(o.numeroTicket, 'C-1');
      assert.equal(o.cliente, 'Cli');
      assert.equal(o.nombreTerminal, 'T1');
      assert.deepEqual(o.entregas, { materiales: rec().entregas });
      assert.deepEqual(Object.fromEntries(Object.entries(o.images).map(([k, v]) => [k, v.length])),
        { inicial: 2, mediciones: 1, instalacion: 0, extras: 1 });
      for (const id of Object.values(o.images).flat()) {
        assert.match(id, /^img_\d+_/);
        assert.match(app.get(`db.getImage('${id}')`), /^data:image\/jpeg;base64,/);
      }
      assert.match(o.firmaCliente, /^data:image\//);
      assert.match(o.firmaIngeniero, /^data:image\//);

      assert.equal(app.get('appState.view'), 'form');
      assert.equal(app.get('appState.cloudEditId'), null);
      assert.equal(app.get('appState.currentOrder.id'), o.id);
      assert.equal(app.get('appState.currentOrder.cloudId'), 7);
      assert.ok(app.document.body.textContent.includes('Copia local creada'));
      assert.equal(app.calls.alerts.length, 0);
    }));

  it('las imágenes descargadas quedan guardadas en el dispositivo tras recargar', async () => {
    const idb = new IDBFactory();
    const a = await loadApp({ indexedDB: idb });
    downloadOk(a);
    await copy(a);
    const saved = a.window.localStorage.getItem('ods_data');
    const ids = J(a.get('Object.values(db.getAllOrders()[0].images).flat()'));
    a.close();
    const b = await loadApp({ indexedDB: idb, storage: { ods_data: saved } });
    assert.equal(ids.length, 4);
    for (const id of ids) assert.match(b.get(`db.getImage('${id}')`), /^data:image\//);
    b.close();
  });

  it('respeta el orden de las imágenes (campo "orden")', () =>
    withApp(async (app) => {
      // cada URL devuelve un contenido distinto; las dos de "inicial" llegan desordenadas (orden 2 y 1)
      app.setFetch(async (url) => {
        const r = jsonResponse({});
        r._text = 'D:' + url;
        return r;
      });
      await copy(app);
      const ids = J(app.get('db.getAllOrders()[0].images.inicial'));
      assert.equal(ids.length, 2);
      // contenido base64 distinto por URL → comprobar que el primero corresponde a orden 1
      const first = app.get(`db.getImage('${ids[0]}')`);
      const second = app.get(`db.getImage('${ids[1]}')`);
      const b64 = (u) => app.window.btoa('D:' + u);
      assert.ok(first.endsWith(b64('https://x/i1.jpg')), 'la primera debe ser orden 1');
      assert.ok(second.endsWith(b64('https://x/i2.jpg')));
    }));

  it('todo o nada: si falla una descarga no crea copia, avisa y no deja imágenes huérfanas', () =>
    withApp(async (app) => {
      downloadOk(app, { failUrl: 'm1.jpg' });
      await copy(app);
      assert.equal(app.get('db.getAllOrders().length'), 0);
      assert.equal(app.get('db.images.size'), 0);
      assert.equal(app.calls.alerts.length, 1);
      assert.match(app.calls.alerts[0], /No se pudieron descargar 1 de 6/);
      assert.equal(app.get('appState.view'), 'list');
    }));

  it('una respuesta que no es imagen (p. ej. JSON de error) cuenta como fallo', () =>
    withApp(async (app) => {
      // blob de tipo JSON para una URL (lo que devolvería Storage ante un error)
      app.window.__fetchImpl = async (url) => {
        const r = jsonResponse('IMGDATA');
        r.blob = async () => new app.window.Blob(['{"statusCode":"404"}'], { type: url.includes('e1.jpg') ? 'application/json' : 'image/jpeg' });
        return r;
      };
      await copy(app);
      assert.equal(app.get('db.getAllOrders().length'), 0);
      assert.match(app.calls.alerts[0], /No se pudieron descargar 1 de 6/);
    }));

  it('si ya existe una copia: pide confirmación; "no" conserva la actual sin descargar nada', () =>
    withApp(async (app) => {
      downloadOk(app);
      await copy(app);
      const firstId = app.get('db.getAllOrders()[0].id');
      app.calls.alerts.length = 0;
      app.setFetch(async () => jsonResponse({}));
      app.setConfirm(false);
      await copy(app);
      assert.match(app.calls.confirms.at(-1), /Ya existe una copia local/);
      assert.equal(app.fetchCalls().length, 0);
      assert.equal(app.get('db.getAllOrders().length'), 1);
      assert.equal(app.get('db.getAllOrders()[0].id'), firstId);
    }));

  it('si ya existe una copia y se acepta: la reemplaza (1 sola orden) y borra las imágenes anteriores', () =>
    withApp(async (app) => {
      downloadOk(app);
      await copy(app);
      const oldIds = J(app.get('Object.values(db.getAllOrders()[0].images).flat()'));
      app.get("db.updateOrder(1, {cliente:'EDITADO LOCAL'})");
      app.setConfirm(true);
      downloadOk(app);
      await copy(app, rec({ cliente: 'Cli Nube v2' }));
      assert.equal(app.get('db.getAllOrders().length'), 1);
      assert.equal(app.get('db.getAllOrders()[0].cliente'), 'Cli Nube v2');
      for (const id of oldIds) assert.equal(app.get(`db.images.has('${id}')`), false);
      assert.equal(app.get('db.images.size'), 4);
    }));

  it('acepta el id del registro (lo usan los botones) y lo busca en appState.cloudOrders', () =>
    withApp(async (app) => {
      downloadOk(app);
      app.get(`appState.cloudOrders = [${JSON.stringify(rec())}]`);
      await app.window.eval('copyCloudOrderToLocal')(7);
      await app.flushImages();
      assert.equal(app.get('db.getAllOrders()[0].cloudId'), 7);
      await app.window.eval('copyCloudOrderToLocal')(999);
      assert.ok(app.document.body.textContent.includes('Registro de la Nube no encontrado'));
    }));

  it('un registro sin imágenes ni firmas se copia igual', () =>
    withApp(async (app) => {
      downloadOk(app);
      await copy(app, rec({ imagenes: {}, firma_cliente: null, firma_ingeniero: null }));
      assert.equal(app.get('db.getAllOrders().length'), 1);
      assert.equal(app.fetchCalls().length, 0);
      assert.equal(app.get('db.getAllOrders()[0].firmaCliente'), null);
    }));

  it('la lista local marca con ☁️ las copias de la Nube', () =>
    withApp(async (app) => {
      downloadOk(app);
      await copy(app);
      app.get("appState.setState({view:'list'})");
      assert.ok(app.document.querySelector('tbody tr td').textContent.includes('☁️'));
    }));
});

describe('Botones en la vista Nube', { skip: SKIP }, () => {
  const openCloud = async (app) => {
    app.setFetch(async () => jsonResponse([rec()], { headers: { 'Content-Range': '0-0/1' } }));
    await app.call('openSupabaseView');
    await tick(30);
  };

  it('cada fila tiene el botón "📥 Local" que copia por id', () =>
    withApp(async (app) => {
      await openCloud(app);
      const btn = [...app.document.querySelectorAll('tbody tr button')].find((b) => b.textContent.includes('Local'));
      assert.ok(btn, 'falta el botón');
      assert.equal(btn.getAttribute('onclick'), 'copyCloudOrderToLocal(7)');
    }));

  it('el detalle (modal) también ofrece "Copiar a local"', () =>
    withApp(async (app) => {
      await openCloud(app);
      app.get('showCloudDetail(' + JSON.stringify(rec()) + ')');
      const btn = [...app.document.getElementById('cloud-modal').querySelectorAll('button')]
        .find((b) => b.textContent.includes('Copiar a local'));
      assert.ok(btn);
      assert.equal(btn.getAttribute('onclick'), 'copyCloudOrderToLocal(7)');
    }));

  it('pulsar el botón de la fila copia el registro y abre el formulario', () =>
    withApp(async (app) => {
      await openCloud(app);
      downloadOk(app);
      [...app.document.querySelectorAll('tbody tr button')].find((b) => b.textContent.includes('Local')).click();
      await tick(80);
      await app.flushImages();
      assert.equal(app.get('appState.view'), 'form');
      assert.equal(app.get('db.getAllOrders()[0].cloudId'), 7);
    }));
});

describe('Editar la copia local y subirla a la Nube', { skip: SKIP }, () => {
  it('el formulario de una copia muestra el aviso y los botones Guardar y Guardar en Nube', () =>
    withApp(async (app) => {
      downloadOk(app);
      await copy(app);
      const t = app.text();
      assert.ok(t.includes('Copia local de la Nube'));
      assert.ok(t.includes('Guardar en Nube'));
      assert.ok(t.includes('💾 Guardar'));
    }));

  it('una orden local normal NO muestra "Guardar en Nube"', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      assert.ok(!app.text().includes('Guardar en Nube'));
      assert.ok(!app.text().includes('Copia local de la Nube'));
    }));

  it('agregar imágenes del dispositivo y "Guardar en Nube": PATCH al mismo registro con imágenes viejas + nuevas', () =>
    withApp(async (app) => {
      downloadOk(app);
      await copy(app);

      // el usuario agrega una foto de su galería y cambia un dato
      const f = new app.window.File(['x'], 'galeria.jpg', { type: 'image/jpeg' });
      await app.window.eval('handleImageUpload')('instalacion', [f]);
      app.call('updateField', 'comentario', 'Agregué evidencia desde el celular');

      app.setFetch(async (url) =>
        url.includes('/rest/v1/ods?select') ? jsonResponse([rec()], { headers: { 'Content-Range': '0-0/1' } }) : jsonResponse({}));
      await app.window.eval('saveCloudOrder')();

      const calls = app.fetchCalls();
      const patch = calls.find((c) => c.opts.method === 'PATCH');
      assert.ok(patch.url.endsWith('/rest/v1/ods?id=eq.7'), patch.url);
      const body = JSON.parse(patch.opts.body);
      assert.equal(body.comentario, 'Agregué evidencia desde el celular');
      assert.equal(body.numero_ticket, 'C-1');
      assert.deepEqual(
        { i: body.imagenes.inicial.length, m: body.imagenes.mediciones.length, n: body.imagenes.instalacion.length, e: body.imagenes.extras.length },
        { i: 2, m: 1, n: 1, e: 1 });
      assert.equal(body.total_imagenes, 5);
      assert.equal(body.tiene_firma_cliente, true);
      const uploads = calls.filter((c) => c.url.includes('/storage/v1/object/ods-imagenes/')).map((c) => c.url.split('/ods-imagenes/')[1]).sort();
      assert.deepEqual(uploads, ['ods/C-1/extras_1.jpg', 'ods/C-1/firma_cliente.png', 'ods/C-1/firma_ingeniero.png',
        'ods/C-1/inicial_1.jpg', 'ods/C-1/inicial_2.jpg', 'ods/C-1/instalacion_1.jpg', 'ods/C-1/mediciones_1.jpg']);

      // vuelve a la vista Nube y la copia local queda actualizada y marcada como sincronizada
      assert.equal(app.get('appState.view'), 'supabase');
      const local = J(app.get('db.getAllOrders()[0]'));
      assert.equal(local.comentario, 'Agregué evidencia desde el celular');
      assert.equal(local.images.instalacion.length, 1);
      assert.ok(local.cloudSyncedAt);
      assert.equal(local.cloudId, 7);
      assert.ok(app.document.body.textContent.includes('Registro actualizado en la Nube'));
    }));

  it('si la subida falla: los cambios quedan guardados en el dispositivo y se permanece en el formulario', () =>
    withApp(async (app) => {
      downloadOk(app);
      await copy(app);
      app.call('updateField', 'comentario', 'cambio importante');
      app.setFetch(async (url, o) => (o.method === 'PATCH' ? jsonResponse('fallo', { ok: false, status: 500 }) : jsonResponse({})));
      await app.window.eval('saveCloudOrder')();
      assert.equal(app.get('appState.view'), 'form');
      assert.ok(app.document.body.textContent.includes('Error al guardar: fallo'));
      assert.equal(app.get('db.getAllOrders()[0].comentario'), 'cambio importante');
      assert.ok(!app.get('db.getAllOrders()[0].cloudSyncedAt'));
    }));
});
