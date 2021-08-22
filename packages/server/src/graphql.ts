import type {ServerResponse as Response} from 'node:http';
import type {NextFunction} from '@tinyhttp/app';
import {ReqWithBody, text, json} from 'milliparsec';

// Stolen from `https://github.com/graphql-middleware/body-parser-graphql/blob/c4498668882c6318280dee960e1b3e0dde2571b6/src/index.ts`.
const graphql =
  () =>
  async (
    request: ReqWithBody,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (request.headers['content-type'] === 'application/graphql') {
      await text()(request, response, () => {
        request.headers['content-type'] = 'application/json';
        request.body = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          query: request.body,
        };
        next();
      });
    } else {
      await json()(request, response, next);
    }
  };

export default graphql;
