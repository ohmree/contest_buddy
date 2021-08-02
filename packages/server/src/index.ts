import fs from 'node:fs';
import path from 'node:path';
import {App} from '@tinyhttp/app';
import {logger} from '@tinyhttp/logger';
import {json} from 'milliparsec';
import {PrismaClient} from '@prisma/client';
import clientViteConfig from 'client/vite.config';
import {createServer as createViteServer} from 'vite';
import sirv from 'sirv';

const prisma = new PrismaClient();
const app = new App();
const api = new App();
const isProd = process.env['NODE_ENV'] === 'production';

(async () => {
  api
    .use(json())
    .get('/users', async (_request, response) =>
      response.status(200).json(await prisma.user.findMany())
    );

  app.use(logger()).use('/api', api);

  if (isProd) {
    app.use(sirv(path.resolve(__dirname, '../client')));
  } else {
    const viteServer = await createViteServer({
      server: {
        middlewareMode: 'ssr',
        cors: true,
        hmr: true
      },
      ...clientViteConfig
    });
    console.log(viteServer.config.server);
    app.use(viteServer.middlewares);
    app.use('*', async (request, response) => {
      const url = request.originalUrl;
      try {
        const template = fs.readFileSync(
          path.resolve(__dirname, '../../client/index.html'),
          'utf-8'
        );
        const appHtml = await viteServer.transformIndexHtml(url, template);
        response.status(200).set({'Content-Type': 'text/html'}).end(appHtml);
      } catch (error: unknown) {
        viteServer.ssrFixStacktrace(error as Error);
        console.error(error);
        response.status(500).end((error as Error).message);
      }
    });
  }

  app.listen(3000);
})();
