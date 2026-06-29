const axios = require("axios");

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

let previousTrack = null;


// format numbers
function formatNumber(num) {
    num = Number(num);

    if (num >= 1000000)
        return (num / 1000000).toFixed(1) + "M";

    if (num >= 1000)
        return (num / 1000).toFixed(1) + "K";

    return String(num);
}


// get recent track
async function fetchRecentTrack() {
    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    const response = await axios.get(url);

    const track = response.data.recenttracks.track[0];

    return {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"] || "Unknown",
        playing: !!track["@attr"]?.nowplaying,
        image: track.image.at(-1)["#text"]
    };
}


// track listeners
async function fetchListeners(track, artist) {
    try {
        const url =
            `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;

        const response = await axios.get(url);

        return formatNumber(response.data.track.listeners);

    } catch {
        return "N/A";
    }
}


// user scrobbles
async function fetchScrobbles() {
    try {
        const url =
            `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json`;

        const response = await axios.get(url);

        return formatNumber(response.data.user.playcount);

    } catch {
        return "N/A";
    }
}


// discord update
async function updateDiscord(payload) {
    const url =
        `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

    await axios.patch(url, payload, {
        headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
}


// one cycle
async function runUpdate() {
    try {
        const track = await fetchRecentTrack();

        const current = `${track.name}-${track.artist}`;

        // skip if same song
        if (current === previousTrack) {
            console.log("No track change");
            return;
        }

        previousTrack = current;

        const listeners =
            await fetchListeners(
                track.name,
                track.artist
            );

        const scrobbles =
            await fetchScrobbles();

        const payload = {
            data: {
                dynamic: [
                    { type:1, name:"track", value:track.name },
                    { type:1, name:"artist", value:track.artist },
                    { type:1, name:"album", value:track.album },
                    {
                      type:1,
                      name:"status",
                      value:track.playing ? "LIVE":"IDLE"
                    },
                    {
                      type:3,
                      name:"album_art",
                      value:{ url:track.image }
                    },
                    {
                      type:1,
                      name:"listeners",
                      value:listeners
                    },
                    {
                      type:1,
                      name:"scrobbles",
                      value:scrobbles
                    }
                ]
            }
        };

        await updateDiscord(payload);

        console.log("Updated:", current);

    } catch (err) {
        console.error("Error:", err.message);
    }
}


// start loop
console.log("Railway worker started");

runUpdate();

setInterval(runUpdate, 15000);
