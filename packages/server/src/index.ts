// eslint-disable-next-line import/no-unassigned-import
import 'reflect-metadata';
import path from 'node:path';
import process from 'node:process';
import {App} from '@tinyhttp/app';
import {logger} from '@tinyhttp/logger';
import {cors} from '@tinyhttp/cors';
import {json} from 'milliparsec';
import prisma_pkg from '@prisma/client';
import {dirname as getDirname} from 'dirname-filename-esm';
import sirv from 'sirv';
import helmet from 'helmet';
import {Client} from '@typeit/discord';
import * as dotenv from '@tinyhttp/dotenv';
import cookieSession from 'cookie-session';
import passport from 'passport';
import {Strategy as DiscordStrategy} from 'passport-discord';
import {AppDiscord} from './discords/app-discord';
import serversApi from './routes/servers';
import Validator from 'fastest-validator';
import getDiscordHandlers from './discord-handlers';

const {PrismaClient} = prisma_pkg;

const dirname = getDirname(import.meta);
const dotenvResult = dotenv.config({
  path: path.resolve(dirname, '../.env.local'),
});

if (dotenvResult.error) {
  throw dotenvResult.error;
}

const {DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET} = process.env;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  throw new Error('No discord client id and secret supplied.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({where: {id}});
    done(null, user);
  } catch (error: unknown) {
    done(error, null);
  }
});

passport.use(
  new DiscordStrategy(
    {
      clientID: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
      callbackURL: 'http://localhost:4000/auth/callback',
      scope: ['identify', 'guilds', 'connections', 'bot'],
    },
    async (_accessToken, _refreshToken, profile, cb) => {
      try {
        const twitchConnection = profile.connections?.find(
          (connection) => connection.type === 'twitch',
        );
        const discordId = profile.id;
        const discordTag = `${profile.username}#${profile.discriminator}`;
        const user = await prisma.user.upsert({
          create: {
            discordId,
            profileUrl: profile.avatar,
            discordTag,
            twitchName: twitchConnection?.name,
            twitchDisplayName: twitchConnection?.name,
          },
          update: {},
          where: {
            discordId,
          },
        });
        cb(null, user);
        return;
      } catch (error: unknown) {
        cb(error as Error, undefined);
      }
    },
  ),
);

const prisma = new PrismaClient();

const app = new App();
const api = new App();
const isProd = process.env['NODE_ENV'] === 'production';
const validator = new Validator();

async function main() {
  // Bot config
  const discordToken = process.env['DISCORD_TOKEN'];

  if (!discordToken) {
    throw new Error('Must supply discord bot token');
  }

  const discordClient = new Client({
    classes: [AppDiscord],
    silent: false,
    variablesChar: ':',
  });

  const {onGuildCreate, onReady, onGuildDelete, onChannelDelete} = getDiscordHandlers(prisma, discordClient);
  discordClient.on('guildCreate', onGuildCreate);
  discordClient.on('ready', onReady);
  discordClient.on('guildDelete', onGuildDelete);
  discordClient.on('channelDelete', onChannelDelete);

  await discordClient.login(discordToken);

  const session = cookieSession({
    name: 'contest_buddy',
    secret: process.env['SECRET_COOKIE_PASSWORD']!,
    secure: process.env['NODE_ENV'] === 'production',
  });

  // Frontend and API endpoint config.
  api
    .use(async (request, response, next) => {
      if (
        request.headers['content-type'] === 'application/json' &&
        request.body
      ) {
        await json()(request, response, next);
      } else {
        next();
      }
    })
    .all('/unauthorized', (_request, response) => {
      response.status(401).send({status: 401, errors: ['Unauthorized']});
    })
    .use('/servers', serversApi(prisma, discordClient, validator));

  app
    .use(helmet())
    .use(logger())
    .use(cors())
    .use(session as any)
    .use(passport.initialize() as any)
    .use(passport.session())
    .get('/auth', passport.authenticate('discord', {permissions: 16} as any))
    .get(
      '/auth/callback',
      passport.authenticate('discord', {failureRedirect: '/'}),
      (_request, response) => {
        response.redirect('http://localhost:3000/');
      },
    )
    .use('/api', api);

  if (isProd) {
    app.use(sirv(path.resolve(dirname, '../../client/dist')));
  }

  app.listen(4000);
}

main().finally(async () => await prisma.$disconnect());
