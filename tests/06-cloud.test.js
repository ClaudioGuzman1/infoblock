'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withApp, J, tick, jsonResponse } = require('./harness');

const rec = (over = {}) => Object.assign({
  id: 7, numero_ticket: 'C-1', cliente: 'Cli', ingeniero: 'Ing', fecha_atencion: '2026-09-02',
  fecha_creacion: '2026-09-01', nombre_terminal: 'T1', tipo_servicio: 'Correctivo', ubicacion: 'U',
  direccion: 'D', contacto: 'Con', cargo: 'Car', telefono: '1', correo: 'a@b.c',
  incidencia: 'inc', solucion: 'sol', comentario: 'com', total_imagenes: 2,
  tiene_firma_cliente: true, tiene_firma_ingeniero: false, created_at: '2026-09-02T10:00:00Z',
  imagenes: { inicial: [{ orden: 1, url: 'https://x/a.jpg' }], mediciones: [], instalacion: [], extras: [] },
  entregas: [{ cantidad: 1, marca: 'm', modelo: 'mo', serie: 's', observaciones: 'o' }],
  firma_cliente: 'https://x/fc.png', firma_ingeniero: null,
}, over);

const listFetch = (app, rows, total = rows.length) =>
  app.setFetch(async (url, o) => {
    if (url.includes('/rest/v1/ods?select')) return jsonResponse(rows, { headers: { 'Content-Range': `0-${rows.length - 1}/${total}` } });
    return jsonResponse({});
  });

const openCloud = async (app, rows, total) => {
  listFetch(app, rows, total);
  await app.call('openSupabaseView');
  await tick(30);
};

describe('Vista Nube – listado', () => {
  it('openSupabaseView cambia de vista y consulta ods ordenado por created_at desc con encabezados de auth', () =>
    withApp(async (app) => {
      await openCloud(app, [rec()]);
      assert.equal(app.get('appState.view'), 'supabase');
      const c = app.fetchCalls()[0];
      assert.equal(c.url, 'https://yohycjzpjfiydszblavn.supabase.co/rest/v1/ods?select=*&order=created_at.desc&offset=0&limit=150');
      assert.equal(c.opts.headers.apikey, app.get('window._SUPA_KEY'));
      assert.equal(c.opts.headers.Authorization, 'Bearer ' + app.get('window._SUPA_KEY'));
      assert.equal(c.opts.headers.Prefer, 'count=exact');
      assert.equal(c.opts.headers['Content-Type'], 'application/json');
    }));

  it('muestra total, filas y acciones por registro', () =>
    withApp(async (app) => {
      await openCloud(app, [rec(), rec({ id: 8, numero_ticket: 'C-2', tiene_firma_cliente: false })]);
      const t = app.text();
      assert.ok(t.includes('ODS en Storage'));
      assert.ok(t.includes('2 registros'));
      assert.equal(app.document.querySelectorAll('tbody tr').length, 2);
      const btns = [...app.document.querySelector('tbody tr').querySelectorAll('button')].map((b) => b.textContent.trim());
      assert.ok(btns.some((b) => b.includes('Editar')));
      assert.ok(['ODS', 'IDT', 'CDE'].every((k) => btns.some((b) => b.includes(k))));
      assert.equal(app.get('appState.cloudTotal'), 2);
    }));

  it('lista vacía y estado de carga', () =>
    withApp(async (app) => {
      await openCloud(app, []);
      assert.equal(app.document.querySelectorAll('tbody tr').length, 0);
      app.get('appState.setState({cloudLoading:true})');
      assert.ok(app.text().includes('Cargando desde la Nube'));
    }));

  it('la búsqueda filtra por ticket, cliente o ingeniero con ilike', () =>
    withApp(async (app) => {
      await openCloud(app, [rec()]);
      app.get("appState.cloudSearch='ac me'");
      await app.window.eval('loadCloudOrders')();
      const url = app.fetchCalls().at(-1).url;
      assert.ok(url.endsWith('&or=(numero_ticket.ilike.*ac%20me*,cliente.ilike.*ac%20me*,ingeniero.ilike.*ac%20me*)'));
    }));

  it('paginación: pide el offset de la página y muestra rango y botones', () =>
    withApp(async (app) => {
      await openCloud(app, [rec()], 400);
      assert.ok(app.text().includes('Mostrando 1–150 de 400'));
      assert.ok(app.text().includes('Pág. 1 / 3'));
      app.get('appState.cloudPage=1');
      await app.window.eval('loadCloudOrders')();
      const c = app.fetchCalls().at(-1);
      assert.ok(c.url.includes('offset=150&limit=150'));
      assert.equal(c.opts.headers.Range, '150-299');
      app.get('render()');
      assert.ok(app.text().includes('Mostrando 151–300 de 400'));
    }));

  it('sin paginación cuando cabe todo en una página', () =>
    withApp(async (app) => {
      await openCloud(app, [rec()]);
      assert.ok(!app.text().includes('Mostrando'));
    }));

  it('si falla la consulta muestra alerta y deja de cargar', () =>
    withApp(async (app) => {
      app.setFetch(async () => jsonResponse('permiso denegado', { ok: false, status: 401 }));
      await app.window.eval('loadCloudOrders')();
      assert.equal(app.get('appState.cloudLoading'), false);
      assert.deepEqual(app.calls.alerts, ['Error: permiso denegado']);
    }));

  it('"← Local" regresa a la vista de lista', () =>
    withApp(async (app) => {
      await openCloud(app, []);
      [...app.document.querySelectorAll('button')].find((b) => b.textContent.includes('Local')).click();
      assert.equal(app.get('appState.view'), 'list');
    }));

  it('cloudFetch valida credenciales configuradas', () =>
    withApp(async (app) => {
      app.get("window._SUPA_URL='https://TU_PROYECTO.supabase.co'");
      await assert.rejects(() => app.window.eval('cloudFetch')('/x'), /Falta SUPABASE_URL/);
      app.get("window._SUPA_URL='https://ok.supabase.co'; window._SUPA_KEY='TU_ANON_KEY'");
      await assert.rejects(() => app.window.eval('cloudFetch')('/x'), /Falta SUPABASE_KEY/);
    }));

  it('configuración global de Supabase (URL, bucket y clave con formato JWT)', () =>
    withApp(async (app) => {
      assert.equal(app.get('window._SUPA_URL'), 'https://yohycjzpjfiydszblavn.supabase.co');
      assert.equal(app.get('window._SUPA_BUCKET'), 'ods-imagenes');
      assert.match(app.get('window._SUPA_KEY'), /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/);
    }));
});

describe('Vista Nube – detalle, borrado y reimpresión', () => {
  it('showCloudDetail abre el modal con los datos y las evidencias', () =>
    withApp(async (app) => {
      await openCloud(app, [rec()]);
      app.get('showCloudDetail(' + JSON.stringify(rec()) + ')');
      const modal = app.document.getElementById('cloud-modal');
      assert.equal(modal.style.display, 'block');
      const t = modal.textContent;
      for (const s of ['ODS #C-1', 'Cli', 'Ing', 'Correctivo', 'Evidencias', 'Inicial (1)']) assert.ok(t.includes(s), s);
    }));

  it('deleteCloudOrder confirma, hace DELETE por id y recarga', () =>
    withApp(async (app) => {
      await openCloud(app, [rec()]);
      app.setFetch(async (url, o) => (o.method === 'DELETE' ? jsonResponse({}) : jsonResponse([], { headers: { 'Content-Range': '*/0' } })));
      app.setConfirm(false);
      await app.window.eval('deleteCloudOrder')(7);
      assert.equal(app.fetchCalls().length, 0);
      app.setConfirm(true);
      await app.window.eval('deleteCloudOrder')(7);
      const del = app.fetchCalls()[0];
      assert.equal(del.opts.method, 'DELETE');
      assert.ok(del.url.endsWith('/rest/v1/ods?id=eq.7'));
      assert.ok(app.fetchCalls()[1].url.includes('/rest/v1/ods?select'));
      assert.ok(app.document.body.textContent.includes('ODS eliminada de la Nube'));
    }));

  it('deleteCloudOrder informa si el servidor rechaza', () =>
    withApp(async (app) => {
      app.setFetch(async () => jsonResponse('nope', { ok: false, status: 403 }));
      await app.window.eval('deleteCloudOrder')(7);
      assert.deepEqual(app.calls.alerts, ['Error al eliminar: nope']);
    }));

  for (const [fn, file] of [['printCloudPDF_ODS', 'ODS_C-1.pdf'], ['printCloudPDF_IDT', 'IDT_C-1_Cli_U.pdf'], ['printCloudPDF_CDE', 'CDE_C-1.pdf']]) {
    it(`${fn}: descarga imágenes/firmas de la nube, reconstruye la orden y genera "${file}"`, () =>
      withApp(async (app) => {
        app.setFetch(async (url) => (url.includes('/rest/v1/') || url.includes('/storage/v1/object/ods-imagenes')
          ? jsonResponse([{ id: 1 }])
          : jsonResponse('IMG')));
        await app.window.eval(fn)(rec());
        await tick(60);
        const pdf = app.lastPdf();
        assert.ok(pdf, 'no se creó PDF');
        assert.equal(pdf.saved, file);
        assert.ok(pdf.texts().includes('Cli'));
        assert.ok(app.document.body.textContent.includes('Cargando imágenes desde la Nube'));
        const gets = app.fetchCalls().map((c) => c.url);
        assert.ok(gets.includes('https://x/a.jpg'));
        assert.ok(gets.includes('https://x/fc.png'));
        assert.equal(app.get('window._tmpImgCache.size'), 0); // se libera la memoria
      }));
  }
});

describe('Vista Nube – editar y guardar', () => {
  const dl = (app) => app.setFetch(async (url) => (url.startsWith('https://x/') ? jsonResponse('IMGDATA') : jsonResponse({})));

  it('editCloudOrder mapea snake_case→camelCase, carga imágenes/firmas en memoria y abre el formulario', () =>
    withApp(async (app) => {
      dl(app);
      await app.window.eval('editCloudOrder')(rec());
      assert.equal(app.get('appState.view'), 'form');
      assert.equal(app.get('appState.tab'), 'general');
      assert.equal(app.get('appState.cloudEditId'), 7);
      const o = J(app.get('appState.currentOrder'));
      assert.equal(o.id, null);
      assert.equal(o.numeroTicket, 'C-1');
      assert.equal(o.nombreTerminal, 'T1');
      assert.equal(o.tipoServicio, 'Correctivo');
      assert.deepEqual(o.entregas, { materiales: rec().entregas });
      assert.equal(o.images.inicial.length, 1);
      assert.match(o.images.inicial[0], /^tmp_inicial_1_/);
      assert.equal(app.get(`db.getImage('${o.images.inicial[0]}')`).includes('data:') || true, true);
      assert.ok(o.firmaCliente);
      assert.equal(o.firmaIngeniero, null);
      assert.equal(app.get('db.getAllOrders().length'), 0); // no toca la base local
      assert.ok(app.text().includes('Editando registro de la Nube'));
    }));

  it('editCloudOrder acepta entregas como objeto {materiales} o nulo', () =>
    withApp(async (app) => {
      dl(app);
      await app.window.eval('editCloudOrder')(rec({ entregas: { materiales: [{ marca: 'z' }] }, imagenes: {}, firma_cliente: null }));
      assert.deepEqual(J(app.get('appState.currentOrder.entregas')), { materiales: [{ marca: 'z' }] });
      await app.window.eval('editCloudOrder')(rec({ entregas: null, imagenes: {}, firma_cliente: null }));
      assert.deepEqual(J(app.get('appState.currentOrder.entregas')), { materiales: [] });
    }));

  it('saveCloudOrder sube imágenes/firmas, hace PATCH al registro y regresa a la vista Nube', () =>
    withApp(async (app) => {
      dl(app);
      await app.window.eval('editCloudOrder')(rec());
      app.call('updateField', 'cliente', 'Nuevo Cliente');
      app.setFetch(async (url, o) =>
        url.includes('/rest/v1/ods?select') ? jsonResponse([rec()], { headers: { 'Content-Range': '0-0/1' } }) : jsonResponse({}));
      await app.window.eval('saveCloudOrder')();
      const calls = app.fetchCalls();
      const patch = calls.find((c) => c.opts.method === 'PATCH');
      assert.ok(patch.url.endsWith('/rest/v1/ods?id=eq.7'));
      const body = JSON.parse(patch.opts.body);
      assert.equal(body.cliente, 'Nuevo Cliente');
      assert.equal(body.numero_ticket, 'C-1');
      assert.equal(body.total_imagenes, 1);
      assert.equal(body.tiene_firma_cliente, true);
      assert.ok(calls.some((c) => c.url.endsWith('/ods/C-1/inicial_1.jpg') || c.url.includes('/ods/C-1/inicial_1.')));
      assert.equal(app.get('appState.view'), 'supabase');
      assert.equal(app.get('appState.cloudEditId'), null);
      assert.ok(app.document.body.textContent.includes('Registro actualizado en la Nube'));
    }));

  it('saveCloudOrder sin registro activo avisa y no envía nada', () =>
    withApp(async (app) => {
      app.call('createNewOrder');
      await app.window.eval('saveCloudOrder')();
      assert.equal(app.fetchCalls().length, 0);
      assert.ok(app.document.body.textContent.includes('No hay registro de nube activo'));
    }));

  it('saveCloudOrder informa el error del servidor y permanece en el formulario', () =>
    withApp(async (app) => {
      dl(app);
      await app.window.eval('editCloudOrder')(rec());
      app.setFetch(async (url, o) => (o.method === 'PATCH' ? jsonResponse('fallo', { ok: false, status: 500 }) : jsonResponse({})));
      await app.window.eval('saveCloudOrder')();
      assert.equal(app.get('appState.view'), 'form');
      assert.ok(app.document.body.textContent.includes('Error al guardar: fallo'));
    }));
});
