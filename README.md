# Tuyacord

Make your Tuya controlled lights react in real time to your playing Spotify music!

## Why Discord?

The Spotify API doesn't provide a way to get live updates on the currently playing track. However, Discord's Rich Presence feature does provide real-time updates on what music a user is listening to on Spotify. By leveraging Discord's API, we can get live updates on the currently playing track and use that information to control Tuya lights.

A Discord bot is added to a mutual server with the user running this application. The bot can then read the user's Rich Presence data to get real-time updates on the currently playing track.
