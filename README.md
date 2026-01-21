# Tuyacord

Make your Tuya controlled lights react in real time to your music playing on Spotify!

## Setup

Please note that the instructions for Tuya are non-specific due to frequent changes made to their platform.

1. Clone this repository to your local machine and install the dependencies:

   ```bash
   git clone https://github.com/obfuscatedgenerated/tuyacord.git
   cd tuyacord
   pnpm install
   ```
2. Create a new [Discord Application](https://discord.com/developers/applications) and add a bot to it. **Enable the Presence Intent**. Invite the bot to a server where you and the bot are both members. No permissions are needed, just a bot scope invite: `https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot`
3. Set up a Tuya IoT Platform project with an IoT Core enrollment.
4. Copy `.env.example` to `.env` and fill in the required environment variables.
5. Run the application:

   ```bash
   pnpm start
   ```

## Why Discord?

The Spotify API doesn't provide a way to get live updates on the currently playing track. However, Discord's Rich Presence feature does provide real-time updates on what music a user is listening to on Spotify. By leveraging Discord's API, we can get live updates on the currently playing track and use that information to control Tuya lights.

A Discord bot is added to a mutual server with the user running this application. The bot can then read the user's Rich Presence data to get real-time updates on the currently playing track.
