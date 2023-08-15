import 'dotenv/config';
import { Client, Events, GatewayIntentBits, SlashCommandBuilder, Routes, REST } from 'discord.js';

import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import { CronJob } from 'cron';



const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), {
    body: [
      new SlashCommandBuilder()
      .setName('info')
      .setDescription('Get happy hour games list')
    ],
  });

  mainJob.start();
});

const mainJob = new CronJob(
  '0 4 22 * * *',
  async () => {
    console.log('It\'s High Noon..');
    client.channels.cache.get('1044324753059618979').send(await getInfo());
  },
  null,
  false,
  'UTC+3',
  null,
  false
);

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'info') {
    const response = await getInfo();
    interaction.reply({ content: response });
  }
  else {
    interaction.reply({ content: 'Command not found', ephemeral: true });
  }
});

async function getInfo() {
  const raw = await fetch('https://zaka-zaka.com/happyhour/');
  return parseData(await raw.text());
}

function parseData(data) {
  const root = parse(data);
  const games = root.querySelectorAll('.game-block');

  let result = '';
  games.forEach(game => {
    result += game.querySelector('.game-block-name').textContent + ' - <' + (game.getAttribute('href') || 'No link') + '>\n';
  });
  return result;
}