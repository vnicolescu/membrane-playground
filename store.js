/* Store: shared state for comments, proposals, locks, decision stances and gatekeeper attempts.
   Uses the artifact db when the viewer grants it; falls back to this browser only (marked "local") otherwise.
   Collections (each doc is small; streams are aggregated per item to respect the 5,000-document cap):
     threads/<itemId>   { itemId, entries: [{kind:"comment"|"proposal", author, text, field?, to?, at, status?}] }
     locks/<itemId>     { itemId, locked: true, by, at, note }          (rules: write needs editor access)
     stances/<decisionId> { decisionId, entries: [{author, stance, note, at}] }
     attempts/<yyyymmdd> { day, entries: [{author, challenge, verdict, broke, summary, at}] }  (capped at 200 per day) */
(function () {
  const listeners = new Map(); // path -> Set(fn)
  const local = {
    key: (p) => "membrane:" + p,
    get(p) { try { return JSON.parse(localStorage.getItem(this.key(p)) || "null"); } catch (e) { return null; } },
    set(p, v) { try { localStorage.setItem(this.key(p), JSON.stringify(v)); } catch (e) {} }
  };
  let db = null;
  let mode = "local"; // "shared" once db resolves

  function emit(path, value) { (listeners.get(path) || []).forEach((fn) => { try { fn(value); } catch (e) { console.error(e); } }); }

  const Store = {
    get mode() { return mode; },
    author() { try { return localStorage.getItem("membrane:author") || ""; } catch (e) { return ""; } },
    setAuthor(name) { try { localStorage.setItem("membrane:author", name); } catch (e) {} },

    /* subscribe(path, fn): fn(doc|null) now and on every change. path like "threads/env.effect" */
    subscribe(path, fn) {
      if (!listeners.has(path)) listeners.set(path, new Set());
      listeners.get(path).add(fn);
      fn(local.get(path));
      if (db) attach(path);
      return () => listeners.get(path).delete(fn);
    },
    /* subscribeAll(collection, fn): fn([docs]) for a whole collection (locks, stances) */
    subscribeAll(collection, fn) {
      const path = "*" + collection;
      if (!listeners.has(path)) listeners.set(path, new Set());
      listeners.get(path).add(fn);
      fn(localAll(collection));
      if (db) attachAll(collection);
      return () => listeners.get(path).delete(fn);
    },
    async appendEntry(path, base, entry, cap = 400) {
      const cur = (db ? await getDoc(path) : local.get(path)) || Object.assign({ entries: [] }, base);
      cur.entries = (cur.entries || []).concat([entry]).slice(-cap);
      return write(path, cur);
    },
    async setDoc(path, value) { return write(path, value); },
    async deleteDoc(path) {
      local.set(path, null); emit(path, null); emitAll(path.split("/")[0]);
      if (db) { try { await db.doc(path).delete(); } catch (e) { return { ok: false, code: e.code || "error" }; } }
      return { ok: true };
    }
  };

  function localAll(collection) {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith("membrane:" + collection + "/")) { const v = JSON.parse(localStorage.getItem(k)); if (v) out.push(v); } } } catch (e) {}
    return out;
  }
  function emitAll(collection) { emit("*" + collection, localAll(collection)); }

  async function getDoc(path) { try { const s = await db.doc(path).get(); return s.exists ? s.data() : null; } catch (e) { return local.get(path); } }
  async function write(path, value) {
    local.set(path, value); emit(path, value); emitAll(path.split("/")[0]);
    if (!db) return { ok: true, mode };
    try { await db.doc(path).set(value); return { ok: true, mode }; }
    catch (e) { return { ok: false, code: e.code || "error", message: e.message }; }
  }
  const attached = new Set();
  function attach(path) {
    if (attached.has(path)) return; attached.add(path);
    try { db.doc(path).onSnapshot((snap) => { const v = snap.exists ? snap.data() : null; local.set(path, v); emit(path, v); }, () => {}); } catch (e) {}
  }
  function attachAll(collection) {
    if (attached.has("*" + collection)) return; attached.add("*" + collection);
    try { db.collection(collection).onSnapshot((qs) => { const docs = []; qs.forEach((d) => { const v = d.data(); docs.push(v); local.set(collection + "/" + d.id, v); }); emit("*" + collection, docs); }, () => {}); } catch (e) {}
  }

  window.Store = Store;
  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("db").then((ns) => {
      if (!ns) return;
      db = ns; mode = "shared";
      listeners.forEach((_, path) => (path.startsWith("*") ? attachAll(path.slice(1)) : attach(path)));
      document.dispatchEvent(new CustomEvent("store:shared"));
    }).catch(() => {});
  }
})();
