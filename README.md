# Miniübungen

Kurze Übungen im Hörsaal per QR-Code: Die Studierenden setzen ihre Antworten auf dem Handy zusammen, die Antworten werden am Beamer gemeinsam diskutiert, danach läuft der Lösungsweg durch die Skizze.

1. **Beamer:** `index.html` zeigt einen QR-Code und zählt live die Abgaben.
2. **Handy:** `uebung.html` zeigt die Skizze und die Aufgaben. Die Antwort wird aus den erlaubten Vektoren angetippt (`a`, `−b`, …), Tippen von Formeln ist nicht nötig. Bis zum Ende der Abgabe lässt sich alles ändern. Pro Gerät zählt eine Abgabe.
3. **Auswertung:** Pro Aufgabe erscheinen alle abgegebenen Antworten nach Häufigkeit, zunächst neutral, damit die richtige Antwort nicht verraten wird.
4. **Lösung zeigen:** beendet die Abgabe, färbt die Antworten grün/rot und spielt den Lösungsweg in der Skizze ab. Wird ein Vektor gegen seine Pfeilrichtung durchlaufen, erscheint er mit Minuszeichen. Erst jetzt sehen die Handys bei dieser Aufgabe, ob ihre Antwort stimmt.

Die Reihenfolge der Terme spielt keine Rolle: `−c + b` und `b − c` zählen als dieselbe Antwort.

## Neue Miniübung ergänzen

Alle Übungen stehen in [`js/uebungen.js`](js/uebungen.js), die Auswahl dazu erscheint am Beamer. Es gibt zwei Arten:
- **Vektor-Übung:** Punkte der Skizze, Vektoren (Start- und Endpunkt), Position der Beschriftungen und je Aufgabe der Lösungsweg.
- **Aussagen-Übung** (`art: 'aussagen'`): Auswahlaufgaben mit Optionen, richtiger Antwort und einem Begründungskasten, der bei der Lösung erscheint.
- **Vektorpaar-Übung** (`art: 'paare'`): Je Teilaufgabe werden zwei Vektoren im ℝ² eingegeben (mit Pfeil-Vorschau). Das Tool prüft exakt, ob sie orthogonal, parallel (a = s·b mit s > 0), linear abhängig oder unabhängig sind, und zeigt am Beamer eine Galerie der Paare sowie die Fehlergründe (z. B. „entgegengesetzt“, „Nullvektor“).

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

> Eingerichtet ist das eigene Firebase-Projekt `mini-uebungen`: Firestore in `europe-west3`, anonyme Anmeldung aktiv, `s-linden.github.io` als Domain freigegeben, Gemini und Analytics aus.
> Wer die Regeln in `firestore.rules` ändert, muss sie in der Konsole erneut einfügen und veröffentlichen.

### API-Schlüssel

Der `apiKey` in `js/config.js` ist absichtlich öffentlich, wie bei jeder Firebase-Web-App. GitHub meldet ihn eventuell trotzdem als „Secret“. Diese Warnung kann mit „Won't fix“ geschlossen werden.
Damit er nicht anderswo missbraucht werden kann, ist er in der [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=mini-uebungen) („Browser key (auto created by Firebase)“) eingeschränkt.

- **Websites:** `https://s-linden.github.io/*`, `http://localhost:8767/*`, `https://mini-uebungen.firebaseapp.com/*`
- **Dienste:** die von Firebase voreingestellten Dienste (u. a. Identity Toolkit, Token Service, Cloud Firestore)

Läuft das Tool künftig unter einer anderen Adresse oder einem anderen lokalen Port, muss diese dort unter „Website-Einschränkungen“ ergänzt werden. Bis Änderungen greifen, kann es bis zu 5 Minuten dauern.

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
