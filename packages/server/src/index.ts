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

const {PrismaClient} = prisma_pkg;

const dirname = getDirname(import.meta);
const dotenvResult = dotenv.config({
  path: path.resolve(dirname, '../.env.local')
});

if (dotenvResult.error) {
  throw dotenvResult.error;
}

const prisma = new PrismaClient();

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
  const discordClient = new Client({
    classes: [AppDiscord],
    silent: false,
    variablesChar: ':'
  });

  if (!discordToken) {
    throw new Error('Must supply discord bot token');
  }

  await discordClient.login(discordToken);

  // Frontend and API endpoint config.
  api
    .use(helmet())
    .use(cors())
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
        response.status(200).json(users);
      } else if (contestId) {
        const users = await prisma.user.findMany({
          where: {
            contests: {
              some: {contestId}
            }
          },
          take: MAX_API_RETURNS
        });
        response.status(200).json(users);
      } else {
        response.status(422).json({
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
        response.status(200).json(contests);
      } else if (userId) {
        const contests = await prisma.contest.findMany({
          where: {
            participants: {
              some: {userId}
            }
          },
          take: MAX_API_RETURNS
        });
        response.status(200).json(contests);
      } else {
        const contests = await prisma.contest.findMany({
          take: MAX_API_RETURNS
        });
        response.status(200).json(contests);
      }

      response.end();
    })
    .post('/contests', async (request, response) => {
      console.debug('here');
      const body: Record<string, any> =
        (request.body as Record<string, any>) ?? {};
      const validOrError = checkContest(body);

      const name = body['name'] as string;
      const description = body['description'] as string;
      const isOpen = body['isOpen'] as boolean;
      const picturesOnly = body['picturesOnly'] as boolean;
      const maxSubmissions = body['maxSubmissions'] as number;

      if (validOrError === true) {
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
        response.status(200).json(contest);
      } else {
        response.status(422).json({status: 422, errors: validOrError});
      }

      response.end();
    });

  app.use(helmet()).use(logger()).use(cors()).use('/api', api);

  if (isProd) {
    app.use(sirv(path.resolve(dirname, '../../client/dist')));
  }

  app.listen(4000);
}

main().finally(async () => prisma.$disconnect());
