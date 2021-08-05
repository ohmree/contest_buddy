import type {NextFunction} from '@tinyhttp/app';
import {ReqWithBody, text, json} from 'milliparsec';
import type {ServerResponse as Response} from 'http';

// Stolen from `https://github.com/graphql-middleware/body-parser-graphql/blob/c4498668882c6318280dee960e1b3e0dde2571b6/src/index.ts`.
const graphql = () => async (req: ReqWithBody, res: Response, next: NextFunction): Promise<void> => {
  if (req.headers['content-type'] === 'application/graphql') {
    text()(req, res, () => {
      req.headers['content-type'] = 'application/json';
      req.body = {
        query: req.body
      };
      next();
    })
  } else {
    json()(req, res, next);
  }
}

export default graphql;
