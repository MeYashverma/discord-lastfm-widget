const axios = require("axios");

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;


// Fetch current track
async function fetchRecentTrack() {

    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    const response = await axios.get(url);

    const track = response.data.recenttracks.track[0];

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


// Update Discord widget
async function updateDiscord(track) {

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
        }
    ];

    // only send album art if exists
    if (track.image !== "") {
        dynamic.push({
            type: 3,
            name: "album_art",
            value: {
                url: track.image
            }
        });
    }

    const payload = {
        data: {
            dynamic: dynamic
        }
    };

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

    console.log("Fast update success:", response.status);
}


// Main
(async () => {
    try {
        console.log("Running fast update...");

        const track = await fetchRecentTrack();

        console.log("Track:", track.name);
        console.log("Artist:", track.artist);

        await updateDiscord(track);

    } catch (err) {
        console.error("ERROR");

        if (err.response) {
            console.error(err.response.status);
            console.error(err.response.data);
        } else {
            console.error(err.message);
        }
    }
})();
