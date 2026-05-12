/* MonBureauCAPTURE — Persistance IndexedDB
 * Permet de retrouver une session après fermeture du navigateur.
 * Stocke uniquement métadonnées + screenshots (les segments WebM
 * peuvent être trop lourds pour IDB sur certains profils).
 */
const Storage = (() => {
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('IndexedDB indisponible')); return; }
      const req = indexedDB.open(CONFIG.IDB_NAME, CONFIG.IDB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(CONFIG.IDB_STORE)) {
          const store = db.createObjectStore(CONFIG.IDB_STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(mode = 'readonly') {
    return open().then(db => db.transaction(CONFIG.IDB_STORE, mode).objectStore(CONFIG.IDB_STORE));
  }

  async function save(session) {
    if (!session) return;
    // Strip blobs avant stockage (les segments peuvent être très lourds)
    const lite = {
      id: session.id,
      title: session.title,
      mode: session.mode,
      createdAt: session.createdAt,
      updatedAt: new Date().toISOString(),
      duration: session.duration,
      file: session.file,
      screenshots: session.screenshots,
      markers: session.markers,
      notes: session.notes,
      tags: session.tags || [],
      segmentMeta: (session.segments || []).map(s => ({
        index: s.index, size: s.size, duration: s.duration, filename: s.filename,
      })),
    };
    try {
      const store = await tx('readwrite');
      return new Promise((resolve, reject) => {
        const r = store.put(lite);
        r.onsuccess = () => resolve(true);
        r.onerror = () => reject(r.error);
      });
    } catch (e) { console.warn('Storage.save failed', e); return false; }
  }

  async function list() {
    try {
      const store = await tx();
      return new Promise((resolve) => {
        const items = [];
        const req = store.openCursor();
        req.onsuccess = e => {
          const cursor = e.target.result;
          if (cursor) { items.push(cursor.value); cursor.continue(); }
          else { items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')); resolve(items); }
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) { return []; }
  }

  async function load(id) {
    try {
      const store = await tx();
      return new Promise((resolve) => {
        const r = store.get(id);
        r.onsuccess = () => resolve(r.result || null);
        r.onerror = () => resolve(null);
      });
    } catch (e) { return null; }
  }

  async function remove(id) {
    try {
      const store = await tx('readwrite');
      return new Promise(resolve => {
        const r = store.delete(id);
        r.onsuccess = () => resolve(true);
        r.onerror = () => resolve(false);
      });
    } catch (e) { return false; }
  }

  async function clear() {
    try {
      const store = await tx('readwrite');
      return new Promise(resolve => {
        const r = store.clear();
        r.onsuccess = () => resolve(true);
        r.onerror = () => resolve(false);
      });
    } catch (e) { return false; }
  }

  return { open, save, list, load, remove, clear };
})();
