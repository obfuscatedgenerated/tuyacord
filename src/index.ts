import "dotenv/config";

if (!process.env.BOT_TOKEN) {
    throw new Error("Missing BOT_TOKEN in environment variables");
}

if (!process.env.USER_ID) {
    throw new Error("Missing USER_ID in environment variables");
}

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

const handle_presence = (presence: Presence) => {
    // find spotify activity
    // TODO: pull from other art assets too, using priority system if multiple exist at once. create handlers for different services as overrides
    const spotify_activity = presence.activities.find(
        (activity) => activity.name === "Spotify"
    );

    if (!spotify_activity) {
        return;
    }

    console.log(`User is listening to: ${spotify_activity.details} by ${spotify_activity.state}`);

    // pull album art
    const album_art_url = spotify_activity.assets?.largeImage
        ? spotify_activity.assets.largeImage.replace("spotify:", "https://i.scdn.co/image/")
        : null;

    if (album_art_url) {
        console.log(`Album art URL: ${album_art_url}`);
    }
}

client.login(process.env.BOT_TOKEN);
