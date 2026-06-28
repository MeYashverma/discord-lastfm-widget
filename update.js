const axios = require("axios");

// =====================
// ENV VARIABLES
// =====================
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;


// =====================
// FORMAT LARGE NUMBERS
// =====================
function formatNumber(num) {
    num = Number(num);

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }

    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }

    return String(num);
}


// =====================
// FETCH CURRENT TRACK
// =====================
async function fetchRecentTrack() {
    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    console.log("Fetching current track...");

    const response = await axios.get(url);

    const track = response.data.recenttracks.track[0];

    return {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"] || "Unknown Album",
        playing: !!track["@attr"]?.nowplaying,
        image: track.image.at(-1)["#text"]
    };
}


// =====================
// FETCH TRACK LISTENERS
// =====================
async function fetchTrackListeners(trackName, artistName) {
    try {
        const url =
            `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&format=json`;

        console.log("Fetching listeners count...");

        const response = await axios.get(url);

        const listeners = response.data.track.listeners;

        return formatNumber(listeners);

    } catch (error) {
        console.log("Could not fetch listeners.");

        return "N/A";
    }
}


// =====================
// FETCH USER SCROBBLES
// =====================
async function fetchUserScrobbles() {
    try {
        const url =
            `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json`;

        console.log("Fetching scrobble count...");

        const response = await axios.get(url);

        const playcount = response.data.user.playcount;

        return formatNumber(playcount);

    } catch (error) {
        console.log("Could not fetch scrobbles.");

        return "N/A";
    }
}


// =====================
// BUILD DISCORD PAYLOAD
// =====================
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


// =====================
// UPDATE DISCORD WIDGET
// =====================
async function updateDiscord(payload) {
    const url =
        `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

    console.log("Sending update to Discord...");

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

    console.log("Discord API Status:", response.status);
}


// =====================
// MAIN EXECUTION
// =====================
(async () => {
    try {
        console.log("======================================");
        console.log("RUN TIME:", new Date().toISOString());
        console.log("======================================");

        // Fetch all data
        const track = await fetchRecentTrack();

        const listeners =
            await fetchTrackListeners(
                track.name,
                track.artist
            );

        const scrobbles =
            await fetchUserScrobbles();

        // Log results
        console.log("Current Track:", track.name);
        console.log("Artist:", track.artist);
        console.log("Album:", track.album);
        console.log("Status:", track.playing ? "LIVE" : "IDLE");
        console.log("Listeners:", listeners);
        console.log("Scrobbles:", scrobbles);

        // Build payload
        const payload =
            buildPayload(
                track,
                listeners,
                scrobbles
            );

        // Update Discord
        await updateDiscord(payload);

        console.log("Widget successfully updated.");

    } catch (error) {
        console.error("======== ERROR ========");

        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Response:", error.response.data);
        } else {
            console.error(error);
        }
    }
})();
