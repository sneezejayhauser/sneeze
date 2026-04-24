# sneeze

Unified Next.js application for `cjhauser.me` plus the public Discord bot platform dashboard at `nb.cjhauser.me`.

## Bot platform highlights

- Multi-guild architecture (no single-server assumptions)
- SQLite-backed persistent guild state
- Discord OAuth dashboard auth for eligible guild managers
- Shared data model across bot interaction endpoints and dashboard APIs
- Preset-driven idempotent setup flow (`community`, `moderation`, `economy`, `social`, `custom`)

See `docs/bot-platform.md` for architecture details.

## Development

```bash
npm install
npm run dev
```

### Required environment for bot/dashboard

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `DISCORD_PUBLIC_KEY`
- `NB_DASHBOARD_SESSION_SECRET`
- `BOT_SQLITE_PATH` (optional, defaults to `./data/bot.sqlite`)

The dashboard APIs are under `app/api/nb/*` and Discord interaction endpoint is `app/api/discord/interactions`.
