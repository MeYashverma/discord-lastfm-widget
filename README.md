🎵 Discord Dynamic Profile Widget Engine

Real-Time Last.fm Powered Discord Widget Automation using GitHub Actions

A cloud-based automation system that connects Last.fm listening activity with Discord’s Dynamic Profile Widget system, automatically displaying live music data directly on a Discord profile.

This project fetches real-time music data from Last.fm, transforms it into Discord-compatible widget payloads, and continuously updates a Discord profile widget using scheduled GitHub Actions.

Built after reverse engineering Discord’s experimental Widget API.

---

Overview

This project creates an automated Discord widget that displays live listening activity and music statistics.

The system continuously syncs Last.fm data and updates the widget without requiring any local machine, VPS, or persistent backend.

Features:

Current Track
Artist Name
Album Name
Listening Status

Album Artwork

Track Listener Count
Total Personal Scrobbles

Infrastructure:

GitHub Actions
Node.js
Discord Widget API
Last.fm API
REST API Automation

No background server required.

No VPS
No Railway
No Render
No Cloudflare Workers
No local machine running 24/7

Everything runs entirely on GitHub Actions.

---

What This Widget Displays

The Discord widget dynamically updates these fields.

Live Music Metadata

Track Name
Artist Name
Album Name
Status (LIVE / IDLE)
Album Artwork

Example:

TRACK      → DARE
ARTIST     → Gorillaz
ALBUM      → Demon Days
STATUS     → LIVE

---

Music Statistics

Global Track Listener Count
Total User Scrobbles

Example:

LISTENERS  → 28.4K
SCROBBLES → 23.0K

---

System Architecture

The project uses a single workflow architecture.

All widget data is fetched and updated in one execution cycle.

                  GitHub Actions Scheduler
                            │
                            │
                     Execute update.js
                            │
                            │
               ┌────────────┼────────────┐
               │                         │
               │                         │

        Last.fm API               Last.fm API

 user.getrecenttracks           track.getInfo
                                   user.getinfo

               │                         │
               └────────────┬────────────┘
                            │
                    Build Full Payload
                            │
                            │
              Discord Widget API PATCH
                            │
                            │
                Discord Profile Widget

---

How The System Works

The workflow executes periodically using GitHub cron scheduling.

Each execution performs the following sequence.

1. GitHub scheduler triggers workflow

2. Temporary GitHub runner starts

3. Node.js environment is initialized

4. update.js executes

5. Fetch currently playing track from Last.fm

6. Fetch track listener count

7. Fetch total Last.fm scrobbles

8. Build Discord JSON payload

9. Send PATCH request to Discord Widget API

10. Discord profile widget updates

11. GitHub runner terminates

---

APIs Used

This project integrates multiple APIs.

---

Last.fm API

Primary data source for music metadata.

Documentation:

https://www.last.fm/api

Endpoints used:

user.getrecenttracks
track.getInfo
user.getinfo

---

user.getrecenttracks

Fetches most recently played track.

Used for:

Track
Artist
Album
Playback Status
Album Artwork

Example request:

https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=USERNAME&api_key=APIKEY&format=json&limit=1

---

track.getInfo

Fetches track metadata.

Used for:

Global listener count

Example request:

https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=Pixies&track=Where%20Is%20My%20Mind?&api_key=KEY&format=json

---

user.getinfo

Fetches Last.fm user account information.

Used for:

Total personal scrobbles

Example request:

https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=USERNAME&api_key=KEY&format=json

---

Discord Widget API

Discord recently introduced Dynamic Profile Widgets as part of its Social SDK architecture.

This project directly updates widget values using Discord’s internal Widget API.

---

API Method

PATCH

Endpoint:

https://discord.com/api/v9/applications/{APP_ID}/users/{USER_ID}/identities/0/profile

Authentication:

Bot Token Authorization

Headers:

Authorization: Bot YOUR_BOT_TOKEN
Content-Type: application/json

---

Payload Structure

Discord widgets accept dynamic JSON payloads.

Example payload.

{
  "data": {
    "dynamic": [
      {
        "type": 1,
        "name": "track",
        "value": "DARE"
      },
      {
        "type": 1,
        "name": "artist",
        "value": "Gorillaz"
      },
      {
        "type": 1,
        "name": "album",
        "value": "Demon Days"
      },
      {
        "type": 1,
        "name": "status",
        "value": "LIVE"
      },
      {
        "type": 1,
        "name": "listeners",
        "value": "28.4K"
      },
      {
        "type": 1,
        "name": "scrobbles",
        "value": "23.0K"
      },
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

---

Engineering Discovery

During development the project originally used a multi-workflow architecture.

Architecture tested:

fast-update.js
stats-update.js

fast.yml
stats.yml

The idea was to separate fast-changing data from slow-changing statistics.

Problem discovered:

Discord Widget API does not merge partial widget updates.

Example.

PATCH 1 → track, artist, album

PATCH 2 → listeners, scrobbles

Discord behavior:

Second PATCH replaces entire dynamic array
instead of merging values.

Result:

Track fields disappear
Widget shows partial data only

Final architecture changed to:

Single workflow
Single updater
Single full payload

This was one of the most important discoveries while reverse engineering Discord’s widget system.

---

GitHub Actions Automation

The project runs entirely using GitHub Actions.

Workflow:

.github/workflows/update.yml

Current schedule:

*/5 * * * *

Execution process:

GitHub Scheduler Trigger
       ↓
Temporary Ubuntu Runner Starts
       ↓
Install Dependencies
       ↓
Run update.js
       ↓
Fetch Last.fm Data
       ↓
Build JSON Payload
       ↓
PATCH Discord API
       ↓
Runner Terminates

GitHub Actions does not run continuously.

Each execution creates a temporary cloud environment.

---

Project Structure

discord-lastfm-widget/

package.json
update.js

.github/

   workflows/

      update.yml

README.md

---

Required Secrets

Add the following repository secrets.

Path:

Repository Settings
→ Secrets and Variables
→ Actions

Required values.

LASTFM_API_KEY
LASTFM_USERNAME
DISCORD_APP_ID
DISCORD_USER_ID
DISCORD_BOT_TOKEN

---

Deployment

Clone Repository
       ↓
Add GitHub Secrets
       ↓
Push Code
       ↓
GitHub Actions Executes
       ↓
Fetch Last.fm Data
       ↓
Build Discord Payload
       ↓
PATCH Discord API
       ↓
Discord Widget Updates

---

GitHub Actions Limitations

GitHub Actions scheduling is not real-time.

GitHub does not guarantee exact cron execution.

Observed behavior.

1 minute schedule → often skipped

2 minute schedule → unstable

5 minute schedule → generally reliable

10 minute schedule → very reliable

Recommended schedule.

*/5 * * * *

---

Development Journey

Multiple architectures were tested during development.

GitHub Actions Single Workflow

GitHub Multi Workflow Architecture

Cloudflare Workers + Cron

Railway Worker Deployment

Render Background Worker

Dual GitHub Workflow Architecture

Final Stable Single Workflow Architecture

Problems encountered.

Discord API 400 errors

GitHub cron throttling

Discord widget overwrite behavior

Cloudflare scheduling limitations

Railway free tier deployment issues

Render background worker failures

Discord payload validation problems

---

Future Improvements

Planned features.

Track change detection cache

Skip Discord update when same song

Spotify API integration

Recently played detection

Offline state detection

Listening streak tracking

Top artist statistics

Multiple music provider support

---

References

Resources used during development.

Discord Widget Tutorial

https://youtu.be/gYv7D83u7yQ

Discord Widgets Deep Dive

https://chloecinders.com/blog/discord-widgets

Discord Developer Documentation

https://discord.com/developers/docs

GitHub Actions Documentation

https://docs.github.com/actions

Last.fm API Documentation

https://www.last.fm/api

---

Tech Stack

Node.js

GitHub Actions

Axios

REST APIs

Discord Widget API

Last.fm API

JSON Payload Processing

---

Author

Built by

Yash Verma

GitHub

https://github.com/MeYashverma

Last.fm

http://last.fm/user/The_Berlin

---

Live Last.fm Stats

"My scrobbles" (https://lastfm-recently-played.vercel.app/api?user=The_Berlin&show_user=header&compact_stats_only)

---
