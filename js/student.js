// Handy-Ansicht: Antworten eingeben, absenden, nach Freigabe Rückmeldung zeigen.
(async () => {
  const $ = (id) => document.getElementById(id);
  const code = new URLSearchParams(location.search).get('s');
  const MAX_TERME = 8;
  let runde = null;
  let uebung = null;
  let gesendet = null;       // zuletzt abgeschickte Antworten
  let bearbeiten = false;
  const eingaben = {};       // Aufgabe → Terme in Eingabereihenfolge bzw. gewählte Option
  const anzeigen = {};       // Aufgabe → Funktion, die die Eingabe neu zeichnet

  function show(view) {
    for (const v of ['loading', 'message', 'form', 'ergebnis']) $('view-' + v).hidden = v !== view;
    $('skizze-box').hidden = view !== 'form' && view !== 'ergebnis';
    // Nur die Skizze beim Eingeben bleibt oben festgepinnt.
    $('skizze-box').classList.toggle('frei', view === 'ergebnis' || (uebung && uebung.art === 'aussagen'));
  }

  function message(title, text) {
    $('msg-title').textContent = title;
    $('msg-text').textContent = text;
    show('message');
  }

  // Antwort einer Aufgabe in der gespeicherten Kurzform; '' = noch nichts eingegeben
  function kurzform(a) {
    if (a.art === 'wahl') return eingaben[a.id];
    if (a.art === 'paar') {
      const z = eingaben[a.id].map(Pruefung.zahl);
      return z.every((x) => x !== null) ? Pruefung.paarKurz([[z[0], z[1]], [z[2], z[3]]]) : '';
    }
    return Pruefung.normal(eingaben[a.id]);
  }

  function aktualisiereKnopf() {
    $('btn-submit').disabled = !uebung.aufgaben.some(kurzform);
  }

  function taste(aufgabe, s, v) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'taste';
    b.setAttribute('aria-label', `${s > 0 ? '' : 'Minus '}Vektor ${v}`);
    Pruefung.setze(b, Pruefung.texTerme([{ s, v }]));
    b.onclick = () => {
      if (eingaben[aufgabe.id].length < MAX_TERME) eingaben[aufgabe.id].push({ s, v });
      anzeigen[aufgabe.id]();
    };
    return b;
  }

  // „Aufgabe 1: g aus a und b“, durchgehend fett
  function frageFett(a) {
    const s = document.createElement('strong');
    const vektor = (v) => Pruefung.setze(document.createElement('span'), String.raw`\boldsymbol{\vec{${v}}}`);
    s.append(`Aufgabe ${a.id}: `, vektor(a.ziel), ' aus ');
    a.aus.forEach((v, i) => {
      if (i) s.append(i === a.aus.length - 1 ? ' und ' : ', ');
      s.append(vektor(v));
    });
    return s;
  }

  function kopfElement(a) {
    const kopf = document.createElement('div');
    kopf.className = 'aufgabe-kopf';
    return kopf;
  }

  function vektorKarte(a, karte) {
    const kopf = kopfElement(a);
    kopf.appendChild(frageFett(a));

    const zeile = document.createElement('div');
    zeile.className = 'gleichung';
    zeile.appendChild(Pruefung.setze(document.createElement('span'), Pruefung.texZiel(a) + '='));
    const terme = document.createElement('span');
    terme.className = 'terme';
    zeile.appendChild(terme);
    const zurueck = document.createElement('button');
    zurueck.type = 'button';
    zurueck.className = 'zurueck';
    zurueck.textContent = '⌫';
    zurueck.setAttribute('aria-label', 'Letzten Term löschen');
    zurueck.onclick = () => { eingaben[a.id].pop(); anzeigen[a.id](); };
    zeile.appendChild(zurueck);

    const tasten = document.createElement('div');
    tasten.className = 'tasten';
    for (const v of a.aus) {
      tasten.appendChild(taste(a, 1, v));
      tasten.appendChild(taste(a, -1, v));
    }

    anzeigen[a.id] = () => {
      const t = eingaben[a.id];
      zurueck.disabled = !t.length;
      if (t.length) Pruefung.setze(terme, Pruefung.texTerme(t));
      else terme.innerHTML = '<span class="muted">noch keine Eingabe</span>';
      aktualisiereKnopf();
    };
    karte.append(kopf, zeile, tasten);
  }

  function wahlKarte(a, karte) {
    const kopf = kopfElement(a);
    const titel = document.createElement('strong');
    titel.textContent = a.kopf;
    kopf.appendChild(titel);

    const zeile = document.createElement('div');
    zeile.className = 'satz';
    const luecke = document.createElement('span');
    luecke.className = 'luecke';
    zeile.append(Pruefung.mix(document.createElement('span'), a.vor), ' ', luecke, ' ', Pruefung.mix(document.createElement('span'), a.nach));

    const optionen = document.createElement('div');
    optionen.className = 'optionen' + (a.optionen.some((o) => !o.anzeige.startsWith('$')) ? ' text' : '');
    const knoepfe = a.optionen.map((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'option';
      Pruefung.mix(b, o.anzeige);
      b.onclick = () => {
        eingaben[a.id] = eingaben[a.id] === o.wert ? '' : o.wert; // erneutes Antippen hebt die Wahl auf
        anzeigen[a.id]();
      };
      optionen.appendChild(b);
      return b;
    });

    anzeigen[a.id] = () => {
      const wert = eingaben[a.id];
      a.optionen.forEach((o, i) => {
        knoepfe[i].classList.toggle('gewaehlt', o.wert === wert);
        knoepfe[i].setAttribute('aria-pressed', o.wert === wert);
      });
      Pruefung.mix(luecke, wert ? Pruefung.anzeige(a, wert) : a.luecke);
      luecke.classList.toggle('gefuellt', !!wert);
      aktualisiereKnopf();
    };
    karte.append(kopf, zeile, optionen);
  }

  // Zwei Vektoren als Spalten mit je zwei Eingabefeldern, daneben die Pfeile als Vorschau
  function paarKarte(a, karte) {
    const kopf = kopfElement(a);
    kopf.appendChild(Object.assign(document.createElement('strong'), { textContent: `${a.nummer} … ${a.eigenschaft}` }));

    const zeile = document.createElement('div');
    zeile.className = 'paar-eingabe';
    const felder = [];
    let aktiv = null; // zuletzt angetipptes Feld, für den Vorzeichen-Knopf
    for (const [v, start] of [['a', 0], ['b', 2]]) {
      const name = Pruefung.setze(document.createElement('span'), String.raw`\vec{${v}}=`);
      name.className = 'vek-name vek-' + v;
      const spalte = document.createElement('span');
      spalte.className = 'vek-spalte';
      for (let k = 0; k < 2; k++) {
        const feld = document.createElement('input');
        feld.type = 'text';
        feld.inputMode = 'decimal';
        feld.autocomplete = 'off';
        feld.setAttribute('aria-label', `Vektor ${v}, ${k + 1}. Komponente`);
        feld.oninput = () => { eingaben[a.id][start + k] = feld.value; anzeigen[a.id](); };
        feld.onfocus = () => { aktiv = feld; vorzeichen.disabled = false; };
        felder[start + k] = feld;
        spalte.appendChild(feld);
      }
      zeile.append(name, spalte);
    }
    const vorschau = document.createElement('span');
    vorschau.className = 'paar-vorschau';
    zeile.appendChild(vorschau);

    // Die Zifferntastatur des iPhones hat kein Minus: Vorzeichen per Knopf umkehren, ohne die Tastatur zu schließen.
    const vorzeichen = document.createElement('button');
    vorzeichen.type = 'button';
    vorzeichen.className = 'vorzeichen';
    vorzeichen.textContent = '± Vorzeichen';
    vorzeichen.disabled = true;
    vorzeichen.setAttribute('aria-label', 'Vorzeichen im ausgewählten Feld umkehren');
    vorzeichen.addEventListener('pointerdown', (e) => e.preventDefault()); // Feld behält den Fokus
    vorzeichen.addEventListener('mousedown', (e) => e.preventDefault());
    vorzeichen.onclick = () => {
      if (!aktiv) return;
      const v = aktiv.value.trim();
      aktiv.value = /^[-−]/.test(v) ? v.slice(1) : '-' + v;
      aktiv.dispatchEvent(new Event('input'));
      aktiv.focus();
    };

    const hinweis = document.createElement('div');
    hinweis.className = 'paar-hinweis';

    anzeigen[a.id] = () => {
      const werte = eingaben[a.id];
      werte.forEach((w, i) => {
        if (felder[i].value !== w) felder[i].value = w;
        felder[i].classList.toggle('ungueltig', !unfertig(w) && Pruefung.zahl(w) === null);
      });
      const kurz = kurzform(a);
      vorschau.replaceChildren(Paare.bild(kurz ? Pruefung.paar(kurz) : null));
      hinweis.textContent = werte.some((w) => !unfertig(w) && Pruefung.zahl(w) === null)
        ? 'Bitte nur Zahlen eingeben, z. B. 2, -1 oder 0,5.' : '';
      aktualisiereKnopf();
    };
    karte.append(kopf, zeile, vorzeichen, hinweis);
  }

  // Leeres Feld oder nur ein Minus: noch in Arbeit, kein Fehler
  const unfertig = (w) => ['', '-', '−'].includes(w.trim());

  function baueFormular() {
    const box = $('aufgaben');
    box.replaceChildren();
    for (const a of uebung.aufgaben) eingaben[a.id] = a.art === 'wahl' ? '' : a.art === 'paar' ? ['', '', '', ''] : [];
    for (const a of uebung.aufgaben) {
      if (a.vorab) {
        const p = document.createElement('p');
        p.className = 'vorab';
        p.textContent = a.vorab;
        box.appendChild(p);
      }
      const karte = document.createElement('div');
      karte.className = 'aufgabe';
      if (a.art === 'wahl') wahlKarte(a, karte);
      else if (a.art === 'paar') paarKarte(a, karte);
      else vektorKarte(a, karte);
      box.appendChild(karte);
      anzeigen[a.id]();
    }
  }

  function setzeEingaben(antworten) {
    for (const a of uebung.aufgaben) {
      if (a.art === 'paar') {
        const p = Pruefung.paar(antworten[a.id]);
        eingaben[a.id] = p ? p.flat().map((x) => String(x).replace('.', ',')) : ['', '', '', ''];
      } else {
        eingaben[a.id] = a.art === 'wahl' ? (antworten[a.id] || '') : Pruefung.terme(antworten[a.id]);
      }
      anzeigen[a.id]();
    }
  }

  function zeigeErgebnis() {
    const offen = runde.status === 'open';
    const freigabe = runde.freigegeben || [];
    $('ergebnis-titel').textContent = gesendet ? (offen ? 'Danke! Ihre Antworten wurden gespeichert.' : 'Ihre Antworten') : 'Die Abgabe ist beendet.';
    $('ergebnis-text').textContent = offen
      ? 'Solange die Abgabe läuft, können Sie Ihre Antworten noch ändern.'
      : freigabe.length < uebung.aufgaben.length ? 'Die Lösungen erscheinen hier, sobald sie am Beamer freigegeben werden.' : '';
    $('btn-edit').hidden = !(offen && gesendet);

    const box = $('ergebnis');
    box.replaceChildren();
    for (const a of uebung.aufgaben) {
      const antwort = gesendet && Pruefung.gueltig(a, gesendet[a.id] || '') ? gesendet[a.id] : null;
      const frei = freigabe.includes(a.id);
      const richtig = !!antwort && Pruefung.richtig(a, antwort);
      const karte = document.createElement('div');
      karte.className = 'aufgabe' + (frei ? (richtig ? ' richtig' : ' falsch') : '');

      const kopf = kopfElement(a);
      const titel = document.createElement('strong');
      titel.textContent = a.nummer || `Aufgabe ${a.id}`;
      kopf.appendChild(titel);
      if (frei) {
        const urteil = document.createElement('span');
        urteil.className = 'urteil';
        urteil.textContent = richtig ? '✓ Richtig' : antwort ? '✗ Nicht richtig' : 'Keine Antwort';
        kopf.appendChild(urteil);
      }

      const zeile = document.createElement('div');
      zeile.className = a.art ? 'satz' : 'gleichung';
      if (antwort) Pruefung.mix(zeile, Pruefung.satz(a, antwort));
      else zeile.innerHTML = '<span class="muted">Keine Antwort abgegeben</span>';
      karte.append(kopf, zeile);

      if (frei && !richtig && antwort && a.art === 'paar') {
        karte.appendChild(Pruefung.mix(Object.assign(document.createElement('div'), { className: 'grund' }),
          ((k) => (k === 'null' ? 'Ihr Paar enthält den Nullvektor.' : `Ihr Paar ist ${Pruefung.kategorieText(a, k)}.`))(Pruefung.kategorie(a, antwort))));
      }
      if (frei && !richtig) {
        const l = document.createElement('div');
        l.className = 'loesung';
        if (a.art === 'paar') {
          Pruefung.mix(l, `Richtig wäre zum Beispiel ${Pruefung.anzeige(a, Pruefung.paarKurz(a.beispiel))}.`);
        } else {
          l.append('Lösung: ');
          l.appendChild(Pruefung.mix(document.createElement('span'), Pruefung.loesungSatz(a)));
        }
        karte.appendChild(l);
      }
      box.appendChild(karte);
    }
    show('ergebnis');
  }

  function render() {
    if (!runde) return message('Übung nicht gefunden', 'Bitte scannen Sie den aktuellen QR-Code erneut.');
    if (!uebung) {
      uebung = UEBUNGEN[runde.uebung];
      if (!uebung) return message('Unbekannte Übung', 'Bitte laden Sie die Seite neu.');
      document.title = uebung.titel;
      $('form-hint').textContent = uebung.hinweis;
      $('form-hint').hidden = !uebung.hinweis;
      Skizze.erstelle($('skizze-box'), uebung, { kompakt: true });
      baueFormular();
      if (gesendet) setzeEingaben(gesendet);
    }
    if (runde.status === 'open' && (bearbeiten || !gesendet)) show('form');
    else zeigeErgebnis();
  }

  $('btn-submit').onclick = async () => {
    const antworten = {};
    for (const a of uebung.aufgaben) {
      const kurz = kurzform(a);
      if (kurz) antworten[a.id] = kurz;
    }
    $('btn-submit').disabled = true;
    $('btn-submit').textContent = 'Wird gespeichert …';
    $('submit-error').hidden = true;
    try {
      await Backend.abgeben(code, antworten);
      gesendet = antworten;
      bearbeiten = false;
      render();
      window.scrollTo(0, 0);
    } catch (e) {
      if (runde && runde.status !== 'open') {
        render();
      } else {
        // Eingaben bleiben erhalten; die Ursache wird angezeigt, damit man sie melden kann.
        $('submit-error').textContent = `Speichern hat nicht geklappt. Bitte noch einmal versuchen. (Fehler: ${e.code || 'unbekannt'} – ${e.message})`;
        $('submit-error').hidden = false;
      }
    }
    $('btn-submit').textContent = 'Antworten absenden';
    aktualisiereKnopf();
  };
  $('btn-edit').onclick = () => {
    bearbeiten = true;
    setzeEingaben(gesendet);
    render();
    window.scrollTo(0, 0);
  };

  if (!code) return message('Kein Code', 'Bitte scannen Sie den QR-Code am Beamer.');
  try {
    await Backend.init();
    gesendet = await Backend.getMeineAbgabe(code);
  } catch (e) {
    return message('Keine Verbindung', 'Bitte prüfen Sie Ihre Internetverbindung und laden Sie die Seite neu.');
  }
  Backend.watchRunde(code, (r) => { runde = r; render(); });
})();
