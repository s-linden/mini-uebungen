// Antworten vergleichen und auszählen.
// Eine Antwort wird als sortierte Kurzform gespeichert, z. B. "+b-c" oder "+2a".
// Damit zählen −c + b und b − c als dieselbe Antwort. "0" = alle Terme heben sich auf.
const Pruefung = (() => {
  const vek = (v) => String.raw`\vec{${v}}`;
  const liste = (aus) => aus.slice(0, -1).map(vek).join(',\\ ') + String.raw`\text{ und }` + vek(aus[aus.length - 1]);
  const ausWeg = (a) => a.weg.map(([v, s]) => ({ s, v }));

  // terme: [{ s: +1 oder -1, v: 'a' }, …]; '' = keine Eingabe
  function normal(terme) {
    if (!terme.length) return '';
    const summe = {};
    for (const { s, v } of terme) summe[v] = (summe[v] || 0) + s;
    const teile = Object.keys(summe).sort().filter((v) => summe[v] !== 0).map((v) => {
      const c = Math.abs(summe[v]);
      return (summe[v] > 0 ? '+' : '-') + (c > 1 ? c : '') + v;
    });
    return teile.length ? teile.join('') : '0';
  }

  function zerlege(kurz) {
    return [...kurz.matchAll(/([+-])(\d*)([a-z])/g)].map((m) => ({
      s: m[1] === '+' ? 1 : -1,
      c: Number(m[2] || 1),
      v: m[3],
    }));
  }

  // Umkehrung von normal(), für das Vorbelegen beim Ändern einer Antwort
  function terme(kurz) {
    if (!kurz || kurz === '0') return [];
    return zerlege(kurz).flatMap(({ s, c, v }) => Array(Math.min(c, 8)).fill({ s, v }));
  }

  // ---------- Vektorpaare im R² ----------
  // Kurzform "a1,a2;b1,b2"; Zahlen mit höchstens 3 Nachkommastellen, damit exakt gerechnet werden kann.
  const ZAHL = /^-?\d{1,4}(?:\.\d{1,3})?$/;
  const SKALA = 1000;

  function paar(kurz) {
    const m = /^([^,;]+),([^,;]+);([^,;]+),([^,;]+)$/.exec(kurz || '');
    if (!m || !m.slice(1).every((z) => ZAHL.test(z))) return null;
    const [a1, a2, b1, b2] = m.slice(1).map(Number);
    return [[a1, a2], [b1, b2]];
  }

  // Eingabe ("1,5" oder "-2") → Zahl oder null
  function zahl(text) {
    const t = String(text).trim().replace(',', '.').replace('−', '-');
    return ZAHL.test(t) ? Number(t) : null;
  }

  const paarKurz = ([[a1, a2], [b1, b2]]) => `${a1},${a2};${b1},${b2}`;

  // Kategorie eines Paares für die Aufgabe: 'ok' oder der Grund, warum nicht
  function kategorie(aufgabe, kurz) {
    const p = paar(kurz);
    const [[a1, a2], [b1, b2]] = p.map((v) => v.map((x) => Math.round(x * SKALA)));
    if ((a1 === 0 && a2 === 0) || (b1 === 0 && b2 === 0)) return 'null';
    const skalar = a1 * b1 + a2 * b2;
    const det = a1 * b2 - a2 * b1;
    switch (aufgabe.test) {
      case 'orthogonal': return skalar === 0 ? 'ok' : 'nicht-orthogonal';
      case 'parallel': return det !== 0 ? 'unabhaengig' : skalar > 0 ? 'ok' : 'entgegengesetzt';
      case 'antiparallel': return det !== 0 ? 'unabhaengig' : skalar < 0 ? 'ok' : 'gleichgerichtet';
      case 'abhaengig': return det === 0 ? 'ok' : 'unabhaengig';
      case 'unabhaengig': return det !== 0 ? 'ok' : 'abhaengig';
    }
  }

  const KATEGORIEN = {
    'null': 'Nullvektor verwendet',
    'nicht-orthogonal': 'nicht orthogonal',
    'entgegengesetzt': String.raw`antiparallel ($s<0$)`,
    'gleichgerichtet': String.raw`parallel ($s>0$)`,
    'unabhaengig': 'linear unabhängig',
    'abhaengig': 'linear abhängig',
  };
  const RICHTIG = { orthogonal: 'orthogonal', parallel: 'parallel', antiparallel: 'antiparallel', abhaengig: 'linear abhängig', unabhaengig: 'linear unabhängig' };
  const kategorieText = (a, key) => (key === 'ok' ? RICHTIG[a.test] : KATEGORIEN[key]);
  const zahlTex = (x) => String(x).replace('.', '{,}');
  const paarTex = (p) => {
    const [[a1, a2], [b1, b2]] = p;
    return String.raw`\vec{a}=(${zahlTex(a1)},\,${zahlTex(a2)}),\ \vec{b}=(${zahlTex(b1)},\,${zahlTex(b2)})`;
  };

  // Daten kommen von fremden Geräten: nur Antworten aus den erlaubten Vektoren zählen.
  function gueltig(aufgabe, kurz) {
    if (aufgabe.art === 'wahl') return aufgabe.optionen.some((o) => o.wert === kurz);
    if (aufgabe.art === 'paar') return !!paar(kurz);
    if (kurz === '0') return true;
    return /^(?:[+-]\d{0,2}[a-z])+$/.test(kurz) && zerlege(kurz).every(({ v }) => aufgabe.aus.includes(v));
  }

  function texTerme(terme) {
    return terme.map(({ s, v }, i) => (s < 0 ? '-' : i ? '+' : '') + vek(v)).join('');
  }

  function texKurz(kurz) {
    if (kurz === '0') return String.raw`\vec{0}`;
    return zerlege(kurz).map(({ s, c, v }, i) => (s < 0 ? '-' : i ? '+' : '') + (c > 1 ? c : '') + vek(v)).join('');
  }

  const texZiel = (a) => vek(a.ziel);
  const texFrage = (a) => vek(a.ziel) + String.raw`\text{ aus }` + liste(a.aus);
  const texLoesung = (a) => `${vek(a.ziel)}=${texTerme(ausWeg(a))}`;
  const loesung = (a) => (a.art === 'wahl' ? a.richtig : normal(ausWeg(a)));

  // Anzeigen für alle Aufgabenarten, als Text mit Formeln zwischen $…$
  const option = (a, kurz) => a.optionen.find((o) => o.wert === kurz).anzeige;
  function anzeige(a, kurz) {
    if (a.art === 'wahl') return option(a, kurz);
    if (a.art === 'paar') return `$${paarTex(paar(kurz))}$`;
    return `$${texKurz(kurz)}$`;
  }
  function frage(a) {
    if (a.art === 'wahl') return `${a.vor} ${a.luecke} ${a.nach}`;
    if (a.art === 'paar') return String.raw`$\vec{a},\vec{b}\neq\vec{0}$, die ${a.eigenschaft}`;
    return `$${texFrage(a)}$`;
  }
  function satz(a, kurz) {
    if (a.art === 'wahl') return `${a.vor} ${option(a, kurz)} ${a.nach}`;
    if (a.art === 'paar') return anzeige(a, kurz);
    return `$${texZiel(a)}=${texKurz(kurz)}$`;
  }
  function loesungSatz(a) {
    if (a.art === 'wahl') return satz(a, a.richtig);
    if (a.art === 'paar') return `Zum Beispiel $${paarTex(a.beispiel)}$`;
    return `$${texLoesung(a)}$`;
  }
  const richtig = (a, kurz) => (a.art === 'paar' ? kategorie(a, kurz) === 'ok' : kurz === loesung(a));

  // Ergebnis je Aufgabe: Antworten nach Häufigkeit, die richtige Antwort ist markiert.
  // Bei Vektorpaaren zusätzlich nach Kategorie (richtig bzw. Grund für falsch).
  function auszaehlen(uebung, abgaben) {
    return uebung.aufgaben.map((a) => {
      const zahl = {};
      const kategorien = {};
      let keine = 0;
      for (const abgabe of abgaben) {
        const kurz = abgabe[a.id];
        if (typeof kurz === 'string' && gueltig(a, kurz)) {
          zahl[kurz] = (zahl[kurz] || 0) + 1;
          if (a.art === 'paar') {
            const k = kategorie(a, kurz);
            kategorien[k] = (kategorien[k] || 0) + 1;
          }
        } else keine++;
      }
      const antworten = Object.entries(zahl)
        .map(([kurz, n]) => ({ kurz, n, richtig: richtig(a, kurz) }))
        .sort((x, y) => y.n - x.n || x.kurz.localeCompare(y.kurz));
      const anzahlRichtig = antworten.filter((x) => x.richtig).reduce((s, x) => s + x.n, 0);
      return { aufgabe: a, antworten, kategorien, keine, richtig: anzahlRichtig, gesamt: abgaben.length };
    });
  }

  // Wie viele der richtigen Antworten zu Aufgabe a erfüllen auch Aufgabe b? (z. B. i → iv)
  function auchRichtig(uebung, abgaben, a, b) {
    let von = 0;
    let auch = 0;
    for (const abgabe of abgaben) {
      const kurz = abgabe[a.id];
      if (typeof kurz !== 'string' || !paar(kurz) || !richtig(a, kurz)) continue;
      von++;
      if (richtig(b, kurz)) auch++;
    }
    return { von, auch };
  }

  function setze(el, tex) {
    if (window.katex) katex.render(tex, el, { throwOnError: false });
    else el.textContent = tex;
    return el;
  }

  // Text mit Formeln zwischen $…$ in ein Element schreiben
  function mix(el, text) {
    el.replaceChildren();
    let pos = 0;
    for (const m of text.matchAll(/\$([^$]+)\$/g)) {
      el.append(text.slice(pos, m.index), setze(document.createElement('span'), m[1]));
      pos = m.index + m[0].length;
    }
    el.append(text.slice(pos));
    return el;
  }

  return {
    normal, terme, gueltig, texTerme, texZiel, texFrage, loesung, anzeige, frage, satz, loesungSatz, auszaehlen, setze, mix,
    paar, zahl, paarKurz, kategorie, kategorieText, richtig, auchRichtig,
  };
})();
