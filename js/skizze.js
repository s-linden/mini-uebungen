// Zeichnet die Skizze einer Miniübung als SVG und spielt den Lösungsweg ab.
const Skizze = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const KOPF = 15;
  const SPITZE_ABSTAND = 6; // Pfeilspitzen enden kurz vor dem Eckpunkt
  const SCHRIFT = 28;
  const SCHRITT_MS = 900;
  // Maße der Formelschrift (KaTeX_Math kursiv) in em: Höhe, Breite; Versatz des Akzents nach rechts
  const HOCH = 'bdfhklt';
  const BREITE = { a: 0.529, b: 0.429, c: 0.433, d: 0.52, e: 0.465, f: 0.49, g: 0.477, h: 0.576 };
  const VERSATZ = { a: 0.028, c: 0.056, d: 0.167, e: 0.056, f: 0.167, g: 0.028 };
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));

  function neu(name, attribute, eltern) {
    const el = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attribute)) el.setAttribute(k, v);
    if (eltern) eltern.appendChild(el);
    return el;
  }

  function pfeil(eltern, [x1, y1], [x2, y2], klasse) {
    const laenge = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / laenge;
    const uy = (y2 - y1) / laenge;
    const sx = x2 - ux * SPITZE_ABSTAND;
    const sy = y2 - uy * SPITZE_ABSTAND;
    const bx = sx - ux * KOPF;
    const by = sy - uy * KOPF;
    const g = neu('g', { class: klasse }, eltern);
    const linie = neu('line', { class: 'linie', x1, y1, x2: bx, y2: by }, g);
    const kopf = neu('polygon', {
      class: 'kopf',
      points: `${sx},${sy} ${bx - uy * 5.5},${by + ux * 5.5} ${bx + uy * 5.5},${by - ux * 5.5}`,
    }, g);
    return { g, linie, kopf, laenge: laenge - KOPF - SPITZE_ABSTAND };
  }

  // Buchstabe mit Vektorpfeil darüber; Höhe und seitlicher Versatz richten sich nach dem Buchstaben.
  function marke(eltern, name, [x, y]) {
    const g = neu('g', { class: 'marke' }, eltern);
    neu('text', { x, y }, g).textContent = name;
    const hoehe = HOCH.includes(name) ? 0.694 : 0.431;
    const my = y - hoehe * SCHRIFT - 8;
    const mx = x + (VERSATZ[name] || 0) * SCHRIFT;
    neu('line', { class: 'marke-pfeil', x1: mx - 8, y1: my, x2: mx + 5, y2: my }, g);
    neu('polygon', { class: 'marke-kopf', points: `${mx + 9},${my} ${mx + 3},${my - 3} ${mx + 3},${my + 3}` }, g);
    return g;
  }

  function erstelle(box, uebung, optionen) {
    if (uebung.art === 'aussagen') return Aussagen.erstelle(box, uebung, optionen);
    if (uebung.art === 'paare') return Paare.erstelle(box, uebung, optionen);
    const svg = neu('svg', {
      class: 'skizze',
      viewBox: uebung.viewBox,
      role: 'img',
      'aria-label': 'Skizze mit den Vektoren ' + Object.keys(uebung.vektoren).join(', '),
    });
    box.replaceChildren(svg);
    const ende = (v) => uebung.vektoren[v].map((p) => uebung.punkte[p]);
    const elemente = {};
    for (const v of Object.keys(uebung.vektoren)) {
      elemente[v] = { pfeil: pfeil(svg, ...ende(v), 'vektor'), marke: marke(svg, v, uebung.marken[v]) };
    }
    for (const [cx, cy] of Object.values(uebung.punkte)) neu('circle', { class: 'punkt', cx, cy, r: 3.5 }, svg);
    const ueber = neu('g', {}, svg);
    let lauf = 0; // verhindert, dass eine alte Animation weiterläuft

    function zuruecksetzen() {
      lauf++;
      ueber.replaceChildren();
      svg.classList.remove('hervorheben');
      for (const { pfeil: p, marke: m } of Object.values(elemente)) {
        p.g.classList.remove('im-weg', 'ziel');
        m.classList.remove('im-weg', 'ziel');
      }
    }

    function schritt([v, s], animiert) {
      const [a, b] = ende(v);
      const p = pfeil(ueber, s > 0 ? a : b, s > 0 ? b : a, 'weg');
      elemente[v].pfeil.g.classList.add('im-weg');
      elemente[v].marke.classList.add('im-weg');
      if (s < 0) {
        const [x, y] = uebung.marken[v];
        neu('text', { class: 'minus', x: x - ((BREITE[v] || 0.5) * SCHRIFT) / 2 - 11, y }, ueber).textContent = '−';
      }
      if (!animiert) return;
      p.kopf.animate([{ opacity: 0 }, { opacity: 0, offset: 0.85 }, { opacity: 1 }], { duration: SCHRITT_MS - 150 });
      p.linie.style.strokeDasharray = p.laenge;
      p.linie.animate([{ strokeDashoffset: p.laenge }, { strokeDashoffset: 0 }], { duration: SCHRITT_MS - 150 });
    }

    // Zielvektor grün markieren, dann den Weg Pfeil für Pfeil durchlaufen.
    async function zeigeWeg(aufgabe, animieren) {
      zuruecksetzen();
      const dieserLauf = lauf;
      const ohneBewegung = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animiert = animieren && !ohneBewegung;
      svg.classList.add('hervorheben');
      elemente[aufgabe.ziel].pfeil.g.classList.add('ziel');
      elemente[aufgabe.ziel].marke.classList.add('ziel');
      if (animiert) await warte(500);
      for (const s of aufgabe.weg) {
        if (dieserLauf !== lauf) return;
        schritt(s, animiert);
        if (animiert) await warte(SCHRITT_MS);
      }
    }

    return { zuruecksetzen, zeigeWeg };
  }

  return { erstelle };
})();
