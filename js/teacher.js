// Beamer-Ansicht: QR-Code, Zähler, Auswertung je Aufgabe, Lösung freigeben.
(async () => {
  const $ = (id) => document.getElementById(id);
  const SESSION_KEY = 'mu-teacher-runde';
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // ohne verwechselbare Zeichen
  const MAX_ZEILEN = 6;

  let code = null;
  let runde = null;
  let abgaben = [];
  let ansicht = 'qr';
  let aktiv = 0;             // Index der angezeigten Aufgabe
  let skizze = null;
  let skizzeFuer = null;     // Übung, für die die Skizze gezeichnet ist
  let unsubscribe = [];

  for (const [id, u] of Object.entries(UEBUNGEN)) $('uebung').add(new Option(u.titel, id));
  $('uebung').hidden = Object.keys(UEBUNGEN).length < 2;

  function show(view) {
    for (const v of ['loading', 'error', 'qr', 'auswertung']) $('view-' + v).hidden = v !== view;
  }

  function fail(text) {
    $('error-text').textContent = text;
    show('error');
  }

  function randomCode() {
    const a = new Uint32Array(5);
    crypto.getRandomValues(a);
    return Array.from(a, (x) => ALPHABET[x % ALPHABET.length]).join('');
  }

  function uebungUrl() {
    const url = new URL('uebung.html', location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('s', code);
    if (Backend.demo && window.FIREBASE_CONFIG) url.searchParams.set('demo', '');
    return url.toString();
  }

  function renderQr() {
    const url = uebungUrl();
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    $('qr').innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    $('join-url').textContent = url.replace(/^https?:\/\//, '');
    $('join-code').textContent = code;
    $('demo-phone').href = url;
  }

  const uebung = () => UEBUNGEN[runde.uebung];
  const freigegeben = (a) => (runde.freigegeben || []).includes(a.id);

  function antwortZeile(tex, n, gesamt, klasse) {
    const zeile = document.createElement('div');
    zeile.className = 'antwort ' + klasse;
    const term = document.createElement('span');
    term.className = 'antwort-term';
    if (tex.startsWith('text:')) term.textContent = tex.slice(5);
    else Pruefung.setze(term, tex);
    const spur = document.createElement('span');
    spur.className = 'spur';
    const fuellung = document.createElement('span');
    fuellung.className = 'fuellung';
    fuellung.style.width = (gesamt ? (100 * n) / gesamt : 0) + '%';
    spur.appendChild(fuellung);
    const zahl = document.createElement('span');
    zahl.className = 'antwort-zahl';
    zahl.textContent = n;
    zeile.append(term, spur, zahl);
    return zeile;
  }

  function renderNav() {
    $('nav').replaceChildren(...uebung().aufgaben.map((a, i) => {
      const b = document.createElement('button');
      b.textContent = a.id + (freigegeben(a) ? ' ✓' : '');
      b.className = i === aktiv ? 'aktiv' : '';
      b.setAttribute('aria-label', `Aufgabe ${a.id}`);
      b.onclick = () => waehle(i);
      return b;
    }));
  }

  // Vor der Freigabe neutral (nichts verrät die richtige Antwort), danach grün/rot.
  function renderAuswertung() {
    const ergebnis = Pruefung.auszaehlen(uebung(), abgaben)[aktiv];
    const a = ergebnis.aufgabe;
    const frei = freigegeben(a);
    renderNav();
    Pruefung.setze($('frage'), Pruefung.texFrage(a));

    $('zusammenfassung').textContent = frei
      ? `${ergebnis.richtig} von ${ergebnis.gesamt} richtig` + (ergebnis.gesamt ? ` (${Math.round((100 * ergebnis.richtig) / ergebnis.gesamt)} %)` : '')
      : `${ergebnis.gesamt} ${ergebnis.gesamt === 1 ? 'Abgabe' : 'Abgaben'} · Welche Antwort stimmt?`;

    // Nach der Freigabe steht die richtige Antwort immer oben, auch wenn sie niemand gegeben hat.
    let liste = ergebnis.antworten;
    if (frei) {
      const form = Pruefung.loesung(a);
      liste = [{ kurz: form, n: ergebnis.richtig, richtig: true }, ...liste.filter((x) => !x.richtig)];
    }
    const sichtbar = liste.slice(0, MAX_ZEILEN);
    const rest = liste.slice(MAX_ZEILEN).reduce((s, x) => s + x.n, 0);
    const zeilen = sichtbar.map((x) =>
      antwortZeile(Pruefung.texKurz(x.kurz), x.n, ergebnis.gesamt, frei ? (x.richtig ? 'richtig' : 'falsch') : ''));
    if (rest) zeilen.push(antwortZeile('text:Weitere', rest, ergebnis.gesamt, 'neutral'));
    if (ergebnis.keine) zeilen.push(antwortZeile('text:Keine Antwort', ergebnis.keine, ergebnis.gesamt, 'neutral'));
    $('antworten').replaceChildren(...zeilen);

    if (frei) Pruefung.setze($('loesung'), Pruefung.texLoesung(a));
    else $('loesung').replaceChildren();
    $('btn-loesung').textContent = frei ? 'Noch einmal abspielen' : 'Lösung zeigen';

    const offen = runde.status === 'open';
    $('btn-abgabe').textContent = offen ? 'Abgabe beenden' : 'Abgabe wieder öffnen';
    // Sobald eine Lösung sichtbar war, darf nicht mehr nachgebessert werden.
    $('btn-abgabe').hidden = (runde.freigegeben || []).length > 0;
  }

  function zeichneSkizze() {
    if (skizzeFuer === runde.uebung) return;
    skizze = Skizze.erstelle($('skizze-gross'), uebung());
    skizzeFuer = runde.uebung;
    aktualisiereSkizze();
  }

  function aktualisiereSkizze() {
    const a = uebung().aufgaben[aktiv];
    if (freigegeben(a)) skizze.zeigeWeg(a, false);
    else skizze.zuruecksetzen();
  }

  function waehle(i) {
    aktiv = i;
    renderAuswertung();
    aktualisiereSkizze();
  }

  function render() {
    if (!runde) return;
    $('titel').textContent = uebung().titel;
    $('uebung').value = runde.uebung;
    $('btn-toggle').textContent = ansicht === 'qr' ? 'Auswertung' : 'QR-Code';
    if (ansicht === 'auswertung') {
      show('auswertung');
      zeichneSkizze();
      renderAuswertung();
    } else {
      show('qr');
      $('count').textContent = abgaben.length;
      $('count-label').textContent = abgaben.length === 1 ? 'Abgabe' : 'Abgaben';
      $('status-text').textContent = runde.status === 'open' ? 'Abgabe läuft' : 'Abgabe beendet';
    }
  }

  function watch() {
    unsubscribe.forEach((off) => off());
    unsubscribe = [
      Backend.watchRunde(code, (r) => { runde = r; render(); }),
      Backend.watchAbgaben(code, (list) => { abgaben = list; render(); }),
    ];
    renderQr();
  }

  async function neueRunde(id) {
    code = randomCode();
    await Backend.createRunde(code, id);
    localStorage.setItem(SESSION_KEY, code);
    runde = null;
    abgaben = [];
    ansicht = 'qr';
    aktiv = 0;
    skizzeFuer = null;
    watch();
  }

  async function zeigeLoesung() {
    const a = uebung().aufgaben[aktiv];
    if (freigegeben(a)) return skizze.zeigeWeg(a, true);
    if (runde.status === 'open' && !confirm('Lösung zeigen? Damit wird die Abgabe beendet, Antworten lassen sich nicht mehr ändern.')) return;
    await Backend.updateRunde(code, { status: 'closed', freigegeben: [...(runde.freigegeben || []), a.id] });
    skizze.zeigeWeg(a, true);
  }

  // ---------- Bedienung ----------
  const umschalten = () => { ansicht = ansicht === 'qr' ? 'auswertung' : 'qr'; render(); };
  $('btn-toggle').onclick = umschalten;
  $('btn-auswertung').onclick = umschalten;
  $('btn-loesung').onclick = () => zeigeLoesung().catch((e) => fail('Freigabe fehlgeschlagen: ' + e.message));
  $('btn-abgabe').onclick = () =>
    Backend.updateRunde(code, { status: runde.status === 'open' ? 'closed' : 'open' }).catch((e) => fail(e.message));
  $('btn-new').onclick = () => {
    if (confirm('Neue Runde starten? Es wird ein neuer QR-Code erzeugt, alle Abgaben beginnen von vorn.')) {
      neueRunde($('uebung').value).catch((e) => fail('Neue Runde fehlgeschlagen: ' + e.message));
    }
  };
  $('uebung').onchange = () => {
    if (confirm('Für die gewählte Übung eine neue Runde starten?')) {
      neueRunde($('uebung').value).catch((e) => fail('Neue Runde fehlgeschlagen: ' + e.message));
    } else if (runde) {
      $('uebung').value = runde.uebung;
    }
  };
  $('btn-fullscreen').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  if (Backend.demo) {
    $('demo-banner').hidden = false;
    $('btn-fake').onclick = () => {
      try { Backend.addFake(code, 5); } catch { alert('Die Abgabe ist beendet.'); }
    };
  }

  // ---------- Start ----------
  try {
    await Backend.init();
  } catch (e) {
    return fail('Verbindung zu Firebase fehlgeschlagen. ' + e.message);
  }
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    const existing = saved && (await Backend.getRunde(saved));
    if (existing && existing.owner === Backend.uid() && UEBUNGEN[existing.uebung]) {
      code = saved;
      watch();
    } else {
      await neueRunde($('uebung').value);
    }
  } catch (e) {
    fail('Runde konnte nicht gestartet werden. ' + e.message);
  }
})();
