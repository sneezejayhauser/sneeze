# Signal News – Vercel Setup Guide

This guide covers everything you need to do to get `news.cjhauser.me` live on your existing Vercel deployment of the `sneeze` repo.

---

## 1. Run the Supabase Schema

Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/xsbcsorbeganuzyqzesh/sql) and run the contents of:

```
supabase/news-schema.sql
```

This creates two tables (`news_articles`, `news_subscribers`) with RLS, indexes, and seed data.

---

## 2. Add Environment Variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add the following:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xsbcsorbeganuzyqzesh.supabase.co` | Already set if chat was configured. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | *(anon key)* | Already set if chat was configured. |
| `SUPABASE_SERVICE_ROLE_KEY` | *(service role key)* | **Server-side only.** Never expose to clients. |
| `NEWS_ADMIN_PASSWORD` | `<YOUR_STRONG_PASSWORD>` | Password for the Signal admin panel. Must be set to a strong, unique value. |

> **Note:** `SUPABASE_SERVICE_ROLE_KEY` and `NEWS_ADMIN_PASSWORD` must **not** be prefixed with `NEXT_PUBLIC_` — they are server-side only.

The anon and service role keys are in your Supabase project at:
**Project Settings → API → Project API keys**

---

## 3. Add the Vercel Domain

In Vercel → **Settings → Domains**, add:

```
news.cjhauser.me
```

---

## 4. Add DNS CNAME

In your DNS provider (wherever `cjhauser.me` is managed), add:

| Type | Name | Value |
|---|---|---|
| CNAME | `news` | `cname.vercel-dns.com` |

Allow up to a few minutes for propagation.

---

## 5. Deploy

Push (or trigger a redeploy) from the Vercel dashboard. The new `app/news/` route will be served automatically at `news.cjhauser.me`.

---

## How It Works

- **Articles** are read from Supabase (`news_articles` table) via the anon key. RLS allows public reads.
- **Publishing / deleting** articles goes through `/api/news/articles` which verifies `NEWS_ADMIN_PASSWORD` server-side, then uses the service role key to write to Supabase.
- **Email subscriptions** go through `/api/news/subscribe` which uses the service role key to write to `news_subscribers`. Duplicate emails are handled gracefully.
- **Dark mode** is still stored in `localStorage` (intentional).
- **Admin panel** is accessible at `news.cjhauser.me/#admin` with the password configured in `NEWS_ADMIN_PASSWORD`.

---

## Changing the Admin Password

1. Update `NEWS_ADMIN_PASSWORD` in Vercel environment variables.
2. Redeploy.

The password is verified server-side only through the `/api/news/admin/verify` endpoint, so only the environment variable needs to be updated.

---

## Optional: Clean Up Unused Dependencies

The chat app and Discord bot have been removed. You can optionally run:

```bash
npm uninstall @e2b/code-interpreter better-sqlite3 discord-api-types discord-interactions gray-matter react-markdown react-syntax-highlighter remark-gfm
npm uninstall --save-dev @types/better-sqlite3 @types/react-syntax-highlighter
```

These are already removed from `package.json`; running the above cleans up `node_modules` and `package-lock.json` locally.
