export type CommandContext = {
  guildId: string;
  userId: string;
  memberPermissions?: string;
};

export type CommandResult = {
  content: string;
  ephemeral?: boolean;
};

export type BotCommand = {
  name: string;
  description: string;
  execute: (ctx: CommandContext, options: Record<string, unknown>) => Promise<CommandResult>;
};
