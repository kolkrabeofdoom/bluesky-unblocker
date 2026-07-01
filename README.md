<div align="center">

<img src="screenshots/logo.jpg" alt="C.T.H.U.L.H.U. Logo" width="160" style="border-radius: 50%;" />
<p>...</p>
<img src="screenshots/CthulhuforBluesky.png" alt="C.T.H.U.L.H.U. Features" width="500" style="border-radius: 50%;" />

# C.T.H.U.L.H.U.

### **C**leanup **T**ool for **H**eavy **U**nblocks, **L**ist **H**andling & **U**ser-**S**ifting

*Eine leistungsstarke, browserbasierte Suite zur Verwaltung von Bluesky-Konten*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.1.0-brightgreen.svg)](https://github.com/kolkrabeofdoom/CTHULHU/releases)
[![Platform](https://img.shields.io/badge/platform-Bluesky%20%2F%20AT%20Protocol-0085ff.svg)](https://bsky.app)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)

</div>

---

> **C.T.H.U.L.H.U.** ist ein selbstgehostetes, auf Privatsphäre ausgerichtetes Web-Tool für Power-User, die die volle Kontrolle über ihre Bluesky-Erfahrung übernehmen möchten. Verwalte Blockierungen, Follower, Feeds, Listen und Interaktionen mit chirurgischer Präzision – ganz ohne deine Zugangsdaten an einen Drittanbieter-Cloud-Dienst zu übergeben.

---

## ✨ Die Module im Überblick

| Modul | Beschreibung |
|---|---|
| 🛡️ **Block-Entferner** | Massen-Entblockung von Benutzern mit Erkennung von Phantom-Einträgen, Whitelist-Schutz & Concurrency-Workern |
| 🚫 **Massen-Blocker** | Blockieren einzelner Benutzer, aller Follower eines Kontos oder aller Liker eines Beitrags mit automatischem Schutz für gegenseitige Abonnements (Mutuals) und Option zur Listenspeicherung |
| 👥 **Follower-Abgleich** | Vergleiche deine Follows/Follower, finde Nicht-Mutuals, filtere Bios nach Keywords, führe Massen-Follows oder -Unfollows durch |
| 🔍 **Überlappungs-Finder** | Finde gemeinsame Follower zwischen 2–3 Bluesky-Konten, filtere nach Bio-Keywords und folge der Schnittmenge im Batch |
| 👻 **Geister-Auditor** | Überprüfe deine Follower-Liste auf Bots, inaktive Konten (inkl. zeitbasierter Inaktivität >90 Tage) und filtere nach Bio-Schlüsselwörtern |
| 💬 **Interaktions-Auditor** | Scanne die Kommentare deiner letzten Beiträge auf Spam-Bots und Krypto-Scammer |
| 🗂️ **Listen-Manager** | Durchsuche, klone, verschmelze deine Bluesky-Kurationslisten und erstelle Starter Packs im Handumdrehen |
| 📺 **Timeline-Filter** | Analysiere deine Home-Timeline auf Heavy-Reposter und Zitat-Post-Spammer, um diese stummzuschalten |
| 📜 **Verlauf & Whitelist** | Intelligente „Beste Freunde“-Whitelist (Notification-Scan) + Backup (Export/Import) + Undo-Log |

---

## 📸 Screenshots

### Hauptoberfläche – Block-Entferner
![Hauptoberfläche](screenshots/main-interface.png)

*Der Block-Entferner-Tab zeigt deine Blockliste als interaktive Karten. Enthält Statistik-Dashboard, Massenauswahl, Whitelist-Schutz und Erkennung von Phantom-Einträgen.*

---

### 👻 Geister-Auditor – Follower-Qualitätsanalyse
![Geister-Auditor](screenshots/ghost-auditor.png)

*Analysiert jeden Follower nach Spam-Bot-Mustern, totaler Inaktivität und der neuen Zombie-Account-Heuristik. Nutze Soft-Block, um sie sauber aus deiner Follower-Liste zu entfernen.*

---

### 📺 Timeline-Filter – Repost- & Zitat-Post-Analyse
![Timeline-Filter](screenshots/timeline-filter.png)

*Lädt deine Home-Timeline, gruppiert Beiträge nach Ersteller und berechnet die Repost-Rate. Heavy-Reposter werden für Massen-Muting vorausgewählt. Filterbar nach "Heavy Reposter ≥50%" oder "Quote-Post Heavy".*

---

### 📜 Verlauf & Whitelist – Intelligente Whitelist + Undo-Protokoll
![Verlauf & Whitelist](screenshots/history-whitelist.png)

*Links: Die intelligente Whitelist schlägt automatisch Gesprächspartner aus deinen letzten Beiträgen vor. Rechts: Der Massen-Aktions-Verlauf protokolliert jede Aktion und ermöglicht ein Ein-Klick-Rollback.*

---

## 🧠 Feature-Deep-Dives & EPK-Prozessdiagramme

### 🛡️ Block-Entferner (Bulk Unblock)

Importiere deine Bluesky-Blockliste und verwalte sie effizient:

- **Phantom-Eintrag-Erkennung**: Identifiziert Blockierungen, die in deinem lokalen AT-Protokoll-Repository existieren, aber nicht mehr in der API angezeigt werden (diese "Phantome" blockieren saubere Abläufe).
- **Whitelist-Schutz**: Markiere Accounts als geschützt. Whiteliste DIDs werden niemals in Massen-Entblockungen einbezogen.
- **Backup & Wiederherstellung (Multi-Format)**: Exportiere deine geladene Blockliste als JSON- oder CSV-Backup. Importiere Backups (JSON, CSV oder TXT mit einem Handle/DID pro Zeile) kontoübergreifend. Fehlende Blocks werden abgeglichen und können im Batch wiederhergestellt werden.
- **Automatische Handle-Auflösung**: Beim Importieren von Handles ohne DIDs werden diese automatisch im Hintergrund aufgelöst.
- **Import-Undo & Pause/Resume**: Der Importvorgang kann jederzeit pausiert und fortgesetzt werden. Nach erfolgreichem Import wird ein Verlaufs-Eintrag angelegt, mit dem sich alle blockierten Profile per Klick wieder entblocken lassen.
- **Concurrency Worker**: 4 parallele Worker mit 100ms Drosselung zur Vermeidung von API-Rate-Limits.
- **Pause & Fortsetzen**: Vorgänge können jederzeit pausiert und fortgesetzt werden.
- **Dry-Run-Modus**: Simuliert Aktionen, ohne Daten auf dem PDS zu ändern.

#### EPK-Prozessdiagramm (Ereignisgesteuerte Prozesskette)

```mermaid
flowchart TD
    E1{{Benutzer eingeloggt}} --> F1(Blockliste vom PDS laden)
    F1 --> E2{{Blockliste erfolgreich geladen}}
    E2 --> F2(Konten auswählen & Optionen konfigurieren)
    F2 --> E3{{Konfiguration & Auswahl abgeschlossen}}
    
    E3 --> F3(Entblockungsvorgang starten)
    F3 --> E4{{Operationen werden in Queue eingereiht}}
    
    E4 --> F4{{"Simulation (Dry-Run) aktiv?"}}
    F4 -- Ja --> F5(Aktion simulieren & im Protokoll anzeigen)
    F4 -- Nein --> F6(AT-Protocol API-Aufruf: deleteRecord)
    
    F5 --> E5{{Vorgang für Account abgeschlossen}}
    F6 --> E5
    
    E5 --> F7(Aktion im Verlauf protokollieren)
    F7 --> E6{{Verlaufseintrag für Undo bereit}}
```

---

### 🚫 Massen-Blocker (Bulk Blocker) [Vampirpflock-Update]

Dieses Modul ermöglicht gezielte Massenblockierungen und schützt gleichzeitig deine engen Kontakte:

- **Einzelblock**: Blockiere einzelne Konten direkt über deren Handle oder DID mit einer automatischen Sicherheitsprüfung.
- **Follower-basiertes Blockieren**: Lade die Follower-Liste eines beliebigen Bluesky-Kontos als Kandidaten zur Massenblockierung.
- **Liker-basiertes Blockieren**: Extrahiere alle Accounts, die einen bestimmten Beitrag (über die Post-URL) gelikt haben, um sie im Batch zu blockieren.
- **Automatischer Schutz für Follower & Mutuals**: Eigene Follower und gegenseitige Abonnements (Mutuals) werden automatisch als **"Geschützt"** markiert (z.B. **"Mutual (Geschützt)"** oder **"Folgt mir (Geschützt)"**). Ihre Checkboxen sind gesperrt, sie werden von Massenauswahlen ("Alle markieren") ausgeschlossen und die Queue überspringt sie bei der Ausführung automatisch.
- **Listen-Export**: Verpacke geladene Kandidaten direkt in eine neue oder bestehende Kurationsliste, um sie später zu verwalten.
- **Undo-Integration**: Jede Massenblockierung wird im Aktionsverlauf registriert und kann mit einem Klick rückgängig gemacht werden.

#### EPK-Prozessdiagramm (Ereignisgesteuerte Prozesskette)

```mermaid
flowchart TD
    E1{{Kandidatenliste geladen}} --> F1(Aktion starten & Filter anwenden)
    F1 --> F2(Follower & Mutuals automatisch ausschließen & schützen)
    F2 --> E2{{Blockier-Queue vorbereitet}}
    E2 --> F3(Queue-Worker abarbeiten)
    F3 --> F4{{"Kandidat ist Follower/Mutual?"}}
    F4 -- Ja --> F5(Überspringen & loggen)
    F4 -- Nein --> F6(Blockierung ausführen - createRecord)
    F5 --> E3{{Kandidat verarbeitet}}
    F6 --> E3
    E3 --> F7(Aktion im Verlauf für Undo protokollieren)
    F7 --> E4{{Blockier-Vorgang abgeschlossen}}
```

---

### 👥 Follower-Abgleich (Follower Comparison)

Vergleiche, wem du folgst, mit denen, die dir folgen:

- Lädt bis zu 3.000+ Follows/Follower über paginierte APIs.
- Visuelle Badges: **Mutual** (Gegenseitig), **Folge ich**, **Folgt mir**, **Keine**.
- Filter-Tabs: Alle, Nicht-Mutuals, Nicht-Follower, Mutuals.
- Massen-Follow/Unfollow über die Concurrency-Queue.
- Enthält den **Follower-Kopierer**: Kopiere die Follower eines beliebigen anderen Accounts auf dein eigenes Profil.

---

### 🔍 Nischen- & Überlappungs-Finder (Niche Overlap Finder)

Entdecke gemeinsame Communities zwischen verschiedenen Accounts:

- Gib 2 oder 3 Bluesky-Handles ein, um sie zu vergleichen.
- Lädt bis zu 1.500 Follower pro Ziel-Account.
- Berechnet die mathematische **Schnittmenge** der Follower-DIDs.
- Zeigt die Beziehungs-Badges zu dir (mutual, folge ich, blockiert) an.
- Nutze Massen-Folgen für die Schnittmenge, um dein Netzwerk gezielt zu erweitern.

---

### 👻 Geister-Auditor (Ghost & Bot Auditor)

Dreistufige Analyse der Follower-Qualität:

| Badge | Kriterien |
|---|---|
| ⚠️ **Bot?** | 0 Beiträge + kein Profilbild/Bio, ODER Folgt-Anzahl > 500 mit einem Verhältnis von > 5× zu eigenen Followern |
| 🧟 **Zombie?** | Hat Beiträge, aber Folgt-Anzahl > 500, Follower < 30, Verhältnis > 8× — ehemals inaktiv, nun Massen-Folgen |
| 💤 **Inaktiv** | 0 Beiträge insgesamt |
| 💤 **Inaktiv (>90 Tage)** | Letzter Beitrag liegt mehr als 90 Tage zurück (erfordert Aktivierung der zeitbasierten Inaktivitäts-Prüfung) |

- **Bio- & Keyword-Suche**: Nutze die integrierte Suchleiste im Auditor-Verzeichnis, um Bios, Handles und Namen gezielt nach Begriffen wie „Crypto“, „Telegram“ oder Spam-Mustern zu filtern.
- **Soft-Block**: Entfernt Geister-Accounts sauber aus deiner Follower-Liste. Es wird ein Block-Eintrag erstellt und sofort wieder gelöscht. Dies zwingt das Bluesky-System zu einem gegenseitigen Entfolgen, ohne dass eine permanente Blockierung bestehen bleibt.

#### EPK-Prozessdiagramm (Ereignisgesteuerte Prozesskette)

```mermaid
flowchart TD
    E1{{Benutzer eingeloggt}} --> F1(Follower-Liste abrufen)
    F1 --> E2{{Follower-Daten geladen}}
    E2 --> F2(Qualitäts-Heuristiken anwenden)
    F2 --> E3{{Follower klassifiziert: Bot, Zombie, Inaktiv}}
    
    E3 --> F3(Konten für Bereinigung auswählen)
    F3 --> E4{{Zielkonten markiert}}
    
    E4 --> F4(Soft-Block ausführen)
    F4 --> F5(Schritt 1: Block erstellen - createRecord)
    F5 --> F6(Schritt 2: Block sofort löschen - deleteRecord)
    
    F6 --> E5{{Gegenseitiges Entfolgen erzwungen}}
    E5 --> F7(Aktion im Massen-Aktions-Verlauf speichern)
    F7 --> E6{{Follower-Liste erfolgreich bereinigt}}
```

---

### 💬 Interaktions-Auditor (Spam Comment Scanner)

Schütze deine Beiträge vor Spam und Krypto-Scams:

- Lädt deine 15 neuesten Beiträge.
- Holt alle Antwort-Threads für jeden dieser Beiträge.
- **Spam-Heuristiken**: Regex-basierte Erkennung von Krypto- und Link-Spam-Mustern (`telegram`, `whatsapp`, `earn`, `crypto`, `dm me`, etc.).
- Markiert Spam-Verdächtige für Massen-Blockierungen oder manuelle Prüfung.

---

### 🗂️ Listen-Manager (List Manager)

Volle Kontrolle über deine Kurationslisten:

- Durchsuche all deine Moderations- und Kurationslisten.
- Betrachte die Listenmitglieder im gleichen Grid-Design.
- **Liste klonen**: Dupliziere eine Liste unter neuem Namen.
- **Listen verschmelzen**: Kombiniere zwei Listen zu einer einzigen, inklusive automatischer Deduplizierung.
- **Starter Pack erstellen**: Generiert vollautomatisch ein offizielles Bluesky-Starter-Pack direkt auf deinem Profil aus den Mitgliedern der ausgewählten Liste (erzeugt die dafür benötigte Referenzliste auf dem PDS und verlinkt sie).
- **Listen-Backup & Wiederherstellung (Export/Import)**: Exportiere einzelne Listen als JSON oder CSV. Beim Importieren aus Backups (JSON, CSV, oder TXT mit Handles/DIDs) kontoübergreifend kannst du wählen, ob die Einträge **als neue Liste** (mit anpassbarem Namen) angelegt oder **in eine bestehende, eigene Liste integriert (mergt)** werden sollen.
- **Intelligente Deduplizierung & Listen-Laden**: Beim Zusammenführen (Merge) werden Duplikate automatisch im Vorfeld herausgefiltert. CTHULHU lädt nun neben deinen eigenen Listen auch **stummgeschaltete (Mute-Lists)** und **blockierte Listen-Abonnements (Block-Lists)** anderer Creator (Erhöhung des Limits auf 100 Listen). Listen werden automatisch beim Login geladen und beim Logout sicher aus dem Speicher entfernt.

---

### 📺 Timeline-Filter (Feed Sifter)

Kuratiere deinen Feed direkt an der Quelle:

- Lädt deine **Home-Timeline** oder deinen eigenen **Autoren-Feed**.
- Gruppiert Beiträge nach Ersteller und berechnet:
  - `repostCount / postsCount` → Repost-Prozentwert
  - `quoteCount` → Kennzeichnung für Zitat-Post-Spammer
- Wählt Accounts mit einer Repost-Rate von ≥ 50% für Massen-Muting aus.
- Massen-**Mute**: Schaltet Ersteller stumm (blendet Beiträge aus, ohne zu entfolgen).
- Alle Stummschaltungen werden im Verlauf für ein späteres Undo protokolliert.

#### EPK-Prozessdiagramm (Ereignisgesteuerte Prozesskette)

```mermaid
flowchart TD
    E1{{Benutzer eingeloggt}} --> F1(Home-Timeline oder Autoren-Feed laden)
    F1 --> E2{{Beiträge erfolgreich abgerufen}}
    E2 --> F2(Autoren-Aktivität analysieren)
    F2 --> F3(Repost-Verhältnis & Zitat-Post-Anzahl berechnen)
    F3 --> E3{{Heavy-Reposter & Quote-Spammer identifiziert}}
    
    E3 --> F4(Filtergrenze festlegen & Akteure auswählen)
    F4 --> E4{{Zielkonten ausgewählt}}
    
    E4 --> F5(Massen-Mute ausführen)
    F5 --> F6(AT-Protocol API-Aufruf: muteActor)
    F6 --> E5{{Akteure stummgeschaltet}}
    
    E5 --> F7(Mute-Aktion im Verlauf speichern)
    F7 --> E6{{Timeline erfolgreich bereinigt}}
```

---

### 📜 Verlauf & Whitelist (History & Smart Whitelist)

Verliere nie die Übersicht über deine Massenaktionen:

**Intelligente Whitelist:**
- **Beste Freunde & Interaktions-Scoring**: Der Generator analysiert deine letzten 80 Benachrichtigungen (Likes, Reposts, Mentions, Replies) sowie die Antworten unter deinen letzten 30 Beiträgen, berechnet einen Interaktions-Score (Reply=3, Mention=4, Direct Reply=5, Like/Follow/Repost=1) und whitelistet deine vertrauenswürdigsten Kontakte automatisch.
- **Backup & Restore**: Exportiere deine Whitelist als JSON oder CSV und importiere Backups im Handumdrehen, um Einstellungen zwischen Accounts zu teilen.
- Manuelle Eingabe: Füge beliebige Handles oder DIDs direkt zur Liste hinzu.
- Speicherung im `localStorage` — überdauert das Schließen des Browsers.
- Geschützte Accounts werden in allen anderen Tabs farblich hervorgehoben.

**Massen-Aktions-Verlauf (Undo-System):**
- Jede durchgeführte Massenaktion (Folgen, Entfolgen, Blockieren, Entblocken, Soft-Block, Mute) wird protokolliert.
- Speichert bis zu **50 Einträge** im `localStorage`.
- Ein-Klick-**↩️ Rückgängig** (Rollback) kehrt die Aktion passend um:
  - `unfollow` → folgt erneut via `createRecord`
  - `follow` → entfolgt via `deleteRecord`
  - `block` → löscht den Block-Eintrag
  - `unblock` → erstellt den Block-Eintrag erneut
  - `mute` → ruft `unmuteActor` für alle Ziele auf
  - `softblock` → warnt und ermöglicht optionales Wiederfolgen

#### EPK-Prozessdiagramm (Ereignisgesteuerte Prozesskette)

```mermaid
flowchart TD
    E1{{Massenaktion ausgeführt}} --> F1(Aktion im localStorage protokollieren)
    F1 --> E2{{Eintrag im Massen-Aktions-Verlauf vorhanden}}
    
    E2 --> F2(Benutzer klickt auf 'Rückgängig' ↩️)
    F2 --> E3{{Undo angefordert}}
    
    E3 --> F3{{"Aktionstyp?"}}
    
    F3 -- Unblock --> F4(Block wiederherstellen)
    F3 -- Block/Soft-Block --> F5(Block/Folgen aufheben)
    F3 -- Mute --> F6(Akteur entstummen: unmuteActor)
    F3 -- Follow --> F7(Entfolgen)
    F3 -- Unfollow --> F8(Wieder folgen)
    
    F4 --> E4{{Aktion erfolgreich rückgängig gemacht}}
    F5 --> E4
    F6 --> E4
    F7 --> E4
    F8 --> E4
    
    E4 --> F9(Verlaufseintrag als rückgängig markieren)
    F9 --> E5{{Datenbestand erfolgreich rollbacked}}
```

---

## 🚀 Erste Schritte

### Voraussetzungen

- [Node.js](https://nodejs.org/) v18 oder höher
- Ein [Bluesky](https://bsky.app)-Konto
- Ein **App-Passwort** (Einstellungen → Privatsphäre & Sicherheit → App-Passwörter)

> ⚠️ **Verwende niemals dein Haupt-Passwort.** Erstelle immer ein eigenes App-Passwort für Drittanbieter-Tools.

### Installation

```bash
git clone https://github.com/kolkrabeofdoom/CTHULHU.git
cd CTHULHU
npm install
```

### Server starten

```bash
node server.js
```

Oder unter Windows: Doppelklick auf die Datei `run.bat`.

Öffne anschließend deinen Browser unter: **http://localhost:3000**

### Demo- & Testmodus

Um die UI ohne Bluesky-Login direkt mit Demo-Daten auszuprobieren, rufe folgende URL auf:

```
http://localhost:3000/?test=1
```

Dies lädt für alle 8 Module vorausgefüllte Testdatensätze.

---

## 🔐 Privatsphäre & Sicherheit

- **100% lokal** — Es werden keine Daten an Drittserver gesendet. Alle Anfragen gehen direkt vom Browser an das Bluesky-API (`bsky.social` oder deine eigene PDS-Instanz).
- **Keine Tracker, Analytics oder Telemetrie.**
- Deine Anmeldedaten werden ausschließlich im `sessionStorage` deines Browsers abgelegt und beim Schließen des Tabs gelöscht.
- Whitelist und Aktionsverlauf werden unter deiner DID im `localStorage` gespeichert.

---

## 🛠️ Technische Architektur

```
C.T.H.U.L.H.U./
├── index.html          # Single-Page-App mit allen Tab-Panels
├── app.js              # ~6.000 Zeilen: State-Verwaltung, API-Logik und UI-Rendering
├── style.css           # ~2.100 Zeilen: Glassmorphism Design-System
├── server.js           # Minimaler Node.js Server zur Bereitstellung der statischen Dateien
├── run.bat             # Windows-Starter per Doppelklick
└── screenshots/        # Bilder für die README.md
```

---

## 🤝 Mitwirken

Beiträge, Fehlerberichte und Feature-Ideen sind herzlich willkommen! Bitte erstelle ein [Issue](https://github.com/kolkrabeofdoom/CTHULHU/issues) oder reiche einen Pull Request ein.

---

## 📜 Lizenz

[MIT](LICENSE) — Freie Nutzung, Modifikation und Weitergabe.

---

## 🐦 Mit 🖤 entwickelt für die Bluesky-Community

*Von [Kolkrabe of Doom](https://bsky.app/profile/kolkrabe.bsky.social) — "Just your average postanarchist nerd raven"*
