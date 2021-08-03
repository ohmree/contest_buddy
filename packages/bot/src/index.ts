import path from 'node:path';
import {Client} from '@typeit/discord';
// Import * as dotenv from '@tinyhttp/dotenv';

// const result = dotenv.config({path: './.env.local'});

// if (result.error) {
//   throw result.error;
// }

async function start() {
  const client = new Client({
    classes: [
      path.resolve(__dirname, '/discords/*-discord.ts'), // Glob string to load the classes
      path.resolve(__dirname, '/discords/*-discord.js') // If you compile using "tsc" the file extension change to .js
    ],
    silent: false,
    variablesChar: ':'
  });
  if (!process.env['DISCORD_TOKEN']) {
    throw new Error('Must supply discord bot token');
  }

  await client.login(process.env['DISCORD_TOKEN']);
}

void start();
