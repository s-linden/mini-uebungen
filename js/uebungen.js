// Miniübungen: Skizze (Punkte, Vektoren, Beschriftung) und Aufgaben.
// Neue Übung: weiteren Eintrag nach demselben Muster ergänzen, sie erscheint dann in der Auswahl am Beamer.
//   vektoren: Name → [Startpunkt, Endpunkt]
//   marken:   Name → [x, y] der Beschriftung
//   weg:      Lösung als Weg durch die Skizze, [Vektor, +1 oder -1] (−1 = gegen die Pfeilrichtung)
//   aus:      Vektoren, die in der Aufgabe verwendet werden dürfen
const UEBUNGEN = {
  'vektoren-vieleck': {
    titel: 'Addition und Subtraktion von Vektoren',
    viewBox: '25 8 610 345',
    // Nur die Abhängigkeiten zwischen den Vektoren zählen; die Punkte sind so gewählt,
    // dass die Pfeile an jedem Eckpunkt weit auseinanderlaufen.
    punkte: {
      O: [320, 30],   // oben
      R: [590, 110],  // rechts oben
      U: [560, 330],  // unten rechts
      L: [130, 330],  // unten links
      W: [50, 100],   // links
    },
    vektoren: {
      a: ['O', 'L'],
      b: ['L', 'R'],
      c: ['L', 'U'],
      d: ['L', 'W'],
      e: ['U', 'W'],
      f: ['U', 'R'],
      g: ['O', 'R'],
      h: ['O', 'W'],
    },
    marken: {
      a: [231, 137],
      b: [374, 199],
      c: [345, 321],
      d: [108, 218],
      e: [312, 205],
      f: [594, 232],
      g: [447, 103],
      h: [193, 105],
    },
    aufgaben: [
      { id: '1', ziel: 'g', aus: ['a', 'b'], weg: [['a', 1], ['b', 1]] },
      { id: '2', ziel: 'f', aus: ['b', 'c'], weg: [['c', -1], ['b', 1]] },
      { id: '3', ziel: 'e', aus: ['c', 'd'], weg: [['c', -1], ['d', 1]] },
      { id: '4', ziel: 'e', aus: ['f', 'g', 'h'], weg: [['f', 1], ['g', -1], ['h', 1]] },
    ],
  },
};
