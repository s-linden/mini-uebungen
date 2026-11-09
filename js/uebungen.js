// Miniübungen: Skizze (Punkte, Vektoren, Beschriftung) und Aufgaben.
// Neue Übung: weiteren Eintrag nach demselben Muster ergänzen, sie erscheint dann in der Auswahl am Beamer.
//   vektoren: Name → [Startpunkt, Endpunkt]
//   marken:   Name → [x, y] der Beschriftung
//   weg:      Lösung als Weg durch die Skizze, [Vektor, +1 oder -1] (−1 = gegen die Pfeilrichtung)
//   aus:      Vektoren, die in der Aufgabe verwendet werden dürfen
const UEBUNGEN = {
  'vektoren-vieleck': {
    titel: 'Vektoren im Vieleck',
    viewBox: '200 0 490 296',
    punkte: {
      O: [440, 22],   // oben
      R: [620, 92],   // rechts oben
      U: [660, 258],  // unten rechts
      L: [328, 258],  // unten links
      W: [222, 140],  // links
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
      a: [378, 126],
      b: [490, 154],
      c: [482, 288],
      d: [262, 226],
      e: [527, 216],
      f: [657, 170],
      g: [546, 50],
      h: [305, 80],
    },
    aufgaben: [
      { id: '1', ziel: 'g', aus: ['a', 'b'], weg: [['a', 1], ['b', 1]] },
      { id: '2', ziel: 'f', aus: ['b', 'c'], weg: [['c', -1], ['b', 1]] },
      { id: '3', ziel: 'e', aus: ['c', 'd'], weg: [['c', -1], ['d', 1]] },
      { id: '4', ziel: 'e', aus: ['f', 'g', 'h'], weg: [['f', 1], ['g', -1], ['h', 1]] },
    ],
  },
};
