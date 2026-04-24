# NB Bot Platform Architecture

This repository now includes a unified multi-server Discord bot + dashboard architecture intended for:

- `cjhauser.me` (main site)
- `nb.cjhauser.me` (bot platform dashboard)

## Key decisions

- **Guild isolation:** Every core system stores data with `guild_id` keys in SQLite.
- **Persistent state:** Warnings, XP, economy, profiles, setup, custom commands, and reaction role mappings persist in `data/bot.sqlite`.
- **Permission model:** Dashboard management is restricted to Discord guild owner/admin/manage-server users.
- **Safe setup:** `/setup` workflow is preset-driven and idempotent (skips existing channels/roles and records setup steps).
- **Shared model:** Bot interaction handlers and dashboard APIs read/write the same database layer.

## Directory structure

- `lib/bot/core`: command execution and registry
- `lib/bot/commands`: modular command groups
- `lib/bot/db`: SQLite client, migrations, repositories
- `lib/bot/permissions`: reusable permission checks
- `lib/bot/presets`: setup presets
- `lib/bot/services`: OAuth, Discord API, setup flow
- `app/api/discord/*`: interaction, setup, scheduled jobs endpoints
- `app/api/nb/*`: dashboard auth/session and guild management APIs
- `app/nb/*`: bot dashboard pages

## Remaining TODOs

- Wire full Discord API moderation action execution (`kick`, `ban`, `timeout`, etc.)
- Add reaction-role event consumers and giveaway/trivia/polls workflows
- Add richer dashboard editors for each subsystem
- Add scheduled job orchestration for daily posts/events via Vercel Cron
