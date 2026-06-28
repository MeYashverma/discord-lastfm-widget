const axios = require("axios");
const fs = require("fs");

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;

const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;


// fetch current song
async function fetchTrack() {
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


// read previous song
function getPreviousSong() {
    try {
        return fs.readFileSync("last_track.txt", "utf8");
    } catch {
        return "";
    }
}


// save latest song
function saveSong(song) {
    fs.writeFileSync("last_track.txt", song);
}


// create discord payload
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


// send to discord
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


// main
(async () => {

    const track = await fetchTrack();

    const currentSong = `${track.name}-${track.artist}`;

    const previousSong = getPreviousSong();

    if (currentSong === previousSong) {
        console.log("No song change. Skipping.");
        return;
    }

    console.log("Song changed:", currentSong);

    const payload = buildPayload(track);

    await updateDiscord(payload);

    saveSong(currentSong);

    console.log("Discord widget updated.");

})();
