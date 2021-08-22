// eslint-disable-next-line import/no-unassigned-import
import 'reflect-metadata';
import path from 'node:path';
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
import {AppDiscord} from './discords/app-discord';
import Conf from 'conf';
import {ironSession} from 'next-iron-session';
import type {Session} from 'next-iron-session';
import type {GuildChannel} from 'discord.js';

declare module '@tinyhttp/app' {
  export interface Request {
    session: Session;
  }
}

const {PrismaClient} = prisma_pkg;

const dirname = getDirname(import.meta);
const dotenvResult = dotenv.config({
  path: path.resolve(dirname, '../.env.local')
});

if (dotenvResult.error) {
  throw dotenvResult.error;
}

const prisma = new PrismaClient();

const config = new Conf<Record<string, string>>({cwd: path.resolve(dirname, '..')})
const app = new App({settings: {networkExtensions: true}});
const api = new App({settings: {networkExtensions: true}});
const isProd = process.env['NODE_ENV'] === 'production';
const validator = new Validator();

const checkContest = validator.compile({
  name: 'string',
  description: {type: 'string', optional: true},
  isOpen: {type: 'boolean', optional: true, default: true},
  picturesOnly: {type: 'boolean', optional: true, default: false},
  maxSubmissions: 'number',
  participantIds: {type: 'array', items: 'string', optional: true, default: []}
});

const MAX_API_RETURNS = 50;

async function main() {
  // Bot config
  const discordToken = process.env['DISCORD_TOKEN'];
  const discordGuildId = process.env['DISCORD_GUILD_ID'];
  const discordCategoryName = process.env['DISCORD_CATEGORY_NAME'];

  if (!discordToken || !discordGuildId || !discordCategoryName) {
    throw new Error('Must supply discord bot token, guild ID and category name');
  }

  const discordClient = new Client({
    classes: [AppDiscord],
    silent: false,
    variablesChar: ':'
  });

  await discordClient.login(discordToken);

  let discordGuild = discordClient.guilds.resolve(discordGuildId);

  if (!discordGuild) {
    throw new Error(`Can't find server with id ${discordGuildId}`);
  }

  // HACK: this feels a bit kludgy.
  let discordCategory: GuildChannel | null;
  let discordCategoryId: string | null = config.get('discordCategoryId');
  if (discordCategoryId) {
    discordCategory = discordGuild.channels.resolve(discordCategoryId);
  } else {
    console.debug(`Creating category ${discordCategoryName}`)
    discordCategory = await discordGuild.channels.create(discordCategoryName, {type: 'category'});
    config.set('discordCategoryId', discordCategory.id);
    discordCategoryId = discordCategory.id;
  }

  const session = ironSession({
    cookieName: 'contest_buddy',
    password: process.env['SECRET_COOKIE_PASSWORD']!,
    cookieOptions: {
      secure: process.env['NODE_ENV'] === 'production'
    }
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
    .get('/users', async (request, response) => {
      const userIds = request.query['id'];
      const contestId = request.query['contest_id']?.[0];
      if (userIds) {
        const users = await prisma.user.findMany({
          where: {
            id: {in: userIds}
          },
          take: MAX_API_RETURNS
        });
        response.status(200).send(users);
      } else if (contestId) {
        const users = await prisma.user.findMany({
          where: {
            contests: {
              some: {contestId}
            }
          },
          take: MAX_API_RETURNS
        });
        response.status(200).send(users);
      } else {
        response.status(422).send({
          status: 422,
          message: 'Must specify at least 1 user ID or exactly 1 contest ID'
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
            id: {in: contestIds}
          },
          include: {
            participants: {
              select: {userId: true}
            }
          },
          take: MAX_API_RETURNS
        });
        response.status(200).send(contests);
      } else if (userId) {
        const contests = await prisma.contest.findMany({
          where: {
            participants: {
              some: {userId}
            }
          },
          take: MAX_API_RETURNS
        });
        response.status(200).send(contests);
      } else {
        const contests = await prisma.contest.findMany({
          take: MAX_API_RETURNS
        });
        response.status(200).send(contests);
      }

      response.end();
    })
    .post('/contests', async (request, response) => {
      if (request.session.get('user')) {
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
            user: {connect: {id}}
          }));
          const contest = await prisma.contest.create({
            data: {
              name,
              description,
              isOpen,
              picturesOnly,
              maxSubmissions,
              participants: {
                create: users
              }
            }
          });

          // HACK: IDK how I feel about this.
          if (discordCategory) {
            discordGuild?.channels.create(contest.name, {parent: discordCategory})
          }

          response.status(200).send(contest);
        } else {
          response.status(422).send({status: 422, errors: validOrError});
        }
      } else {
        response.redirect('/api/unauthorized');
      }

      response.end();
    })
    .all('/unauthorized', (_request, response) => {
      response.status(401).send({status: 401, errors: ['Unauthorized']})
    });

  app
    .use(helmet())
    .use(logger())
    .use(cors())
    .use(session)
    .use('/api', api);

  if (isProd) {
    app.use(sirv(path.resolve(dirname, '../../client/dist')));
  }

  app.listen(4000);
}

main().finally(async () => void await prisma.$disconnect());
