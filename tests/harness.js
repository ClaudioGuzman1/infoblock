'use strict';
/**
 * Arnés de pruebas: carga index.html (versión ORIGINAL o REFACTORIZADA) en jsdom
 * y expone utilidades para inspeccionar la app sin depender de la red.
 *
 * Variable de entorno APP_DIR: carpeta con el index.html a probar
 *   - tests/original  → código original (un solo index.html con todo inline)
 *   - .               → versión refactorizada (index.html + js/…)
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const { IDBFactory } = require('fake-indexeddb');

const APP_DIR = path.resolve(process.env.APP_DIR || '.');

/** Sirve archivos locales bajo http://localhost/ y anula todo lo externo (CDN). */
class LocalLoader extends ResourceLoader {
  constructor(root) {
    super();
    this.root = root;
    this.requested = [];
  }
  fetch(url) {
    this.requested.push(url);
    const u = new URL(url);
    if (u.origin === 'http://localhost') {
      const file = path.join(this.root, decodeURIComponent(u.pathname));
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        return Promise.resolve(fs.readFileSync(file));
      }
      return Promise.reject(new Error('404 ' + url));
    }
    // CDN (tailwind, jsPDF, fonts…) → respuesta vacía; jsPDF se sustituye por un falso.
    return Promise.resolve(Buffer.from(''));
  }
}

/** jsPDF falso que registra todas las operaciones (API mínima usada por la app). */
function makeFakePdfFactory(log) {
  class FakePdf {
    constructor(...args) {
      this.args = args;
      this.pages = 1;
      this.current = 1;
      this.ops = [];
      this.saved = null;
      this.internal = {
        pageSize: { getWidth: () => 215.9, getHeight: () => 279.4 },
        getNumberOfPages: () => this.pages,
      };
      log.instances.push(this);
    }
    _rec(name, args) { this.ops.push({ name, page: this.current, args }); }
    addPage() { this.pages++; this.current = this.pages; this._rec('addPage', []); return this; }
    setPage(n) { this.current = n; this._rec('setPage', [n]); return this; }
    text(...a) { this._rec('text', a); return this; }
    addImage(...a) { this._rec('addImage', a); return this; }
    rect(...a) { this._rec('rect', a); return this; }
    line(...a) { this._rec('line', a); return this; }
    setFontSize(...a) { this._rec('setFontSize', a); return this; }
    setFont(...a) { this._rec('setFont', a); return this; }
    setTextColor(...a) { this._rec('setTextColor', a); return this; }
    setDrawColor(...a) { this._rec('setDrawColor', a); return this; }
    setFillColor(...a) { this._rec('setFillColor', a); return this; }
    setLineWidth(...a) { this._rec('setLineWidth', a); return this; }
    getTextWidth(t) { return String(t).length * 2; }
    getImageProperties() { return { width: 1600, height: 1200 }; }
    splitTextToSize(t) { return [String(t)]; }
    save(name) { this.saved = name; this._rec('save', [name]); }
    output(kind) { this._rec('output', [kind]); return 'blob:fake-' + kind; }
    // Utilidades para aserciones
    texts() { return this.ops.filter(o => o.name === 'text').map(o => String(o.args[0])); }
    images() { return this.ops.filter(o => o.name === 'addImage'); }
    count(name) { return this.ops.filter(o => o.name === name).length; }
  }
  return FakePdf;
}

/**
 * Carga la app.
 * @param {object} opts
 * @param {object} [opts.storage]  pares clave→valor a sembrar en localStorage antes de arrancar
 * @param {boolean} [opts.confirmAnswer=true] respuesta de window.confirm
 * @param {string} [opts.appDir]   carpeta de la app (por defecto APP_DIR)
 * @param {IDBFactory|null} [opts.indexedDB] IndexedDB falso a usar (compartirlo entre cargas simula recargar la página); null = sin IndexedDB
 */
async function loadApp(opts = {}) {
  const appDir = path.resolve(opts.appDir || APP_DIR);
  const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
  const loader = new LocalLoader(appDir);
  const vc = new VirtualConsole();
  const consoleMsgs = { log: [], warn: [], error: [] };
  vc.on('log', m => consoleMsgs.log.push(String(m)));
  vc.on('warn', m => consoleMsgs.warn.push(String(m)));
  vc.on('error', m => consoleMsgs.error.push(String(m)));
  vc.on('jsdomError', e => consoleMsgs.error.push('jsdomError: ' + (e && e.message)));

  const calls = { alerts: [], confirms: [], opens: [], downloads: [], blobs: [] };
  const pdfLog = { instances: [] };
  const FakePdf = makeFakePdfFactory(pdfLog);
  const state = { confirmAnswer: opts.confirmAnswer !== false };

  const dom = new JSDOM(html, {
    url: 'http://localhost/index.html',
    runScripts: 'dangerously',
    resources: loader,
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      // Diálogos y ventanas
      window.alert = (m) => { calls.alerts.push(String(m)); };
      window.confirm = (m) => { calls.confirms.push(String(m)); return state.confirmAnswer; };
      window.open = (...a) => { calls.opens.push(a); return null; };
      // Blob URLs (jsdom no las implementa)
      window.URL.createObjectURL = (b) => { calls.blobs.push(b); return 'blob:fake-url'; };
      window.URL.revokeObjectURL = () => {};
      // HTMLAnchorElement.click (descargas) → registrar en vez de navegar
      window.HTMLAnchorElement.prototype.click = function () {
        calls.downloads.push({ href: this.href, download: this.download });
      };
      // Canvas simulado (jsdom no trae canvas nativo)
      const ctx = { drawImage() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillRect() {} };
      window.HTMLCanvasElement.prototype.getContext = function () { this.__ctx = ctx; return ctx; };
      window.HTMLCanvasElement.prototype.toDataURL = function (type, q) {
        // base64 válido (la app luego lo decodifica con atob al subirlo a la Nube)
        return 'data:' + (type || 'image/png') + ';base64,' + Buffer.from('CANVAS[' + this.width + 'x' + this.height + ',q=' + q + ']').toString('base64');
      };
      // Image que "carga" al asignar src con dimensiones conocidas
      window.Image = class {
        constructor() { this.width = 1600; this.height = 1200; }
        set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
        get src() { return this._src; }
      };
      // fetch controlable desde los tests
      window.fetch = (...a) => window.__fetchImpl(...a);
      window.__fetchImpl = async () => { throw new Error('fetch no configurado en el test'); };
      window.__fetchCalls = [];
      // Sembrar localStorage
      for (const [k, v] of Object.entries(opts.storage || {})) {
        window.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
      // IndexedDB falso (uno nuevo por carga, salvo que el test pase el suyo)
      const idb = 'indexedDB' in opts ? opts.indexedDB : new IDBFactory();
      if (idb) Object.defineProperty(window, 'indexedDB', { value: idb, configurable: true });
      // jsPDF falso (la app lo espera en window.jspdf.jsPDF)
      window.jspdf = { jsPDF: FakePdf };
    },
  });

  const { window } = dom;
  await new Promise((resolve) => {
    if (window.document.readyState === 'complete') return resolve();
    window.addEventListener('load', () => resolve());
  });
  // Un tick extra para scripts diferidos/temporizadores de arranque
  await tick(20);

  const app = {
    window,
    document: window.document,
    dom,
    calls,
    pdfLog,
    FakePdf,
    consoleMsgs,
    requested: loader.requested,
    setConfirm(v) { state.confirmAnswer = v; },
    /** Evalúa una expresión en el ámbito global de la página (ve const/let/class globales). */
    get(expr) { return window.eval(expr); },
    call(fnName, ...args) { return window.eval(fnName)(...args); },
    /** Configura fetch: handler(url, opts) → { ok, status, json, text, blob, headers } */
    setFetch(handler) {
      window.__fetchCalls.length = 0;
      window.__fetchImpl = async (url, o) => {
        window.__fetchCalls.push({ url: String(url), opts: o || {} });
        const r = await handler(String(url), o || {});
        // Blob del contexto de la página (FileReader de jsdom exige su propio Blob)
        if (r && typeof r === 'object') r.blob = async () => new window.Blob([typeof r._text === 'string' ? r._text : 'IMG'], { type: 'image/jpeg' });
        return r;
      };
    },
    fetchCalls() { return window.__fetchCalls; },
    root() { return window.document.getElementById('root'); },
    text() { return window.document.getElementById('root').textContent.replace(/\s+/g, ' ').trim(); },
    /** Espera a que las imágenes terminen de guardarse en IndexedDB. */
    async flushImages() { await tick(5); await window.eval('db.images.flush()'); },
    lastPdf() { return pdfLog.instances[pdfLog.instances.length - 1]; },
    close() { window.close(); },
  };
  return app;
}

/** Decodifica el contenido simulado que devuelve el canvas falso. */
const canvasText = (dataUrl) => Buffer.from(String(dataUrl).split(',')[1], 'base64').toString();

/** Ejecuta fn con una app recién cargada y la cierra al terminar. */
async function withApp(optsOrFn, maybeFn) {
  const opts = typeof optsOrFn === 'function' ? {} : optsOrFn;
  const fn = typeof optsOrFn === 'function' ? optsOrFn : maybeFn;
  const app = await loadApp(opts);
  try { return await fn(app); } finally { app.close(); }
}

/** Lee el contenido de texto de un Blob usando el FileReader de la página. */
function readBlob(app, blob) {
  return new Promise((resolve, reject) => {
    const r = new app.window.FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(blob);
  });
}

/** Copia "plana" (JSON) para comparar objetos de otro contexto (jsdom) sin problemas de prototipos. */
const J = (x) => JSON.parse(JSON.stringify(x));

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

/** Respuesta fetch simulada */
function jsonResponse(data, { ok = true, status = 200, headers = {} } = {}) {
  return {
    ok, status,
    headers: { get: (k) => headers[k] ?? headers[String(k).toLowerCase()] ?? null },
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    blob: async () => new (require('jsdom').JSDOM)('').window.Blob([JSON.stringify(data)]),
  };
}

/** Orden de ejemplo completa */
function sampleOrder(over = {}) {
  return Object.assign({
    numeroTicket: 'T-1001', fechaAtencion: '2026-09-01', ingeniero: 'Ana Ing',
    cliente: 'ACME', ubicacion: 'Sucursal Centro', direccion: 'Av. 1', contacto: 'Luis',
    cargo: 'Gerente', telefono: '555', correo: 'l@acme.mx', incidencia: 'No enciende',
    tipoServicio: 'Correctivo', fechaCreacion: '2026-08-31', nombreTerminal: 'TPV-01',
    solicitaTerminal: false, modeloTerminal: 'X1', serieRetirada: 'sr1', macRetirada: 'aa:bb',
    fallaRetirada: 'Fuente', serieInstalada: 'si1', macInstalada: 'cc:dd', solucion: 'Se cambió equipo',
    comentario: 'Todo ok',
    images: { inicial: [], mediciones: [], instalacion: [], extras: [] },
    entregas: { materiales: [] }, firmaCliente: null, firmaIngeniero: null,
  }, over);
}

module.exports = { loadApp, withApp, canvasText, readBlob, J, tick, jsonResponse, sampleOrder, APP_DIR };
