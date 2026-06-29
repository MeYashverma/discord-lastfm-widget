const axios = require("axios");

// ENV
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

let previousTrack = null;

// ==============================
// STARTUP CHECK
// ==============================
console.log("====================================");
console.log("Render worker started");
console.log("LASTFM_USERNAME:", LASTFM_USERNAME);
console.log("DISCORD_APP_ID:", DISCORD_APP_ID);
console.log("DISCORD_USER_ID:", DISCORD_USER_ID);
console.log("BOT TOKEN EXISTS:", !!DISCORD_BOT_TOKEN);
console.log("====================================");

// ==============================
// FETCH CURRENT TRACK
// ==============================
async function fetchRecentTrack() {
    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    console.log("Fetching Last.fm...");

    const response = await axios.get(url);

    const track = response.data.recenttracks.track[0];

    console.log("Fetched track:", track.name);

    return {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"] || "Unknown",
        playing: !!track["@attr"]?.nowplaying,
        image: track.image.at(-1)["#text"]
    };
}

// ==============================
// UPDATE DISCORD
// ==============================
async function updateDiscord(track) {

    const payload = {
        data: {
            dynamic: [
                {
                    type: 1,
                    name: "track",
                    value: track.name
                },
                {
                    type: 1,
                    name: "artist",
                    value: track.artist
                },
                {
                    type: 1,
                    name: "album",
                    value: track.album
                },
                {
                    type: 1,
                    name: "status",
                    value: track.playing ? "LIVE" : "IDLE"
                },
                {
                    type: 3,
                    name: "album_art",
                    value: {
                        url: track.image
                    }
                }
            ]
        }
    };

    console.log("Sending payload to Discord...");
    console.log(JSON.stringify(payload, null, 2));

    const url =
        `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

    const response = await axios.patch(
        url,
        payload,
        {
            headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json"
            }
        }
    );

    console.log("Discord response:", response.status);
}

// ==============================
// MAIN UPDATE LOOP
// ==============================
async function runUpdate() {
    try {
        console.log("------------------------------------");
        console.log("Checking for track update...");

        const track = await fetchRecentTrack();

        const current =
            `${track.name}-${track.artist}`;

        if (current === previousTrack) {
            console.log("No track change");
            return;
        }

        previousTrack = current;

        console.log("New track detected:", current);

        await updateDiscord(track);

        console.log("Widget updated successfully");

    } catch (err) {
        console.error("=========== ERROR ===========");

        if (err.response) {
            console.error("Status Code:", err.response.status);
            console.error("Response Body:");
            console.error(JSON.stringify(err.response.data, null, 2));
        } else {
            console.error("Message:", err.message);
        }

        console.error("=============================");
    }
}

// ==============================
// START LOOP
// ==============================
runUpdate();

setInterval(() => {
    runUpdate();
}, 15000);
