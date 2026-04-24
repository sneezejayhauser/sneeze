import { getBotDb } from "@/lib/bot/db/client";

const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    name TEXT,
    preset TEXT NOT NULL DEFAULT 'custom',
    setup_completed_at TEXT,
    setup_version INTEGER NOT NULL DEFAULT 1,
    leveling_enabled INTEGER NOT NULL DEFAULT 1,
    leveling_multiplier REAL NOT NULL DEFAULT 1,
    economy_enabled INTEGER NOT NULL DEFAULT 1,
    profiles_enabled INTEGER NOT NULL DEFAULT 1,
    mod_log_channel_id TEXT,
    announcement_channel_id TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS guild_admins (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    can_manage INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings(guild_id, user_id);

  CREATE TABLE IF NOT EXISTS xp (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS economy (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    coins INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS profiles (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    bio TEXT,
    favorite_things TEXT,
    avatar_url TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS reaction_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    role_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id, message_id, emoji)
  );

  CREATE TABLE IF NOT EXISTS custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    response TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id, name)
  );

  CREATE TABLE IF NOT EXISTS setup_steps (
    guild_id TEXT NOT NULL,
    preset TEXT NOT NULL,
    step_key TEXT NOT NULL,
    resource_id TEXT,
    completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(guild_id, preset, step_key)
  );
  `,
];

let migrated = false;

export function ensureBotMigrations() {
  if (migrated) return;
  const db = getBotDb();
  db.exec("CREATE TABLE IF NOT EXISTS _bot_migrations (id INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");

  MIGRATIONS.forEach((sql, idx) => {
    const id = idx + 1;
    const exists = db.prepare("SELECT id FROM _bot_migrations WHERE id = ?").get(id);
    if (!exists) {
      db.exec(sql);
      db.prepare("INSERT INTO _bot_migrations (id) VALUES (?)").run(id);
    }
  });

  migrated = true;
}
