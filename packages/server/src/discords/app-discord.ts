import {
  Discord,
  Command,
  CommandMessage,
  CommandNotFound,
} from '@typeit/discord';

// Specify your prefix
@Discord('=')
export abstract class AppDiscord {
  // Reachable with the command: !ping
  @Command('ping')
  async ping(message: CommandMessage) {
    await message.reply('pong');
  }

  @CommandNotFound()
  async notFound(message: CommandMessage) {
    await message.reply('wat');
  }
}
