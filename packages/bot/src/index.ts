import {Client} from '@typeit/discord';
import * as dotenv from '@tinyhttp/dotenv';
import {dirname as getDirname} from 'dirname-filename-esm';
import path from 'node:path';
import prisma_pkg from '@prisma/client';
import {AppDiscord} from './discords/app-discord';

const {PrismaClient} = prisma_pkg;

const dirname = getDirname(import.meta);
const result = dotenv.config({path: path.resolve(dirname, '../.env.local')});

if (result.error) {
  throw result.error;
}

const prisma = new PrismaClient();

async function main() {
  const discordToken = process.env['DISCORD_TOKEN'];
  const client = new Client({
    classes: [AppDiscord],
    silent: false,
    variablesChar: ':'
  });
  if (!discordToken) {
    throw new Error('Must supply discord bot token');
  }

  await client.login(discordToken);
}

main().finally(() => prisma.$disconnect());
