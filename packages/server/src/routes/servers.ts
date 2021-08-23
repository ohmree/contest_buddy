import {App} from '@tinyhttp/app';
import type {PrismaClient} from '@prisma/client';
import type {Client as DiscordClient} from '@typeit/discord';
import {MAX_API_RETURNS} from '~/src/constants';
import Validator from 'fastest-validator';

function serversApi(prisma: PrismaClient, discordClient: DiscordClient, validator: Validator): App {
  const checkContest = validator.compile({
    name: 'string',
    description: {type: 'string', optional: true},
    isOpen: {type: 'boolean', optional: true, default: true},
    picturesOnly: {type: 'boolean', optional: true, default: false},
    maxSubmissions: 'number',
    participantIds: {type: 'array', items: 'string', optional: true, default: []},
  });

  return new App()
    .use('*', (request, response, next) => {
      if (request.user) {
        next();
      } else {
        response.status(401).send({ status: 401, message: 'Unauthorized' }).end();
      }
    })
    .get('/', async (request, response) => {
      const userId = request?.user?.discordId;
      const guilds = discordClient.guilds.cache
        .array()
        .filter((guild) => guild.ownerID === userId)
        .map(async (guild) => {
          const { id: discordId, name, icon } = guild;
          const id = await prisma.server.findUnique({
            where: { discordId },
            select: { id: true },
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
        where: { id: request.params['serverId'] },
      });
      if (server) {
        response.status(200).send(server);
      } else {
        response.status(404).send({ status: 404, message: 'Server not found' });
      }

      response.end();
    })
    .get('/users', async (request, response) => {
      const userIds = request.query['id'];
      const contestId = request.query['contest_id']?.[0];
      if (userIds) {
        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds },
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
              some: { contestId },
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
            id: { in: contestIds },
            serverId: request.params['serverId'],
          },
          include: {
            participants: {
              select: { userId: true },
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

      response.end();
    });
}

export default serversApi;
