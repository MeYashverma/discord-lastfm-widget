const axios = require("axios");

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;


// format numbers nicely
function formatNumber(num) {
    num = Number(num);

    if (num >= 1000000)
        return (num / 1000000).toFixed(1) + "M";

    if (num >= 1000)
        return (num / 1000).toFixed(1) + "K";

    return String(num);
}


// fetch current track (needed for listeners)
async function fetchTrack() {

    const url =
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    const response = await axios.get(url);

    const track =
        response.data.recenttracks.track[0];

    return {
        name: track.name,
        artist: track.artist["#text"]
    };
}


// fetch global listeners count
async function fetchListeners(
    trackName,
    artistName
) {
    try {

        const url =
            `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&format=json`;

        const response =
            await axios.get(url);

        return formatNumber(
            response.data.track.listeners
        );

    } catch {
        return "N/A";
    }
}


// fetch your scrobble count
async function fetchScrobbles() {

    try {

        const url =
            `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json`;

        const response =
            await axios.get(url);

        return formatNumber(
            response.data.user.playcount
        );

    } catch {
        return "N/A";
    }
}


// update discord widget
async function updateDiscord(
    listeners,
    scrobbles
) {

    const payload = {
        data: {
            dynamic: [
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
        "Stats update success:",
        response.status
    );
}


// main
(async () => {
    try {

        console.log(
            "Running stats update..."
        );

        const track =
            await fetchTrack();

        const listeners =
            await fetchListeners(
                track.name,
                track.artist
            );

        const scrobbles =
            await fetchScrobbles();

        console.log(
            "Listeners:",
            listeners
        );

        console.log(
            "Scrobbles:",
            scrobbles
        );

        await updateDiscord(
            listeners,
            scrobbles
        );

    } catch (err) {

        console.error("ERROR");

        if (err.response) {
            console.error(
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
