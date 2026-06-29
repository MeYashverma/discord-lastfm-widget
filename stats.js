const axios = require("axios");

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;


function formatNumber(num) {
    num = Number(num);

    if (num >= 1000000)
        return (num / 1000000).toFixed(1) + "M";

    if (num >= 1000)
        return (num / 1000).toFixed(1) + "K";

    return String(num);
}


// get current track
async function fetchTrack() {
    const url =
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

    const response = await axios.get(url);

    const track = response.data.recenttracks.track[0];

    return {
        name: track.name,
        artist: track.artist["#text"]
    };
}


// listeners
async function fetchListeners(track, artist) {
    try {
        const url =
         `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;

        const response = await axios.get(url);

        return formatNumber(
            response.data.track.listeners
        );

    } catch {
        return "N/A";
    }
}


// scrobbles
async function fetchScrobbles() {
    const url =
      `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json`;

    const response = await axios.get(url);

    return formatNumber(
        response.data.user.playcount
    );
}


// discord patch
async function updateDiscord(
    listeners,
    scrobbles
) {

    const payload = {
        data: {
            dynamic: [
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

    const url =
      `https://discord.com/api/v9/applications/${DISCORD_APP_ID}/users/${DISCORD_USER_ID}/identities/0/profile`;

    await axios.patch(url, payload, {
        headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
}


(async () => {

    const track =
        await fetchTrack();

    const listeners =
        await fetchListeners(
            track.name,
            track.artist
        );

    const scrobbles =
        await fetchScrobbles();

    await updateDiscord(
        listeners,
        scrobbles
    );

    console.log("Stats updated");

})();
