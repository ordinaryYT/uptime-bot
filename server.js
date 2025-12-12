import express from 'express';
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import fetch from 'node-fetch';

// Env vars
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

// Express server
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
      console.error('Invalid CHANNEL_ID.');
      return;
    }

    // Button row
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('redeploy')
        .setLabel('Restart')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: 'Press the button below to restart the website:',
      components: [row],
    });

    console.log('Button sent.');
  } catch (err) {
    console.error('Failed to send button:', err);
  }

  // Ping loop
  setInterval(async () => {
    try {
      await fetch(PING_URL_SELF);
    } catch (err) {
      console.error('Ping self failed:', err);
    }

    try {
      await fetch(PING_URL_OTHER);
    } catch (err) {
      console.error('Ping other failed:', err);
    }
  }, 60 * 1000);
});

// Interaction handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'redeploy') {
    try {
      await fetch(REDEPLOY_URL, { method: 'POST' });
      await interaction.reply({ content: 'Restarted', ephemeral: true });
    } catch (err) {
      console.error('Redeploy error:', err);
      await interaction.reply({ content: 'Error', ephemeral: true });
    }
  }
});

client.login(DISCORD_TOKEN);
