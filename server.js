// server.js - Discord bot for Render hosting
// Features:
// - Pings its own Render URL and another Render project URL every minute
// - Provides a button in a specific Discord channel to trigger another project's redeploy
// - All URLs and IDs configurable via environment variables

import express from 'express';
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import fetch from 'node-fetch';

// ─────────────────────────────────────────
// ENVIRONMENT VARIABLES
// ─────────────────────────────────────────
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const REDEPLOY_URL = process.env.REDEPLOY_URL;
const PING_URL_SELF = process.env.PING_URL_SELF;
const PING_URL_OTHER = process.env.PING_URL_OTHER;
const PORT = process.env.PORT || 3000;

if (!DISCORD_TOKEN || !CHANNEL_ID || !REDEPLOY_URL || !PING_URL_SELF || !PING_URL_OTHER) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

// ─────────────────────────────────────────
// EXPRESS SERVER (for Render pinging)
// ─────────────────────────────────────────
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`🌐 Express server running on port ${PORT}`));

// ─────────────────────────────────────────
// DISCORD CLIENT
// ─────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// ─────────────────────────────────────────
// ON BOT READY
// ─────────────────────────────────────────
client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
      console.error('❌ CHANNEL_ID is invalid.');
      return;
    }

    // Create button row
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('redeploy')
        .setLabel('Trigger Redeploy')
        .setStyle(ButtonStyle.Danger)
    );

    // Send the control message
    await channel.send({
      content: 'Click the button below to trigger the redeploy:',
      components: [row],
    });

    console.log('📨 Button sent to channel.');
  } catch (err) {
    console.error('❌ Failed to send button:', err);
  }

  // ─────────────────────────────────────────
  // PING LOOP (every minute)
  // ─────────────────────────────────────────
  setInterval(async () => {
    try {
      await fetch(PING_URL_SELF);
      console.log(`🔁 Pinged self: ${PING_URL_SELF}`);
    } catch (err) {
      console.error('❌ Ping self failed:', err);
    }

    try {
      await fetch(PING_URL_OTHER);
      console.log(`🔁 Pinged other: ${PING_URL_OTHER}`);
    } catch (err) {
      console.error('❌ Ping other failed:', err);
    }
  }, 60 * 1000);
});

// ─────────────────────────────────────────
// BUTTON INTERACTION HANDLER
// ─────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'redeploy') {
    console.log('🚀 Redeploy button pressed.');

    try {
      await fetch(REDEPLOY_URL, { method: 'POST' });
      await interaction.reply({
        content: '🚀 Redeploy triggered successfully!',
        ephemeral: true,
      });
    } catch (err) {
      console.error('❌ Redeploy request failed:', err);
      await interaction.reply({
        content: '❌ Failed to trigger redeploy.',
        ephemeral: true,
      });
    }
  }
});

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
client.login(DISCORD_TOKEN);
