// Darstellung für Übungen mit Vektorpaaren im R²: kleine Koordinatenbilder mit den Pfeilen a (blau) und b (orange).
// Gleiche Schnittstelle wie die Skizze (zuruecksetzen, zeigeWeg), dazu galerie() für die Beamer-Auswertung.
const Paare = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const MAX_BILDER = 12;

  function neu(name, attribute, eltern) {
    const el = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attribute)) el.setAttribute(k, v);
    if (eltern) eltern.appendChild(el);
    return el;
  }

  function pfeil(g, x, y, klasse) {
    const laenge = Math.hypot(x, y);
    if (laenge < 1e-9) {
      neu('circle', { class: klasse + ' nullpunkt', cx: 0, cy: 0, r: 4 }, g);
      return;
    }
    const ux = x / laenge;
    const uy = y / laenge;
    const kopf = Math.min(9, laenge * 0.45);
    const bx = x - ux * kopf;
    const by = y - uy * kopf;
    neu('line', { class: klasse, x1: 0, y1: 0, x2: bx, y2: by }, g);
    neu('polygon', { class: klasse + ' kopf', points: `${x},${y} ${bx - uy * 4.5},${by + ux * 4.5} ${bx + uy * 4.5},${by - ux * 4.5}` }, g);
  }

  // Koordinatenbild eines Paares [[a1, a2], [b1, b2]]; Maßstab passt sich der längsten Komponente an.
  function bild(paar, klasse = '') {
    const svg = neu('svg', { class: 'paar-bild ' + klasse, viewBox: '-50 -50 100 100', role: 'img' });
    neu('line', { class: 'achse', x1: -46, y1: 0, x2: 46, y2: 0 }, svg);
    neu('line', { class: 'achse', x1: 0, y1: -46, x2: 0, y2: 46 }, svg);
    if (!paar) return svg;
    const groesste = Math.max(...paar.flat().map(Math.abs), 1e-9);
    const s = 42 / groesste;
    const g = neu('g', {}, svg);
    pfeil(g, paar[0][0] * s, -paar[0][1] * s, 'vek-a');
    pfeil(g, paar[1][0] * s, -paar[1][1] * s, 'vek-b');
    svg.setAttribute('aria-label', `a = (${paar[0].join(', ')}), b = (${paar[1].join(', ')})`);
    return svg;
  }

  function erstelle(box, uebung, { kompakt = false, galerie = false } = {}) {
    const wurzel = document.createElement('div');
    wurzel.className = 'aussagen paare';
    wurzel.appendChild(Pruefung.mix(Object.assign(document.createElement('div'), { className: 'vorspann' }), uebung.vorspann));
    box.replaceChildren(wurzel);
    const leer = { zuruecksetzen() {}, zeigeWeg() {} };
    if (kompakt) return leer;

    if (!galerie) {
      // Startbildschirm: die vier Teilaufgaben untereinander
      const liste = document.createElement('div');
      liste.className = 'paar-liste';
      for (const a of uebung.aufgaben) {
        const z = document.createElement('div');
        z.append(Object.assign(document.createElement('strong'), { textContent: a.nummer + ' ' }), a.eigenschaft);
        liste.appendChild(z);
      }
      wurzel.appendChild(liste);
      return leer;
    }

    // Auswertung: Bilder der abgegebenen Paare zur aktuellen Teilaufgabe, nach der Freigabe grün/rot umrandet
    const titel = document.createElement('div');
    titel.className = 'paar-titel';
    const raster = document.createElement('div');
    raster.className = 'paar-galerie';
    const mehr = document.createElement('div');
    mehr.className = 'paar-mehr muted';
    wurzel.append(titel, raster, mehr);

    function zeigeGalerie(aufgabe, abgaben, frei) {
      titel.replaceChildren(Object.assign(document.createElement('strong'), { textContent: aufgabe.nummer + ' ' }), aufgabe.eigenschaft);
      const paare = abgaben.map((x) => x[aufgabe.id]).filter((k) => typeof k === 'string' && Pruefung.paar(k));
      raster.replaceChildren(...paare.slice(0, MAX_BILDER).map((k) => {
        const klasse = frei ? (Pruefung.richtig(aufgabe, k) ? 'ok' : 'falsch') : '';
        return bild(Pruefung.paar(k), klasse);
      }));
      mehr.textContent = paare.length > MAX_BILDER ? `+ ${paare.length - MAX_BILDER} weitere` : paare.length ? '' : 'Noch keine Paare abgegeben.';
    }

    return { zuruecksetzen() {}, zeigeWeg() {}, galerie: zeigeGalerie };
  }

  return { erstelle, bild };
})();
