import "dotenv/config";

const BRIGHTNESS_SCALE = 0.5;

if (!process.env.BOT_TOKEN) {
    throw new Error("Missing BOT_TOKEN in environment variables");
}

if (!process.env.USER_ID) {
    throw new Error("Missing USER_ID in environment variables");
}

if (!process.env.TUYA_ACCESS_ID || !process.env.TUYA_KEY || !process.env.TUYA_DEVICE_ID) {
    throw new Error("Missing Tuya credentials in environment variables");
}

import { Vibrant } from "node-vibrant/node";
import convert from "color-convert";

import {configureTuya, sendCommands} from "./tuya";

configureTuya(process.env.TUYA_ACCESS_ID, process.env.TUYA_KEY, process.env.TUYA_DEVICE_ID)
    .then(() => {
        console.log("Tuya configured successfully.");
    })
    .catch((error) => {
        console.error("Error configuring Tuya:", error);
        process.exit(1);
    });

import {Client, GatewayIntentsString, Presence} from "discord.js";

const intents: GatewayIntentsString[] = [
    "Guilds",
    "GuildPresences",
];

const client = new Client({intents});

client.once("clientReady", () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    // fetch initial presence
    client.users.fetch(process.env.USER_ID!).then((user) => {
        // find a mutual guild
        const mutual_guild = client.guilds.cache.find((guild) => guild.members.cache.has(user.id));

        if (!mutual_guild) {
            console.log("No mutual guild found with the specified user for initial presence fetch.");
            return;
        }

        const member = mutual_guild.members.cache.get(user.id);

        if (!member) {
            console.log("Member not found in the mutual guild for initial presence fetch.");
            return;
        }

        handle_presence(member.presence!);
    });
});

client.on("presenceUpdate", (old_presence, new_presence) => {
    if (!new_presence) {
        return;
    }

    if (new_presence.userId !== process.env.USER_ID) {
        return;
    }

    handle_presence(new_presence);
});

const handle_presence = async (presence: Presence) => {
    // find spotify activity
    // TODO: pull from other art assets too, using priority system if multiple exist at once. create handlers for different services as overrides
    const spotify_activity = presence.activities.find(
        (activity) => activity.name === "Spotify"
    );

    if (!spotify_activity) {
        return;
    }

    console.log(`\nUser is listening to: ${spotify_activity.details} by ${spotify_activity.state}`);

    // pull album art
    const album_art_url = spotify_activity.assets?.largeImage
        ? spotify_activity.assets.largeImage.replace("spotify:", "https://i.scdn.co/image/")
        : null;

    if (!album_art_url) {
        return;
    }

    console.log(`Album art URL: ${album_art_url}`);

    // download image
    const image_response = await fetch(album_art_url);
    const image_blob = await image_response.blob();
    const image_buffer = Buffer.from(await image_blob.arrayBuffer());

    // get vibrant color
    const palette = await Vibrant.from(image_buffer).getPalette();
    const swatch = palette.Vibrant || palette.LightVibrant || palette.DarkVibrant || palette.Muted;

    if (!swatch) {
        console.log("No vibrant color found in album art.");
        return;
    }

    const {r, g, b} = swatch;

    console.log(`Dominant color: R:${r} G:${g} B:${b}`);

    // convert to hsv
    let [h, s, v] = convert.rgb.hsv(r, g, b);

    // tuya wants h in 0-360, s and v in 0-1000
    s = Math.round(s * 10);
    v = Math.round(v * 10);

    // apply brightness scale
    v = Math.round(v * BRIGHTNESS_SCALE);

    console.log(`HSV: H:${h} S:${s} V:${v}`);

    // send to tuya
    const response = await sendCommands([{
        code: "colour_data_v2",
        value: {h, s, v}
    }]);

    if (response.ok) {
        // check success is true in response json
        const response_json = await response.json();
        if (response_json.success) {
            console.log("Successfully sent color data to Tuya device.");
        } else {
            console.error("Tuya device responded with an error:", response_json.msg);
        }
    } else {
        console.error("Failed to send color data to Tuya device:", await response.text());
    }
}

client.login(process.env.BOT_TOKEN);
