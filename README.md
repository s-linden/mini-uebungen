# Miniübungen

Kurze Übungen im Hörsaal per QR-Code: Die Studierenden setzen ihre Antworten auf dem Handy zusammen, die Antworten werden am Beamer gemeinsam diskutiert, danach läuft der Lösungsweg durch die Skizze.

1. **Beamer:** `index.html` zeigt einen QR-Code und zählt live die Abgaben.
2. **Handy:** `uebung.html` zeigt die Skizze und die Aufgaben. Die Antwort wird aus den erlaubten Vektoren angetippt (`+a`, `−b`, …), Tippen von Formeln ist nicht nötig. Bis zum Ende der Abgabe lässt sich alles ändern. Pro Gerät zählt eine Abgabe.
3. **Auswertung:** Pro Aufgabe erscheinen alle abgegebenen Antworten nach Häufigkeit, zunächst neutral, damit die richtige Antwort nicht verraten wird.
4. **Lösung zeigen:** beendet die Abgabe, färbt die Antworten grün/rot und spielt den Lösungsweg in der Skizze ab. Wird ein Vektor gegen seine Pfeilrichtung durchlaufen, erscheint er mit Minuszeichen. Erst jetzt sehen die Handys bei dieser Aufgabe, ob ihre Antwort stimmt.

Die Reihenfolge der Terme spielt keine Rolle: `−c + b` und `b − c` zählen als dieselbe Antwort.

## Neue Miniübung ergänzen

Alle Übungen stehen in [`js/uebungen.js`](js/uebungen.js): Punkte der Skizze, Vektoren (Start- und Endpunkt), Position der Beschriftungen und je Aufgabe der Lösungsweg. Sobald es mehr als eine Übung gibt, erscheint am Beamer eine Auswahl.

## Ausprobieren ohne Einrichtung (Demo-Modus)

Doppelklick auf **`Lokal starten.command`**. Der Browser öffnet die Beamer-Ansicht unter `http://localhost:8767/`.
Solange in `js/config.js` keine Firebase-Daten stehen, läuft alles im Demo-Modus, und zwar nur in diesem einen Browser:
- „Handy-Ansicht in neuem Tab öffnen“ simuliert ein Handy. Jeder neue Tab ist ein weiteres Gerät.
- „+5 Test-Abgaben“ erzeugt zufällige Abgaben mit typischen Fehlern.

## Live-Betrieb mit Firebase

Wie bei den anderen Tools: ein kostenloses Firebase-Projekt (Spark-Tarif) mit
- anonymer Anmeldung (Authentication → Anmeldemethode → Anonym),
- `s-linden.github.io` als autorisierter Domain,
- Firestore in `europe-west3 (Frankfurt)` mit den Regeln aus [`firestore.rules`](firestore.rules),
- den Werten der Web-App in `js/config.js`.

**Datenschutz:** Gespeichert werden nur zufällige Geräte-IDs und die Antworten, keine Namen. Die einzelnen Abgaben kann nur die Lehrperson lesen, die die Runde gestartet hat.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html`, `js/teacher.js` | Beamer-Ansicht mit QR-Code, Auswertung und Lösung |
| `uebung.html`, `js/student.js` | Handy-Ansicht |
| `js/uebungen.js` | Skizzen und Aufgaben |
| `js/pruefung.js` | Antworten vergleichen und auszählen |
| `js/skizze.js` | Skizze zeichnen, Lösungsweg abspielen |
| `js/backend.js` | Live-Abgleich über Firebase bzw. Demo-Modus |
| `js/config.js` | Firebase-Zugangsdaten |
| `firestore.rules` | Zugriffsregeln für die Datenbank |
| `css/style.css` | Gestaltung |
