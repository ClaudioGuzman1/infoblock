'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withApp } = require('./harness');

const GLOBAL_FUNCTIONS = [
  'showToast', 'compressImage', 'loadOrders', 'createNewOrder', 'editOrder', 'duplicateOrder', 'deleteOrder',
  'saveOrder', 'updateField', 'addImage', 'handleImageUpload', 'handleFileInput',
  'generatePDF_ODS', 'generatePDF_IDT', 'generatePDF_CDE',
  'render', 'renderListView', 'renderFormView', 'renderTabContent', 'renderImageSection', 'renderSupabaseView',
  'initSignature', 'getCanvasCoords', 'startDrawing', 'draw', 'stopDrawing', 'clearSignature', 'saveSignature', 'loadSignatureFromFile',
  'addEquipo', 'updateEquipo', 'removeEquipo', 'exportData', 'importData', 'mergeData',
  'getSupabaseCreds', 'cloudFetch', 'loadCloudOrders', 'deleteCloudOrder', 'openSupabaseView',
  'printCloudPDF_ODS', 'printCloudPDF_IDT', 'printCloudPDF_CDE', 'showCloudDetail', 'editCloudOrder', 'saveCloudOrder',
];

describe('Estructura de la página', () => {
  it('metadatos: idioma, título, viewport, manifest, favicon y contenedor #root', () =>
    withApp(async (app) => {
      const d = app.document;
      assert.equal(d.documentElement.lang, 'es');
      assert.equal(d.title, 'Soy IDC 🔥🔥');
      assert.match(d.querySelector('meta[name=viewport]').content, /width=device-width/);
      assert.equal(d.querySelector('link[rel=manifest]').getAttribute('href'), 'manifest.json');
      assert.equal(d.querySelector('link[rel=icon]').getAttribute('href'), 'favicon.ico');
      assert.ok(d.getElementById('root'));
    }));

  it('mantiene las dependencias externas: Tailwind, MDI, jsPDF y styles.css', () =>
    withApp(async (app) => {
      const urls = app.requested.join('\n');
      for (const s of ['cdn.tailwindcss.com', 'materialdesignicons', 'jspdf', 'styles.css']) {
        assert.ok(urls.includes(s), 'falta recurso: ' + s);
      }
    }));

  it('registra el service worker (sw-register.js) sin romper el arranque', () =>
    withApp(async (app) => {
      assert.ok(app.requested.some((u) => u.endsWith('sw-register.js')));
      assert.deepEqual(app.consoleMsgs.error, []);
    }));

  it('arranca en la vista de lista sin errores de consola', () =>
    withApp(async (app) => {
      assert.equal(app.get('appState.view'), 'list');
      assert.deepEqual(app.consoleMsgs.error, []);
    }));

  it('todas las funciones usadas por los onclick/oninput inline están disponibles globalmente', () =>
    withApp(async (app) => {
      for (const fn of GLOBAL_FUNCTIONS) {
        assert.equal(app.get(`typeof ${fn}`), 'function', `no es global: ${fn}`);
      }
      for (const obj of ['db', 'appState']) assert.equal(app.get(`typeof ${obj}`), 'object', obj);
      for (const cls of ['Database', 'AppState']) assert.equal(app.get(`typeof ${cls}`), 'function', cls);
    }));

  it('cambiar el estado re-renderiza automáticamente (suscripción de arranque)', () =>
    withApp(async (app) => {
      app.get("appState.setState({view:'form', currentOrder: {images:{}, entregas:{materiales:[]}}})");
      assert.ok(app.text().includes('Nueva Visita en Sitio'));
      app.get("appState.setState({view:'list'})");
      assert.ok(app.text().includes('Visitas en Sitio'));
    }));
});
