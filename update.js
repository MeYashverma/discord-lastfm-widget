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
// FORMAT NUMBERS
// =====================
function formatNumber(num) {
    num = Number(num);

    if (num >= 1000000)
        return (num / 1000000).toFixed(1) + "M";

    if (num >= 1000)
        return (num / 1000).toFixed(1) + "K";

    return String(num);
}


// =====================
// FETCH CURRENT TRACK
// =====================
async function fetchRecentTrack() {

    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    const response = await axios.get(url);

    const track = response.data.recenttracks.track[0];

    // safe image handling
    let imageUrl = "";

    if (
        track.image &&
        track.image.length > 0 &&
        track.image.at(-1)["#text"]
    ) {
        imageUrl = track.image.at(-1)["#text"];
    }

    return {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"] || "Unknown",
        playing: !!track["@attr"]?.nowplaying,
        image: imageUrl
    };
}


// =====================
// FETCH TRACK LISTENERS
// =====================
async function fetchListeners(trackName, artistName) {

    try {
        const url =
            `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&format=json`;

        const response = await axios.get(url);

        return formatNumber(
            response.data.track.listeners
        );

    } catch {
        return "N/A";
    }
}


// =====================
// FETCH USER SCROBBLES
// =====================
async function fetchScrobbles() {

    try {
        const url =
            `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json`;

        const response = await axios.get(url);

        return formatNumber(
            response.data.user.playcount
        );

    } catch {
        return "N/A";
    }
}


// =====================
// BUILD PAYLOAD
// =====================
function buildPayload(track, listeners, scrobbles) {

    const dynamic = [
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
            type: 1,
            name: "listeners",
            value: listeners
        },
        {
            type: 1,
            name: "scrobbles",
            value: scrobbles
        }
    ];

    // only add album art if image exists
    if (
        track.image &&
        track.image.trim() !== ""
    ) {
        dynamic.push({
            type: 3,
            name: "album_art",
            value: {
                url: track.image
            }
        });
    }

    return {
        data: {
            dynamic: dynamic
        }
    };
}


// =====================
// UPDATE DISCORD
// =====================
async function updateDiscord(payload) {

    const url =
        `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

    const response =
        await axios.patch(
            url,
            payload,
            {
                headers: {
                    Authorization:
                        `Bot ${DISCORD_BOT_TOKEN}`,
                    "Content-Type":
                        "application/json"
                }
            }
        );

    console.log(
        "Discord Status:",
        response.status
    );
}


// =====================
// MAIN
// =====================
(async () => {

    try {

        console.log(
            "Starting widget update..."
        );

        const track =
            await fetchRecentTrack();

        const listeners =
            await fetchListeners(
                track.name,
                track.artist
            );

        const scrobbles =
            await fetchScrobbles();

        console.log(
            "Track:",
            track.name
        );

        console.log(
            "Artist:",
            track.artist
        );

        console.log(
            "Listeners:",
            listeners
        );

        console.log(
            "Scrobbles:",
            scrobbles
        );

        const payload =
            buildPayload(
                track,
                listeners,
                scrobbles
            );

        await updateDiscord(
            payload
        );

        console.log(
            "Widget updated successfully"
        );

    } catch (err) {

        console.error(
            "===== ERROR ====="
        );

        if (err.response) {
            console.error(
                "Status:",
                err.response.status
            );

            console.error(
                err.response.data
            );
        } else {
            console.error(
                err.message
            );
        }
    }

})();
