import {
  Discord,
  Command,
  CommandMessage,
  CommandNotFound
} from '@typeit/discord';

// Specify your prefix
@Discord('!')
abstract class AppDiscord {
  // Reachable with the command: !ping
  @Command('ping')
  private async ping(message: CommandMessage) {
    await message.reply('pong');
  }

  @CommandNotFound()
  private async notFound(message: CommandMessage) {
    await message.reply('wat');
  }
}

void AppDiscord;
