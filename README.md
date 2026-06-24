<div align="center">

<img src="screenshots/logo.jpg" alt="C.T.H.U.L.H.U. Logo" width="160" style="border-radius: 50%;" />

# C.T.H.U.L.H.U.

### **C**leanup **T**ool for **H**eavy **U**nblocks, **L**ist **H**andling & **U**ser-**S**ifting

*A powerful, browser-based Bluesky account management suite*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.3.0-brightgreen.svg)](https://github.com/kolkrabeofdoom/C.T.H.U.L.H.U./releases)
[![Platform](https://img.shields.io/badge/platform-Bluesky%20%2F%20AT%20Protocol-0085ff.svg)](https://bsky.app)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)

</div>

---

> **C.T.H.U.L.H.U.** is a self-hosted, privacy-first web tool for power users who want to take full control of their Bluesky experience — managing blocks, followers, feeds, lists, and interactions with surgical precision, all without handing over your credentials to a third-party cloud service.

---

## ✨ Features at a Glance

| Module | Description |
|---|---|
| 🛡️ **Block-Entferner** | Bulk unblock users with phantom-record detection, whitelist protection & concurrency workers |
| 👥 **Follower-Abgleich** | Compare your follows/followers, find non-mutuals, bulk follow or unfollow |
| 🔍 **Überlappungs-Finder** | Find shared followers across 2–3 Bluesky accounts and batch-follow the overlap |
| 👻 **Geister-Auditor** | Audit your follower list for bots, inactive accounts, and zombie profiles |
| 💬 **Interaktions-Auditor** | Scan your recent post comments for spam bots and crypto scammers |
| 🗂️ **Listen-Manager** | Browse, clone, and merge your Bluesky curation lists |
| 📺 **Timeline-Filter** | Analyze your home feed for heavy reposters and quote-post spammers, then mute them in bulk |
| 📜 **Verlauf & Whitelist** | Smart Whitelist Builder + full Mass-Action Undo Log with one-click rollback |

---

## 📸 Screenshots

### Main Interface – Block Remover Tab
![Main Interface](screenshots/main-interface.png)

*The Block-Entferner tab shows your full blocklist as interactive cards. Stats dashboard, bulk select, whitelist protection, and phantom-record detection.*

---

### 👻 Geister-Auditor – Follower Quality Audit
![Ghost Auditor](screenshots/ghost-auditor.png)

*Analyzes every follower for Spam-Bot patterns, total inactivity, and the new Zombie-Account heuristic. Soft-Block selected accounts to cleanly remove them from your follower list.*

---

### 📺 Timeline-Filter – Repost & Quote Analysis
![Timeline Filter](screenshots/timeline-filter.png)

*Fetches your home feed, groups posts by actor, and calculates per-user repost rates. Heavy reposters are pre-selected for bulk muting. Supports filtering by "Heavy Reposters ≥50%" or "Quote-Post Heavy".*

---

### 📜 Verlauf & Whitelist – Smart Whitelist + Undo Log
![History & Whitelist](screenshots/history-whitelist.png)

*Left: Smart Whitelist Builder auto-suggests conversational partners from your recent posts. Right: The Massen-Aktions-Verlauf logs every bulk action with one-click rollback.*

---

## 🧠 Feature Deep-Dives

### 🛡️ Block-Entferner (Bulk Unblock)

The core feature. Import your Bluesky block list and manage it with power:

- **Phantom Record Detection**: Identifies blocks that exist in your local AT Protocol repo but no longer show up in the API — these "phantom" records can prevent clean unfollows.
- **Whitelist Protection**: Mark accounts as protected. Whitelisted DIDs are never included in bulk unblock operations.
- **Concurrency Workers**: 4 parallel workers with 100ms throttle to stay under API rate limits.
- **Pause & Resume**: Mid-run pause/continue support.
- **Dry-Run Mode**: Test operations without actually changing anything on Bluesky.

### 👥 Follower-Abgleich (Follow Comparison)

Compare who you follow vs. who follows you:

- Load up to 3,000+ follows and followers via paginated API.
- Visual badges: **Mutual**, **Folge ich**, **Folgt mir**, **Keine**.
- Filter tabs: All, Not-Mutuals, Non-Followers, Mutuals.
- Batch-follow or batch-unfollow with full concurrency queue.
- Integrates Follower-Kopier mode: copy another account's followers to your own follows.

### 🔍 Nischen- & Überlappungs-Finder (Niche Overlap Finder)

Discover shared communities between accounts:

- Enter 2 or 3 Bluesky handles to compare.
- Fetches up to 1,500 followers per target handle.
- Calculates the mathematical **intersection** of follower DIDs.
- Shows relationship badges (who is already a mutual, following, or blocked).
- Batch-follow the intersection to efficiently grow your network.

### 👻 Geister-Auditor (Ghost & Bot Auditor)

Three-tier follower quality analysis:

| Badge | Criteria |
|---|---|
| ⚠️ **Bot?** | 0 posts + no bio/avatar, OR follows > 500 with ratio > 5× |
| 🧟 **Zombie?** | Has posts but follows > 500, followers < 30, ratio > 8× — formerly dormant, now mass-following |
| 💤 **Inaktiv** | 0 posts total |

**Soft-Block** removes them cleanly: creates a block record and immediately deletes it, forcing a mutual unfollow without leaving a permanent block.

### 💬 Interaktions-Auditor (Spam Comment Scanner)

Protect your posts from spam:

- Fetches your 15 most recent posts.
- Retrieves all reply threads for each post.
- **Spam Heuristics**: Regex-based detection of crypto/link spam patterns (`telegram`, `whatsapp`, `earn`, `crypto`, `dm me`, etc.).
- Highlighted spam suspects with bulk block or bulk follow actions.

### 🗂️ Listen-Manager (List Manager)

Full curation list control:

- Browse all your moderation and curation lists.
- View list members in the same card grid UI.
- **Clone List**: Duplicate a list with a new name.
- **Merge Lists**: Combine two lists into one, automatically deduplicating overlapping DIDs.

### 📺 Timeline-Filter (Feed Sifter)

Curate your feed at the source:

- Fetch your **home timeline** or your own **author feed**.
- Group posts by actor and compute:
  - `repostCount / postsCount` → Repost Percentage
  - `quoteCount` → Quote-Post Heavy flag
- Pre-select accounts with ≥ 50% repost rate for muting.
- Bulk **mute** selected actors (silences them without unfollowing).
- All mutes are logged to the Undo History.

### 📜 Verlauf & Whitelist (History & Smart Whitelist)

Never lose track of what you did:

**Smart Whitelist Builder:**
- Automatically scans your recent posts for reply-to handles and adds them to your whitelist.
- Manual input: add any handle or DID manually.
- Persisted in `localStorage` — survives page reloads.
- Protected accounts are visually marked in all other tabs.

**Massen-Aktions-Verlauf (Undo Log):**
- Every bulk operation (follow, unfollow, block, unblock, soft-block, mute) is recorded.
- Stores up to **50 entries** in `localStorage`.
- One-click **↩️ Rückgängig** (Rollback) reverses each action type:
  - `unfollow` → re-follows via `createRecord`
  - `follow` → un-follows via `deleteRecord`
  - `block` → removes the block record
  - `unblock` → re-creates the block
  - `mute` → calls `unmuteActor` for all targets
  - `softblock` → warns and optionally re-follows

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Bluesky](https://bsky.app) account
- An **App Password** (Settings → Privacy & Security → App Passwords)

> ⚠️ **Never use your main account password.** Always generate an App Password.

### Installation

```bash
git clone https://github.com/kolkrabeofdoom/C.T.H.U.L.H.U..git
cd C.T.H.U.L.H.U.
npm install
```

### Running

```bash
node server.js
```

Or on Windows, double-click `run.bat`.

Then open your browser at: **http://localhost:3000**

### Demo / Test Mode

To explore the UI without logging in:

```
http://localhost:3000/?test=1
```

This loads pre-populated mock data for all 8 tabs.

---

## 🔐 Privacy & Security

- **100% local** — no data ever leaves your machine except direct AT Protocol API calls to `bsky.social` (or your custom PDS).
- **No tracking, no analytics, no telemetry.**
- Credentials are stored only in your browser's `sessionStorage` and cleared when you close the tab.
- Whitelist and undo history are stored in `localStorage` under your DID — only you can access them.
- All API calls use your own App Password session token with no intermediary.

---

## 🛠️ Technical Architecture

```
C.T.H.U.L.H.U./
├── index.html          # Single-page app, all tab panels
├── app.js              # ~6,000 lines: all state, API logic, UI rendering
├── style.css           # ~1,600 lines: dark glassmorphism design system
├── server.js           # Minimal Node.js static file server (CORS proxy not needed)
├── run.bat             # Windows one-click launcher
└── screenshots/        # README screenshots
```

**Design System:**
- CSS custom properties (`--primary`, `--card-bg`, `--primary-glow`, etc.)
- Glassmorphism cards with `backdrop-filter: blur()`
- Outfit font (Google Fonts)
- Smooth `fade-in` micro-animations

**API Integration:**
- AT Protocol (`com.atproto.*`) for record CRUD
- Bluesky AppView (`app.bsky.*`) for social graph data
- Fully paginates large datasets (follows, followers, blocks)
- Concurrency workers (4×) with 100ms throttle

---

## 🤝 Contributing

Contributions, bug reports, and feature ideas are welcome! Please open an [Issue](https://github.com/kolkrabeofdoom/C.T.H.U.L.H.U./issues) or a Pull Request.

---

## 📜 License

[MIT](LICENSE) — Free to use, modify, and distribute.

---

## 🐦 Made with 🖤 for the Bluesky community

*By [Kolkrabe of Doom](https://bsky.app/profile/kolkrabe.bsky.social) — "Just your average postanarchist nerd raven"*

