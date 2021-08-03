import path from 'node:path';
import {App} from '@tinyhttp/app';
import {logger} from '@tinyhttp/logger';
import {cors} from '@tinyhttp/cors';
import {json} from 'milliparsec';
import prisma_pkg from '@prisma/client';
import {dirname as getDirname} from 'dirname-filename-esm';
import sirv from 'sirv';

const {PrismaClient} = prisma_pkg;
const dirname = getDirname(import.meta);
const prisma = new PrismaClient();

const app = new App({settings: {networkExtensions: true}});
const api = new App({settings: {networkExtensions: true}});
const isProd = process.env['NODE_ENV'] === 'production';

async function main() {
  api
    .use(cors())
    .use(json())
    .get('/users', async (_request, response) => {
      const users = await prisma.user.findMany();
      response.status(200).json(users).end();
    })
    .get('/users/:id', async (request, response) => {
      const user = await prisma.user.findUnique({
        where: {id: request.params['id']}
      });
      if (user) {
        response.status(200).json(user).end();
      } else {
        response.status(404).json({message: 'User not found'}).end();
      }
    });

  app.use(logger()).use('/api', api);

  if (isProd) {
    app.use(sirv(path.resolve(dirname, '../../client/dist')));
  }

  app.use(cors()).listen(4000);
}

main().finally(async () => prisma.$disconnect());
