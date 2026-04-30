export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
}

export interface DiscordDMChannel {
  id: string;
  type: number;
  last_message_id: string | null;
  recipients: DiscordUser[];
}

export interface DiscordMessage {
  id: string;
  channel_id: string;
  author: DiscordUser;
  content: string;
  timestamp: string;
  type: number;
  guild_id?: string;
  member?: Record<string, unknown>;
}

export interface DiscordChannelWithRecipient extends DiscordDMChannel {
  recipient: DiscordUser;
}

export interface StoredToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}