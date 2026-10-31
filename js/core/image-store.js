// ============================================================
// ALMACÉN DE IMÁGENES persistente (IndexedDB) + Map con escritura en espejo
// Si IndexedDB no está disponible, la app funciona igual que antes (solo memoria).
// ============================================================

const IMAGE_DB_NAME = 'ods_images_db';
const IMAGE_STORE_NAME = 'images';

class ImageStore {
  constructor(factory) {
    this.factory = factory;
    this._open = null;
  }
  open() {
    if (!this.factory) return Promise.resolve(null);
    if (!this._open) {
      this._open = new Promise((resolve) => {
        try {
          const req = this.factory.open(IMAGE_DB_NAME, 1);
          req.onupgradeneeded = () => req.result.createObjectStore(IMAGE_STORE_NAME);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
          req.onblocked = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }
    return this._open;
  }
  async _write(fn) {
    const idb = await this.open();
    if (!idb) return false;
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(IMAGE_STORE_NAME, 'readwrite');
        fn(tx.objectStore(IMAGE_STORE_NAME));
        tx.oncomplete = () => resolve(true);
        tx.onerror = tx.onabort = () => resolve(false); // p. ej. almacenamiento lleno
      } catch (e) { resolve(false); }
    });
  }
  async getAll() {
    const idb = await this.open();
    if (!idb) return [];
    return new Promise((resolve) => {
      const out = [];
      try {
        const req = idb.transaction(IMAGE_STORE_NAME, 'readonly').objectStore(IMAGE_STORE_NAME).openCursor();
        req.onsuccess = () => {
          const cur = req.result;
          if (cur) { out.push([cur.key, cur.value]); cur.continue(); } else resolve(out);
        };
        req.onerror = () => resolve(out);
      } catch (e) { resolve(out); }
    });
  }
  put(id, data) { return this._write((s) => s.put(data, id)); }
  delete(id)    { return this._write((s) => s.delete(id)); }
  clear()       { return this._write((s) => s.clear()); }
}

/** Map normal (lectura síncrona) que además replica set/delete/clear en el ImageStore. */
class PersistentImageMap extends Map {
  attach(store) {
    this._store = store;
    this._pending = new Set();
    this.failures = 0;
  }
  _track(promise) {
    const t = promise.then((ok) => {
      if (!ok) this.failures++;
      this._pending.delete(t);
    });
    this._pending.add(t);
  }
  set(key, value) {
    super.set(key, value);
    if (this._store) this._track(this._store.put(key, value));
    return this;
  }
  delete(key) {
    const existed = super.delete(key);
    if (this._store) this._track(this._store.delete(key));
    return existed;
  }
  clear() {
    super.clear();
    if (this._store) this._track(this._store.clear());
  }
  /** Espera a que terminen todas las escrituras pendientes. */
  async flush() {
    while (this._pending && this._pending.size) await Promise.all([...this._pending]);
  }
}
