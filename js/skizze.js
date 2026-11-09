// Zeichnet die Skizze einer Miniübung als SVG und spielt den Lösungsweg ab.
const Skizze = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const KOPF = 15;
  const SCHRITT_MS = 900;
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
    const bx = x2 - ux * KOPF;
    const by = y2 - uy * KOPF;
    const g = neu('g', { class: klasse }, eltern);
    const linie = neu('line', { class: 'linie', x1, y1, x2: bx, y2: by }, g);
    const kopf = neu('polygon', {
      class: 'kopf',
      points: `${x2},${y2} ${bx - uy * 6},${by + ux * 6} ${bx + uy * 6},${by - ux * 6}`,
    }, g);
    return { g, linie, kopf, laenge: laenge - KOPF };
  }

  // Buchstabe mit kleinem Vektorpfeil darüber
  function marke(eltern, name, [x, y]) {
    const g = neu('g', { class: 'marke' }, eltern);
    neu('text', { x, y }, g).textContent = name;
    neu('line', { class: 'marke-pfeil', x1: x - 7, y1: y - 21, x2: x + 6, y2: y - 21 }, g);
    neu('polygon', { class: 'marke-kopf', points: `${x + 9},${y - 21} ${x + 3},${y - 24} ${x + 3},${y - 18}` }, g);
    return g;
  }

  function erstelle(box, uebung) {
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
        neu('text', { class: 'minus', x: x - 15, y }, ueber).textContent = '−';
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
