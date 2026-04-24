import { communityCommands, unsupportedCommandNames } from "@/lib/bot/commands/community";
import { moderationCommands } from "@/lib/bot/commands/moderation";
import { BotCommand, CommandContext } from "@/lib/bot/core/types";

const commands = [...moderationCommands, ...communityCommands];

const registry = new Map<string, BotCommand>(commands.map((command) => [command.name, command]));

export async function executeCommand(name: string, ctx: CommandContext, options: Record<string, unknown> = {}) {
  const command = registry.get(name);
  if (command) {
    return command.execute(ctx, options);
  }

  if (unsupportedCommandNames.includes(name)) {
    return {
      content:
        `/${name} is scaffolded in the multi-server architecture but still needs Discord API wiring. ` +
        "Configure related settings in the dashboard and complete the TODO implementation.",
      ephemeral: true,
    };
  }

  return { content: `Unknown command: ${name}`, ephemeral: true };
}

export function listRegisteredCommands() {
  return [...registry.keys(), ...unsupportedCommandNames];
}
