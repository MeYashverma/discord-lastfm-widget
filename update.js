const axios = require("axios");

// ENV
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;


// Fetch latest song from Last.fm
async function fetchTrack() {
    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    console.log("Fetching Last.fm data...");

    const response = await axios.get(url);

    const track = response.data.recenttracks.track[0];

    console.log("Fetched Last.fm:");
    console.log("Track:", track.name);
    console.log("Artist:", track.artist["#text"]);
    console.log("Album:", track.album["#text"]);
    console.log("Playing:", !!track["@attr"]?.nowplaying);

    return {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"],
        playing: !!track["@attr"]?.nowplaying,
        image: track.image.at(-1)["#text"]
    };
}


// Build Discord widget payload
function buildPayload(track) {
    return {
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
}


// Send update to Discord
async function updateDiscord(payload) {
    const url =
        `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

    console.log("Sending payload to Discord...");
    console.log(JSON.stringify(payload, null, 2));

    const response = await axios.patch(
        url,
        payload,
        {
            headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json",
                "User-Agent": "DiscordBot (custom widget updater)"
            }
        }
    );

    console.log("Discord API Status:", response.status);
    console.log("Discord widget updated.");
}


// Main
(async () => {
    try {
        console.log("====================================");
        console.log("RUN TIME:", new Date().toISOString());
        console.log("====================================");

        const track = await fetchTrack();

        const payload = buildPayload(track);

        await updateDiscord(payload);

        console.log("Update cycle complete.");

    } catch (err) {
        console.error("ERROR:");

        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Response:", err.response.data);
        } else {
            console.error(err);
        }
    }
})();
