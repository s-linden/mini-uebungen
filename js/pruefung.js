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

  // Daten kommen von fremden Geräten: nur Antworten aus den erlaubten Vektoren zählen.
  function gueltig(aufgabe, kurz) {
    if (aufgabe.art === 'wahl') return aufgabe.optionen.some((o) => o.wert === kurz);
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

  // Anzeigen für beide Aufgabenarten, als Text mit Formeln zwischen $…$
  const option = (a, kurz) => a.optionen.find((o) => o.wert === kurz).anzeige;
  const anzeige = (a, kurz) => (a.art === 'wahl' ? option(a, kurz) : `$${texKurz(kurz)}$`);
  const frage = (a) => (a.art === 'wahl' ? `${a.vor} ${a.luecke} ${a.nach}` : `$${texFrage(a)}$`);
  const satz = (a, kurz) => (a.art === 'wahl' ? `${a.vor} ${option(a, kurz)} ${a.nach}` : `$${texZiel(a)}=${texKurz(kurz)}$`);
  const loesungSatz = (a) => (a.art === 'wahl' ? satz(a, a.richtig) : `$${texLoesung(a)}$`);

  // Ergebnis je Aufgabe: Antworten nach Häufigkeit, die richtige Antwort ist markiert.
  function auszaehlen(uebung, abgaben) {
    return uebung.aufgaben.map((a) => {
      const zahl = {};
      let keine = 0;
      for (const abgabe of abgaben) {
        const kurz = abgabe[a.id];
        if (typeof kurz === 'string' && gueltig(a, kurz)) zahl[kurz] = (zahl[kurz] || 0) + 1;
        else keine++;
      }
      const richtigeForm = loesung(a);
      const antworten = Object.entries(zahl)
        .map(([kurz, n]) => ({ kurz, n, richtig: kurz === richtigeForm }))
        .sort((x, y) => y.n - x.n || x.kurz.localeCompare(y.kurz));
      return { aufgabe: a, antworten, keine, richtig: zahl[richtigeForm] || 0, gesamt: abgaben.length };
    });
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

  return { normal, terme, gueltig, texTerme, texZiel, texFrage, loesung, anzeige, frage, satz, loesungSatz, auszaehlen, setze, mix };
})();
