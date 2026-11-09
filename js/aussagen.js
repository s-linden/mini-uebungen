// Darstellung für Übungen mit Aussagen: „a+b=0  ⇐ ⇒ ⇔  a=b=0“ mit Pfeilspalte.
// Gleiche Schnittstelle wie die Skizze: zuruecksetzen() und zeigeWeg(aufgabe, animieren).
const Aussagen = (() => {
  function neu(klasse, eltern) {
    const el = document.createElement('div');
    el.className = klasse;
    if (eltern) eltern.appendChild(el);
    return el;
  }

  function erstelle(box, uebung, { kompakt = false, frage = false } = {}) {
    const wurzel = neu('aussagen');
    Pruefung.mix(neu('vorspann', wurzel), uebung.vorspann);
    box.replaceChildren(wurzel);
    if (kompakt) return { zuruecksetzen() {}, zeigeWeg() {} };

    const zeile = neu('aussage-zeile', wurzel);
    Pruefung.mix(neu('aussage', zeile), uebung.links);
    const spalte = neu('pfeile', zeile);
    Pruefung.mix(neu('aussage', zeile), uebung.rechts);
    const kasten = neu('kasten', wurzel);
    for (const { richtung, gilt, grund } of uebung.begruendung || []) {
      Pruefung.mix(neu('kasten-richtung', kasten), richtung);
      neu('kasten-urteil ' + (gilt ? 'ja' : 'nein'), kasten).textContent = gilt ? '✓ gilt' : '✗ gilt nicht';
      Pruefung.mix(neu('kasten-grund', kasten), grund);
    }

    const pfeile = {};
    const pfeilAufgabe = uebung.aufgaben.find((a) => a.pfeil);
    for (const o of pfeilAufgabe.optionen) pfeile[o.wert] = Pruefung.mix(neu('pfeil', spalte), o.anzeige);
    if (frage) {
      neu('pfeil-frage', spalte).textContent = '?';
      zeile.classList.add('mit-frage');
    }

    function zuruecksetzen() {
      wurzel.classList.remove('aufgeloest', 'begruendet', 'bewegt');
      for (const p of Object.values(pfeile)) p.classList.remove('richtig');
    }

    function zeigeWeg(aufgabe, animieren) {
      zuruecksetzen();
      void wurzel.offsetWidth; // damit die Animation beim Wiederholen neu startet
      wurzel.classList.toggle('bewegt', !!animieren);
      if (aufgabe.pfeil) {
        wurzel.classList.add('aufgeloest');
        pfeile[aufgabe.richtig].classList.add('richtig');
      }
      wurzel.classList.add('begruendet');
    }

    return { zuruecksetzen, zeigeWeg };
  }

  return { erstelle };
})();
