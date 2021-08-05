import 'reflect-metadata';
import path from 'node:path';
import {App} from '@tinyhttp/app';
import {logger} from '@tinyhttp/logger';
import {cors} from '@tinyhttp/cors';
import {json} from 'milliparsec';
import prisma_pkg from '@prisma/client';
import type {User} from '@prisma/client';
import {dirname as getDirname} from 'dirname-filename-esm';
import sirv from 'sirv';
import helmet from 'helmet';

const {PrismaClient} = prisma_pkg;
const dirname = getDirname(import.meta);
const prisma = new PrismaClient();

const app = new App({settings: {networkExtensions: true}});
const api = new App({settings: {networkExtensions: true}});
const isProd = process.env['NODE_ENV'] === 'production';

const MAX_API_RETURNS = 50;

async function main() {
  api
    .use(helmet())
    .use(cors())
    .use(json())
    .get('/users', async (request, response) => {
      const userIds = request.query['id'];
      const contestId = request.query['contest_id']?.[0];
      let users: User[] = [];
      if (userIds) {
        users = await prisma.user.findMany({
          where: {
            id: {in: userIds}
          },
          take: MAX_API_RETURNS
        });
      } else if (contestId) {
        users = await prisma.user.findMany({
          where: {
            contests: {
              some: {contestId: contestId}
            }
          }
        })
      }
      response.json(users).end();
    });

  app
    .use(helmet())
    .use(logger())
    .use(cors())
    .use('/api', api);

  if (isProd) {
    app.use(sirv(path.resolve(dirname, '../../client/dist')));
  }

  app.listen(4000);
}

main().finally(async () => prisma.$disconnect());
