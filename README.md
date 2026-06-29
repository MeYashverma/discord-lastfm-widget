# 🎵 Discord Dynamic Profile Widget Framework

**Real-Time Last.fm Powered Discord Profile Widget using GitHub Actions**

A fully automated cloud-based system that connects Last.fm listening activity with Discord’s new Dynamic Profile Widget system.

It fetches music data from Last.fm, converts it into Discord Widget JSON payloads, and updates your Discord profile automatically.

- ✅ No VPS  
- ✅ No 24/7 machine  
- ✅ No self-hosting  

> ⚡ Runs entirely on GitHub Actions

---

## 🚀 Project Overview

This project creates a live Discord widget that displays:

### 🎧 Live Music Data
- Current Track  
- Artist Name  
- Album Name  
- Listening Status (`LIVE / IDLE`)  
- Album Artwork  

### 📊 Music Statistics
- Track Listener Count  
- Total Personal Scrobbles  

---

## 💡 Why I Built This

Discord introduced experimental **Dynamic Profile Widgets**.

Unlike Rich Presence, these widgets allow **fully customizable dynamic content**.

### Goals:
- Automate a Discord music widget  
- Use Last.fm as a data source  
- Eliminate server/VPS dependency  
- Achieve near real-time updates  
- Reverse engineer Discord widget API behavior  
- Run everything using GitHub  

---

## 🧩 Widget Structure

### 🔴 Section 1 — Live Music Activity
*Updated frequently*

- 🎵 Track  
- 🎤 Artist  
- 💿 Album  
- 🔴 Status  
- 🖼 Artwork  

**Example:**
```
TRACK   → Where Is My Mind?
ARTIST  → Pixies
ALBUM   → Surfer Rosa
STATUS  → LIVE
```

---

### 📈 Section 2 — Listening Statistics
*Updated less frequently*

- 🎧 Track Listeners  
- 📈 Total Scrobbles  

**Example:**
```
LISTENERS → 428K
SCROBBLES → 22.9K
```

---

## 🏗 System Architecture

```
Last.fm API
     │
     ├──────────────┐
     │              │
FAST WORKFLOW    STATS WORKFLOW
(1 min)          (15 min)
     │              │
     │              │
recenttracks    track.getInfo
     │          user.getinfo
     │              │
     │              │
Live Data      Stats Data
     │              │
     └──── PATCH ───┘
             │
   Discord Widget API
             │
   Discord Profile Widget
```

---

## ⚙️ Workflow Design

### Why Split Workflows?

Single workflow problem:
- 3 API calls every run:
  - `user.getrecenttracks`
  - `track.getInfo`
  - `user.getinfo`

### ✅ Solution:
- Split based on update frequency  

---

## ⚡ Fast Workflow

- Runs: **every 1 minute**
- Updates:
  - Track
  - Artist
  - Album
  - Status
  - Artwork  

**Files:**
```
fast-update.js
.github/workflows/fast.yml
```

---

## 📊 Stats Workflow

- Runs: **every 15 minutes**
- Updates:
  - Listeners
  - Scrobbles  

**Files:**
```
stats-update.js
.github/workflows/stats.yml
```

---

## 🌐 APIs Used

### 🎵 Last.fm API

Docs: https://www.last.fm/api

#### `user.getrecenttracks`
```
https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=USERNAME&api_key=KEY&format=json&limit=1
```

#### `track.getInfo`
```
https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=Pixies&track=Where%20Is%20My%20Mind?&api_key=KEY&format=json
```

#### `user.getinfo`
```
https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=USERNAME&api_key=KEY&format=json
```

---

## 💬 Discord Widget API

### Request

- Method: `PATCH`
- Endpoint:
```
https://discord.com/api/v9/applications/{APP_ID}/users/{USER_ID}/identities/0/profile
```

### Headers
```json
Authorization: Bot YOUR_BOT_TOKEN
Content-Type: application/json
```

---

## 📦 Payload Example

```json
{
  "data": {
    "dynamic": [
      { "type": 1, "name": "track", "value": "Closer" },
      { "type": 1, "name": "artist", "value": "Nine Inch Nails" },
      { "type": 1, "name": "album", "value": "The Downward Spiral" },
      { "type": 1, "name": "status", "value": "LIVE" },
      {
        "type": 3,
        "name": "album_art",
        "value": {
          "url": "https://..."
        }
      }
    ]
  }
}
```

---

## 🤖 GitHub Actions

### Fast Workflow
```
.github/workflows/fast.yml
```

Schedule:
```
* * * * *
```

---

### Stats Workflow
```
.github/workflows/stats.yml
```

Schedule:
```
*/15 * * * *
```

---

## 📂 Project Structure

```
discord-lastfm-widget/
├── package.json
├── fast-update.js
├── stats-update.js
└── .github/
    └── workflows/
        ├── fast.yml
        └── stats.yml
```

---

## 🔐 Required Secrets

Path:
```
Settings → Secrets → Actions
```

```
LASTFM_API_KEY
LASTFM_USERNAME
DISCORD_APP_ID
DISCORD_USER_ID
DISCORD_BOT_TOKEN
```

---

## 🚀 Deployment

```
Clone Repo
   ↓
Add Secrets
   ↓
Push Code
   ↓
Actions Run
   ↓
Fetch Data
   ↓
Send Payload
   ↓
Widget Updates ✅
```

---

## 📚 References

- https://youtu.be/gYv7D83u7yQ  
- https://chloecinders.com/blog/discord-widgets  
- https://discord.com/developers/docs  
- https://docs.github.com/actions  
- https://www.last.fm/api  

---

## ⚠️ Common Issues

### Widget Not Updating
- Check logs  
- Check secrets  
- Verify IDs  

### API 400 Error
- Invalid JSON  
- Missing fields  
- Empty artwork  

### Workflow Not Running
- Cron syntax  
- Actions enabled  

---

## 📉 Limitations

GitHub Actions is not real-time.

Possible delay:
- 30s  
- 1–2 minutes  

---

## 🧰 Tech Stack

- Node.js  
- GitHub Actions  
- Axios  
- REST APIs  
- Last.fm API  
- Discord API  

---

## 👤 Author

**Yash Verma**

- GitHub: https://github.com/MeYashverma
- Last.FM: http://last.fm/user/The_Berlin
![My scrobbles](https://lastfm-recently-played.vercel.app/api?user=The_Berlin&show_user=header&compact_stats_only)
