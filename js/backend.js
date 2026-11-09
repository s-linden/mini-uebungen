// Gemeinsamer Live-Zustand zwischen Beamer und Handys.
// Firebase (Firestore + anonyme Anmeldung) oder, ohne Konfiguration, ein Demo-Modus
// über localStorage, der nur zwischen Tabs desselben Browsers funktioniert.
const Backend = (() => {
  const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const demo = !window.FIREBASE_CONFIG || new URLSearchParams(location.search).has('demo');

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Skript konnte nicht geladen werden: ' + src));
      document.head.appendChild(s);
    });
  }

  // ---------- Firebase ----------
  function firebaseBackend() {
    let db, uid;
    const ref = (code) => db.collection('runden').doc(code);

    return {
      async init() {
        for (const f of ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js']) {
          await loadScript(SDK + f);
        }
        firebase.initializeApp(window.FIREBASE_CONFIG);
        const auth = firebase.auth();
        const existing = await new Promise((res) => {
          const off = auth.onAuthStateChanged((u) => { off(); res(u); });
        });
        uid = (existing || (await auth.signInAnonymously()).user).uid;
        db = firebase.firestore();
      },
      uid: () => uid,
      createRunde(code, uebung) {
        return ref(code).set({
          owner: uid,
          uebung,
          status: 'open',
          freigegeben: [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      },
      async getRunde(code) {
        const snap = await ref(code).get();
        return snap.exists ? snap.data() : null;
      },
      watchRunde(code, cb) {
        return ref(code).onSnapshot((snap) => cb(snap.exists ? snap.data() : null));
      },
      updateRunde(code, patch) {
        return ref(code).update(patch);
      },
      // Nur für die Lehrperson: alle Abgaben als { Aufgabe: Antwort }.
      watchAbgaben(code, cb) {
        return ref(code).collection('abgaben').onSnapshot((snap) => cb(snap.docs.map((d) => d.data().antworten)));
      },
      async getMeineAbgabe(code) {
        const snap = await ref(code).collection('abgaben').doc(uid).get();
        return snap.exists ? snap.data().antworten : null;
      },
      // Jedes Gerät schreibt nur sein eigenes Dokument; erneutes Abgeben überschreibt es.
      async abgeben(code, antworten) {
        try {
          await ref(code).collection('abgaben').doc(uid).set({
            antworten,
            at: firebase.firestore.FieldValue.serverTimestamp(),
          });
        } catch (e) {
          // Code und Originaltext mitgeben, damit die Handy-Ansicht die genaue Ursache zeigen kann.
          const err = new Error(e.message);
          err.code = e.code || 'unbekannt';
          throw err;
        }
      },
    };
  }

  // ---------- Demo ----------
  function demoBackend() {
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel('mu-demo') : null;
    const listeners = new Set();
    const key = (code) => 'mu-demo-' + code;
    const read = (code) => {
      try { return JSON.parse(localStorage.getItem(key(code))); } catch { return null; }
    };
    const notify = (code) => listeners.forEach((fn) => fn(code));
    const write = (code, state) => {
      localStorage.setItem(key(code), JSON.stringify(state));
      channel && channel.postMessage(code);
      notify(code);
    };
    channel && (channel.onmessage = (e) => notify(e.data));
    window.addEventListener('storage', (e) => e.key && e.key.startsWith('mu-demo-') && notify(e.key.slice(8)));

    // Jeder Tab ist ein eigenes „Gerät“.
    let uid = sessionStorage.getItem('mu-demo-uid');
    if (!uid) {
      uid = 'demo-' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('mu-demo-uid', uid);
    }

    function watch(code, cb) {
      const fn = (c) => c === code && cb(read(code));
      listeners.add(fn);
      setTimeout(() => cb(read(code)), 0);
      return () => listeners.delete(fn);
    }

    function speichere(code, id, antworten) {
      const st = read(code);
      if (!st || st.status !== 'open') throw Object.assign(new Error('Abgabe beendet'), { code: 'permission-denied' });
      st.abgaben[id] = antworten;
      write(code, st);
    }

    // Test-Antwort: meist richtig, sonst typische Fehler (Vorzeichen, fehlender Term) oder leer.
    function testAntwort(a) {
      const zufall = Math.random();
      if (zufall < 0.1) return undefined;
      if (a.art === 'wahl') {
        if (zufall < 0.6) return a.richtig;
        return a.optionen[Math.floor(Math.random() * a.optionen.length)].wert;
      }
      const weg = a.weg.map(([v, s]) => ({ v, s }));
      if (zufall < 0.6) return Pruefung.normal(weg);
      const i = Math.floor(Math.random() * weg.length);
      if (zufall < 0.9) weg[i] = { v: weg[i].v, s: -weg[i].s };
      else if (weg.length > 1) weg.splice(i, 1);
      return Pruefung.normal(weg);
    }

    return {
      demo: true,
      async init() {},
      uid: () => uid,
      async createRunde(code, uebung) {
        write(code, { owner: uid, uebung, status: 'open', freigegeben: [], abgaben: {} });
      },
      async getRunde(code) {
        return read(code);
      },
      watchRunde: watch,
      async updateRunde(code, patch) {
        write(code, Object.assign(read(code), patch));
      },
      watchAbgaben: (code, cb) => watch(code, (st) => cb(st ? Object.values(st.abgaben) : [])),
      async getMeineAbgabe(code) {
        const st = read(code);
        return (st && st.abgaben[uid]) || null;
      },
      async abgeben(code, antworten) {
        speichere(code, uid, antworten);
      },
      addFake(code, k) {
        const uebung = UEBUNGEN[read(code).uebung];
        for (let i = 0; i < k; i++) {
          const antworten = {};
          for (const a of uebung.aufgaben) {
            const kurz = testAntwort(a);
            if (kurz) antworten[a.id] = kurz;
          }
          speichere(code, 'fake-' + Math.random().toString(36).slice(2, 10), antworten);
        }
      },
    };
  }

  return demo ? demoBackend() : firebaseBackend();
})();
