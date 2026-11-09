#!/bin/bash
# Startet das Tool lokal im Browser (Doppelklick im Finder). Zum Beenden das Terminal-Fenster schließen.
cd "$(dirname "$0")"
PORT=8767
(sleep 1; open "http://localhost:$PORT/") &
echo "Miniübung läuft unter http://localhost:$PORT/ – zum Beenden dieses Fenster schließen."
python3 -m http.server "$PORT" --bind 127.0.0.1
