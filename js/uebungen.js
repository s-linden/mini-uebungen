// Miniübungen: Skizze (Punkte, Vektoren, Beschriftung) und Aufgaben.
// Neue Übung: weiteren Eintrag nach demselben Muster ergänzen, sie erscheint dann in der Auswahl am Beamer.
//   vektoren: Name → [Startpunkt, Endpunkt]
//   marken:   Name → [x, y] der Beschriftung
//   weg:      Lösung als Weg durch die Skizze, [Vektor, +1 oder -1] (−1 = gegen die Pfeilrichtung)
//   aus:      Vektoren, die in der Aufgabe verwendet werden dürfen
const UEBUNGEN = {
  'vektoren-vieleck': {
    titel: 'Addition und Subtraktion von Vektoren',
    hinweis: 'Bestimmen Sie die Vektoren. Wählen Sie die passenden Summanden durch Antippen nacheinander aus.',
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

  // Übung mit Auswahlaufgaben (art: 'aussagen', Aufgaben mit art: 'wahl'). Texte enthalten Formeln zwischen $…$.
  //   vor, nach: Satzteile vor und hinter der Lücke; luecke: Platzhalter vor der Auflösung
  //   pfeil: true = die Optionen stehen als Pfeilspalte auf dem Startbildschirm
  'logischer-schluss': {
    titel: 'Notwendige und hinreichende Bedingung',
    art: 'aussagen',
    hinweis: '',
    vorspann: String.raw`Seien $a, b \in \mathbb{R}$.`,
    links: '$a+b=0$',
    rechts: '$a=b=0$',
    // Kasten, der bei der Lösung erscheint: gilt die jeweilige Richtung, und warum (nicht)?
    begruendung: [
      { richtung: String.raw`$a=b=0 \Rightarrow a+b=0$`, gilt: true, grund: 'Denn: $0+0=0$' },
      { richtung: String.raw`$a+b=0 \Rightarrow a=b=0$`, gilt: false, grund: String.raw`Gegenbeispiel: $a=1,\ b=-1$ ergibt $a+b=0$` },
    ],
    aufgaben: (() => {
      const bedingung = [
        { wert: 'k', anzeige: 'keine' },
        { wert: 'n', anzeige: 'eine notwendige' },
        { wert: 'h', anzeige: 'eine hinreichende' },
        { wert: 'b', anzeige: 'eine notwendige und hinreichende' },
      ];
      return [
        {
          id: 'i', art: 'wahl', pfeil: true, nummer: 'i)', kopf: 'i) Wählen Sie den richtigen logischen Schluss aus:',
          vor: '$a+b=0$', luecke: '?', nach: '$a=b=0$',
          optionen: [
            { wert: 'l', anzeige: String.raw`$\Leftarrow$` },
            { wert: 'r', anzeige: String.raw`$\Rightarrow$` },
            { wert: 'b', anzeige: String.raw`$\Leftrightarrow$` },
          ],
          richtig: 'l',
        },
        {
          id: 'ii', art: 'wahl', nummer: 'ii)', kopf: 'ii)', vorab: 'Ergänzen Sie die folgenden Sätze:',
          vor: '$a+b=0$ ist', luecke: '…', nach: 'Bedingung für $a=b=0$.',
          optionen: bedingung, richtig: 'n',
        },
        {
          id: 'iii', art: 'wahl', nummer: 'iii)', kopf: 'iii)',
          vor: '$a=b=0$ ist', luecke: '…', nach: 'Bedingung für $a+b=0$.',
          optionen: bedingung, richtig: 'h',
        },
      ];
    })(),
  },

  // Übung mit Vektorpaaren im R² (art: 'paare'): Die Studierenden geben je Teilaufgabe zwei Vektoren ein.
  //   test: welche Eigenschaft geprüft wird (siehe Pruefung.kategorie); beispiel: wird bei der Lösung gezeigt
  //   beobachtung: bei der Lösung zeigen, wie viele richtige Paare auch eine andere Teilaufgabe erfüllen
  'vektorpaare': {
    titel: 'Orthogonal, parallel, linear (un)abhängig',
    art: 'paare',
    hinweis: '',
    vorspann: String.raw`Geben Sie zwei Vektoren $\vec{a}, \vec{b} \in \mathbb{R}^2$ mit $\vec{a}, \vec{b} \neq \vec{0}$ an, die`,
    // „parallel“ wie im Skript: a = s·b mit s > 0
    aufgaben: [
      { id: 'i', art: 'paar', nummer: 'i)', eigenschaft: 'orthogonal sind', test: 'orthogonal', beispiel: [[1, 2], [-2, 1]], beobachtung: 'iv' },
      { id: 'ii', art: 'paar', nummer: 'ii)', eigenschaft: 'parallel sind', test: 'parallel', beispiel: [[1, 2], [2, 4]], beobachtung: 'iii' },
      { id: 'iii', art: 'paar', nummer: 'iii)', eigenschaft: 'linear abhängig sind', test: 'abhaengig', beispiel: [[1, 2], [-1, -2]], beobachtung: 'ii' },
      { id: 'iv', art: 'paar', nummer: 'iv)', eigenschaft: 'linear unabhängig sind', test: 'unabhaengig', beispiel: [[1, 2], [3, 1]] },
    ],
  },
};
