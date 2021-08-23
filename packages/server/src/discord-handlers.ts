import type {PrismaClient} from '@prisma/client';
import type {Channel, Client as DiscordClient, Guild} from 'discord.js';
import {zip} from './utils';

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

function getHandlers(prisma: PrismaClient, discordClient: DiscordClient) {
  return {
    async onGuildCreate(guild: Guild) {
      const {id: discordId} = guild;
      const categoryId = await createCategory(guild, 'contests');
      await prisma.server.create({
        data: {
          discordId,
          categoryId,
        },
      });
      console.debug(`Guild ${guild.name} created`);
    },

    async onReady() {
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
    },
    async onGuildDelete(guild: Guild) {
      try {
        await prisma.server.delete({where: {discordId: guild.id}});
        console.debug(`Guild ${guild.name} deleted`);
      } catch {}
    },
    async onChannelDelete(channel: Channel) {
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
    }
  }
}

export default getHandlers;
