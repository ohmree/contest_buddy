import {
  Discord,
  Command,
  CommandMessage,
  CommandNotFound,
  On,
} from '@typeit/discord';
import type {ArgsOf} from '@typeit/discord';

// Specify your prefix
@Discord('=')
export abstract class AppDiscord {
  @On('guildCreate')
  async onGuildCreate([guild]: ArgsOf<'guildCreate'>) {
    console.debug(`Guild ${guild.name} created`);
  }
    // Reachable with the command: !ping
  @Command('ping')
  async ping(message: CommandMessage) {
    await message.reply('pong')
  }

  @CommandNotFound()
  async notFound(message: CommandMessage) {
    await message.reply('wat');
  }
}
