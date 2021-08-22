// eslint-disable-next-line import/no-unassigned-import
import 'reflect-metadata';
// eslint-disable-next-line import/no-unassigned-import
import _shims from '../shims';
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
import Validator from 'fastest-validator';
import cookieSession from 'cookie-session';
import passport from 'passport';
import {Strategy as DiscordStrategy} from 'passport-discord';
import {Guild} from 'discord.js';
import {AppDiscord} from './discords/app-discord';
import {zip} from './utils';

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

async function createCategory(
  guild: Guild,
  categoryName: string,
): Promise<string> {
  console.debug(`Creating category ${categoryName} in server ${guild.name}`);
  const {id: categoryId} = await guild.channels.create(categoryName, {
    type: 'category',
  });
  return categoryId;
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
const serversApi = new App();
const isProd = process.env['NODE_ENV'] === 'production';
const validator = new Validator();

const checkContest = validator.compile({
  name: 'string',
  description: {type: 'string', optional: true},
  isOpen: {type: 'boolean', optional: true, default: true},
  picturesOnly: {type: 'boolean', optional: true, default: false},
  maxSubmissions: 'number',
  participantIds: {type: 'array', items: 'string', optional: true, default: []},
});

const MAX_API_RETURNS = 50;

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

  discordClient.on('guildCreate', async (guild) => {
    console.debug(`Guild ${guild.name} created`);
    const {id: discordId} = guild;
    const categoryId = await createCategory(guild, 'contests');
    await prisma.server.create({
      data: {
        discordId,
        categoryId,
      },
    });
  });

  discordClient.on('ready', async () => {
    let categoryIds = [];
    const serverIds = [];
    for (const {
      id,
      categoryId,
      categoryName,
      discordId,
    } of await prisma.server.findMany({
      select: {
        id: true,
        categoryId: true,
        categoryName: true,
        discordId: true,
      },
    })) {
      const guild = discordClient.guilds.resolve(discordId);
      const category = guild?.channels.resolve(categoryId ?? '');
      if (guild && !category) {
        categoryIds.push(createCategory(guild, categoryName));
        serverIds.push(id);
      }
    }

    categoryIds = await Promise.all(categoryIds);
    const servers = [];
    for (const [categoryId, serverId] of zip(categoryIds, serverIds)) {
      servers.push(
        prisma.server.update({
          where: {
            id: serverId,
          },
          data: {categoryId},
        }),
      );
    }

    void (await Promise.all(servers));
  });

  discordClient.on('guildDelete', async (guild) => {
    console.debug(`Guild ${guild.name} deleted`);
    try {
      await prisma.server.delete({where: {discordId: guild.id}});
    } catch {}
  });

  discordClient.on('channelDelete', async (channel) => {
    if (channel.type === 'category') {
      // Channel IDs are guaranteed to be unique:
      // https://www.reddit.com/r/discordapp/comments/6vm67d/are_channel_ids_universally_unique/
      const server = await prisma.server.findFirst({
        select: {id: true, discordId: true, categoryName: true},
        where: {categoryId: channel.id},
      });
      if (server) {
        const guild = discordClient.guilds.resolve(server.discordId);
        if (guild) {
          const categoryId = await createCategory(guild, server.categoryName);
          await prisma.server.update({
            where: {id: server.id},
            data: {categoryId},
          });
        }
      }
    }
  });

  await discordClient.login(discordToken);

  const session = cookieSession({
    name: 'contest_buddy',
    secret: process.env['SECRET_COOKIE_PASSWORD']!,
    secure: process.env['NODE_ENV'] === 'production',
  });

  // Frontend and API endpoint config.
  serversApi
    .use('*', (request, response, next) => {
      if (request.user) {
        next();
      } else {
        response.status(401).send({status: 401, message: 'Unauthorized'}).end();
      }
    })
    .get('/', async (request, response) => {
      const userId = request?.user?.discordId;
      const guilds = discordClient.guilds.cache
        .array()
        .filter((guild) => guild.ownerID === userId)
        .map(async (guild) => {
          const {id: discordId, name, icon} = guild;
          const id = await prisma.server.findUnique({
            where: {discordId},
            select: {id: true},
          });
          return {
            id,
            discordId,
            name,
            icon,
          };
        });
      response.status(200).send(guilds).end();
    })
    .get('/:serverId', async (request, response) => {
      const server = await prisma.server.findUnique({
        where: {id: request.params['serverId']},
      });
      if (server) {
        response.status(200).send(server);
      } else {
        response.status(404).send({status: 404, message: 'Server not found'});
      }

      response.end();
    })
    .get('/users', async (request, response) => {
      const userIds = request.query['id'];
      const contestId = request.query['contest_id']?.[0];
      if (userIds) {
        const users = await prisma.user.findMany({
          where: {
            id: {in: userIds},
            servers: {
              some: {
                serverId: request.params['serverId'],
              },
            },
          },
          take: MAX_API_RETURNS,
        });
        response.status(200).send(users);
      } else if (contestId) {
        const users = await prisma.user.findMany({
          where: {
            contests: {
              some: {contestId},
            },
          },
          take: MAX_API_RETURNS,
        });
        response.status(200).send(users);
      } else {
        response.status(422).send({
          status: 422,
          message: 'Must specify at least 1 user ID or exactly 1 contest ID',
        });
      }

      response.end();
    })
    .get('/contests', async (request, response) => {
      const contestIds = request.query['id'];
      const userId = request.query['user_id']?.[0];
      if (contestIds) {
        const contests = await prisma.contest.findMany({
          where: {
            id: {in: contestIds},
            serverId: request.params['serverId'],
          },
          include: {
            participants: {
              select: {userId: true},
            },
          },
          take: MAX_API_RETURNS,
        });
        response.status(200).send(contests);
      } else if (userId) {
        const contests = await prisma.contest.findMany({
          where: {
            participants: {
              some: {userId},
            },
          },
          take: MAX_API_RETURNS,
        });
        response.status(200).send(contests);
      } else {
        const contests = await prisma.contest.findMany({
          take: MAX_API_RETURNS,
        });
        response.status(200).send(contests);
      }

      response.end();
    })
    .post('/contests', async (request, response) => {
      if (request?.session?.user) {
        const body: Record<string, any> =
          (request.body as Record<string, any>) ?? {};
        const validOrError = checkContest(body);

        if (validOrError === true) {
          const name = body['name'] as string;
          const description = body['description'] as string;
          const isOpen = body['isOpen'] as boolean;
          const picturesOnly = body['picturesOnly'] as boolean;
          const maxSubmissions = body['maxSubmissions'] as number;

          const participantIds: [string] = body['participantIds'] as [string];
          const users = participantIds.map((id: string) => ({
            user: {connect: {id}},
          }));
          const contest = await prisma.contest.create({
            data: {
              name,
              description,
              isOpen,
              picturesOnly,
              maxSubmissions,
              participants: {
                create: users,
              },
              server: {
                connect: {
                  id: request.params['serverId'],
                },
              },
            },
          });

          response.status(200).send(contest);
        } else {
          response.status(422).send({status: 422, errors: validOrError});
        }
      } else {
        response.redirect('/api/unauthorized');
      }

      response.end();
    });

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
    .use('/servers', serversApi);

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

main().finally(async () => prisma.$disconnect());
