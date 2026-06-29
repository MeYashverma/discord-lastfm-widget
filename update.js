const axios = require("axios");

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

let previousTrack = null;


// current track only
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


// push to discord
async function updateDiscord(track) {

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
                }
            ]
        }
    };

    const url =
        `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

    await axios.patch(url, payload, {
        headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
}


// loop
async function runUpdate() {
    try {

        const track = await fetchRecentTrack();

        const current =
            `${track.name}-${track.artist}`;

        if (current === previousTrack) {
            console.log("No song change");
            return;
        }

        previousTrack = current;

        await updateDiscord(track);

        console.log("Updated:", current);

    } catch(err) {
        console.error(err.message);
    }
}


console.log("Railway worker started");

runUpdate();

setInterval(runUpdate, 15000);
