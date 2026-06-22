# Bluesky Block-Entferner (Bulk Unblocker)

Ein elegantes, schnelles und sicheres Werkzeug zur Massenentfernung von Blocks auf Bluesky (AT-Protokoll). Die App läuft vollständig im Browser, kommuniziert direkt mit deinem PDS (Personal Data Server) und behebt automatisch sogenannte **"Phantom-Blocks"** (verwaiste Block-Einträge im Relay-Index).

---

## 🚀 Hauptmerkmale

*   **Vollständige Massenabwicklung:** Entblocke Hunderte oder Tausende von Accounts mit nur einem Klick.
*   **Intelligente Filter & Zeitfenster:** Filtere deine Blockliste nach Erstellungsdatum (z.B. nur Blocks aus der letzten Woche, dem letzten Monat oder ältere).
*   **Sicherer Worker-Queue:** Arbeitet mit kontrollierter Nebenläufigkeit (Concurrency) und automatischem Rate-Limit-Handling, um PDS-Überlastungen zu vermeiden.
*   **Behebung von Phantom-Blocks:** Erkennt Diskrepanzen zwischen dem Bluesky AppView-Index und der physischen PDS-Datenbank und behebt diese automatisch (siehe [Phantom-Blocks-Erklärung](#-das-phantom-block-problem)).
*   **Umfangreiches Live-Logging:** Detaillierte Fehlerberichte, Erfolgsmeldungen und Echtzeit-Statistiken während der Ausführung.
*   **Steuerungselemente:** Jederzeit pausieren, fortsetzen oder abbrechen.
*   **Modernes Design:** Premium Darkmode-Layout mit flüssigen Animationen und Responsive Webdesign (für Desktop, Tablet und Smartphones).

---

## 🛠️ Technische Funktionsweise: Das "Phantom-Block"-Problem

### Was ist ein Phantom-Block?
Ein Phantom-Block tritt auf, wenn ein Account in der offiziellen Bluesky-App (oder im AppView-Index) als "geblockt" angezeigt wird, der eigentliche Block-Datensatz (`app.bsky.graph.block`) in der Repository-Datenbank deines PDS (Personal Data Server) jedoch nicht (mehr) existiert. 

Dies kann durch asynchrone Replikationsfehler, Rollbacks oder Synchronisationsfehler zwischen Drittanbieter-PDS und dem Bluesky-Hauptrelay entstehen. Ein normaler Unblock-Befehl schlägt dann fehl, da kein Datensatz zum Löschen gefunden wird. Der Block bleibt auf dem Relay permanent aktiv.

### Unsere Lösung (Repository-Alignment)
Der Bluesky Block-Entferner gleicht die Daten automatisch ab:
1.  **Erkennung:** Er ruft die Blockliste über den AppView-Dienst ab (`getBlocks`) und vergleicht jeden Eintrag mit den tatsächlichen Repository-Einträgen auf deinem PDS (`listRecords`).
2.  **Klassifizierung:** Fehlt der PDS-Datensatz, wird der Account als **"Phantom-Block"** markiert.
3.  **Bereinigung:** Die App materialisiert den Block kurzzeitig im PDS (`putRecord`) und löscht ihn direkt im Anschluss wieder (`deleteRecord`). Dies zwingt das Bluesky-Relay dazu, ein neues Firehose-Event zu verarbeiten und den Block endgültig zu entfernen.

---

## 💻 Lokale Ausführung

Das Projekt läuft komplett ohne externe Abhängigkeiten und benötigt keine Installation von Paketen via `npm`.

### Voraussetzungen
*   **Node.js** (empfohlen zur Bereitstellung des Webservers aufgrund von CORS-Restriktionen im Browser bei `file://`-Dateien).

### Starten (Windows)
1.  Doppelklicke auf die Datei `run.bat`.
2.  Es öffnet sich ein Terminal und die App wird automatisch in deinem Standardbrowser unter `http://localhost:3000` geöffnet.

### Starten (Andere Betriebssysteme)
1.  Öffne ein Terminal im Projektverzeichnis.
2.  Führe folgenden Befehl aus:
    ```bash
    node server.js
    ```
3.  Öffne deinen Browser und navigiere zu `http://localhost:3000`.

---

## 🔒 Sicherheitshinweise

*   **App-Passwörter verwenden:** Verwende niemals dein Hauptpasswort! Erstelle stattdessen in den Bluesky-Einstellungen unter *Einstellungen > App-Passwörter* ein temporäres Passwort. Dieses kann jederzeit widerrufen werden.
*   **Direkte Verbindung:** Deine Zugangsdaten und Passwörter werden **niemals** an Dritte übertragen oder auf einem Server gespeichert. Alle Anfragen werden direkt von deinem Browser an die Bluesky-API-Endpunkte gesendet.
*   **Synchronisationsverzögerung:** Falls du eine eigene PDS-Instanz verwendest, kann es je nach Relay-Lag bis zu einer Stunde dauern, bis unblockierte Profile in der offiziellen Bluesky-App (`bsky.app`) korrekt als unblockiert angezeigt werden. Die Löschung erfolgt jedoch sofort auf deinem Server.

---

## 📁 Projektstruktur

```
Bluesky-Unblocker/
├── index.html     # Struktur der Web-App & Benutzeroberfläche
├── style.css      # Design, Layouts und CSS-Animationen
├── app.js         # Logik, AT-Protokoll-Anbindung & Phantom-Block-Finder
├── server.js      # Zero-Dependency Node.js Server
├── run.bat        # Windows Launcher-Skript
└── README.md      # Diese Dokumentation
```

---

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Weitere Informationen findest du in der Lizenzdatei (falls vorhanden) oder nutze den Code frei für deine eigenen Zwecke.
