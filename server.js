// server.js - Discord bot for Render hosting
// Features:
// - Pings its own Render URL and another Render project URL every minute
// - Provides a button in a specific Discord channel to trigger redeploy of another project
// - All URLs and channel ID configurable via environment variables
// - Includes port for Render deployment

import express from 'express';
import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const REDEPLOY_URL = process.env.REDEPLOY_URL;
const PING_URL_SELF = process.env.PING_URL_SELF;
const PING_URL_OTHER = process.env.PING_URL_OTHER;
const PORT = process.env.PORT || 3000;

if (!DISCORD_TOKEN || !CHANNEL_ID || !REDEPLOY_URL || !PING_URL_SELF || !PING_URL_OTHER) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (channel) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('123').setLabel('1234').setStyle(ButtonStyle.Danger)
    );
    await channel.send({ content: 'Click me:', components: [row] });
  }

  setInterval(async () => {
    try { await fetch(PING_URL_SELF); console.log(`Pinged self URL: ${PING_URL_SELF}`); } catch (err) { console.error('Ping self URL failed:', err); }
    try { await fetch(PING_URL_OTHER); console.log(`Pinged other URL: ${PING_URL_OTHER}`); } catch (err) { console.error('Ping other URL failed:', err); }
  }, 60 * 1000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'Restart thingy') {
    try { await fetch(REDEPLOY_URL, { method: 'POST' }); await interaction.reply({ content: 'Redeploy triggered successfully!', ephemeral: true }); }
    catch (err) { console.error('Redeploy failed:', err); await interaction.reply({ content: 'Failed to trigger redeploy.', ephemeral: true }); }
  }
});

client.login(DISCORD_TOKEN);
