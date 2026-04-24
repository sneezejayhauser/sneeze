import { z } from "zod";

const DiscordGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.boolean().optional(),
  permissions: z.string(),
  icon: z.string().nullable().optional(),
});

export type DiscordGuild = z.infer<typeof DiscordGuildSchema>;

const MANAGE_GUILD = BigInt(1) << BigInt(5);
const ADMINISTRATOR = BigInt(1) << BigInt(3);

export function canManageGuild(guild: DiscordGuild): boolean {
  const permissions = BigInt(guild.permissions);
  return Boolean(guild.owner) || (permissions & MANAGE_GUILD) === MANAGE_GUILD || (permissions & ADMINISTRATOR) === ADMINISTRATOR;
}

export function parseGuilds(input: unknown): DiscordGuild[] {
  return z.array(DiscordGuildSchema).parse(input);
}
