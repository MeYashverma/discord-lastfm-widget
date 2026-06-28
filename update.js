const axios = require("axios");

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;


// Get currently playing
async function fetchRecentTrack() {
    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    const response = await axios.get(url);

    const track = response.data.recenttracks.track[0];

    return {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"],
        playing: !!track["@attr"]?.nowplaying,
        image: track.image.at(-1)["#text"]
    };
}


// Get global listeners count
async function fetchTrackInfo(trackName, artistName) {
    const url =
        `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&format=json`;

    const response = await axios.get(url);

    return response.data.track.listeners;
}


// Get your total scrobbles
async function fetchUserInfo() {
    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json`;

    const response = await axios.get(url);

    return response.data.user.playcount;
}


// Build Discord payload
function buildPayload(track, listeners, scrobbles) {
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
                },
                {
                    type: 1,
                    name: "listeners",
                    value: listeners
                },
                {
                    type: 1,
                    name: "scrobbles",
                    value: scrobbles
                }
            ]
        }
    };
}


// Push to Discord
async function updateDiscord(payload) {
    const url =
        `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

    const response = await axios.patch(
        url,
        payload,
        {
            headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json",
                "User-Agent": "DiscordBot (WidgetUpdater)"
            }
        }
    );

    console.log("Discord status:", response.status);
}


// Main
(async () => {
    try {
        console.log("Starting update...");

        const track = await fetchRecentTrack();

        const listeners = await fetchTrackInfo(
            track.name,
            track.artist
        );

        const scrobbles = await fetchUserInfo();

        console.log("Track:", track.name);
        console.log("Listeners:", listeners);
        console.log("Scrobbles:", scrobbles);

        const payload =
            buildPayload(track, listeners, scrobbles);

        await updateDiscord(payload);

        console.log("Widget updated.");

    } catch (err) {
        console.error("ERROR:");

        if (err.response) {
            console.error(err.response.status);
            console.error(err.response.data);
        } else {
            console.error(err);
        }
    }
})();
