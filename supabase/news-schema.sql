-- Signal Newsletter Schema for news.cjhauser.me
-- Run this in the Supabase SQL Editor at: https://supabase.com/dashboard/project/xsbcsorbeganuzyqzesh/sql

-- ─────────────────────────────────────────────────────────────────────────────
-- news_articles table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news_articles (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'Essay',
  date         TEXT NOT NULL,
  excerpt      TEXT NOT NULL,
  body         TEXT NOT NULL,
  author       TEXT NOT NULL DEFAULT 'Editorial Team',
  read_time    TEXT NOT NULL DEFAULT '5 min',
  tags         TEXT[] NOT NULL DEFAULT '{}',
  related_ids  UUID[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- news_subscribers table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news_subscribers (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  subscribed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at  TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at  ON public.news_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_subscribers_email    ON public.news_subscribers(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.news_articles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_subscribers ENABLE ROW LEVEL SECURITY;

-- Articles: public read, no client-side writes (writes go through service role via API)
CREATE POLICY "Anyone can read articles"
  ON public.news_articles FOR SELECT
  USING (true);

-- Subscribers: no client-side access (all writes go through service role via API)
-- (No policies needed; service role bypasses RLS)

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-update updated_at on news_articles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.news_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS news_articles_updated_at ON public.news_articles;
CREATE TRIGGER news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.news_update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed data (optional – matches the original hardcoded articles)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.news_articles (title, category, date, excerpt, author, read_time, tags, body)
VALUES
  (
    'When Good Things End',
    'Essay',
    'April 24, 2026',
    'A meditation on transitions, leadership changes, and what it means to let go.',
    'Editorial Team',
    '5 min',
    ARRAY['leadership', 'growth'],
    'A meditation on transitions, leadership changes, and what it means to let go. Sometimes the best thing we can do is make space for what comes next.

Leadership transitions are never easy. When Kayaan Narayan stepped down on April 24th, it marked more than just an organizational shift—it represented a moment of clarity about what truly matters.

In our culture, we often celebrate beginnings. We champion the bold founder, the visionary launch. But transitions? Endings? Those get less airtime. Yet they might be where the real wisdom lives.

Consider what it takes to step away. To let go of something you''ve built. To trust that the next chapter—even if you won''t write it—matters just as much.

That''s the kind of leadership that builds lasting institutions. Not the kind that hoards power, but the kind that knows when to pass the torch.

This week, we''re reflecting on what comes next. And we''re doing it differently than we''ve done anything before.'
  ),
  (
    'Why We Built This Ad-Free',
    'Philosophy',
    'April 20, 2026',
    'No algorithms. No sponsored content. No compromise.',
    'Editorial Team',
    '6 min',
    ARRAY['independence', 'journalism'],
    'No algorithms. No sponsored content. No compromise. Just thoughtful writing from people who actually care.

The internet isn''t free. Someone always pays. If you''re not paying with money, you''re paying with attention, data, and ultimately, your autonomy.

We chose a different path. Signal is completely free to read, but reader-supported. Every subscription, every donation, every coffee you buy us keeps us independent.

Independence matters. When your only stakeholder is your reader, you can write what you actually think. You can take risks. You can fail publicly and learn.

That''s the kind of journalism we want to build. That''s the kind of voice we want to become.'
  ),
  (
    'The Student Newsletter Boom',
    'Culture',
    'April 15, 2026',
    'More teenagers are starting newsletters. Here''s why this matters.',
    'Editorial Team',
    '4 min',
    ARRAY['media', 'culture'],
    'More teenagers are starting newsletters. Here''s why this movement actually matters.

There''s a renaissance happening in student media. Young people are rejecting the algorithmic feed, the infinity scroll, the engagement bait. They''re starting newsletters instead.

Why? Because newsletters demand something algorithms never will: genuine thought.

When you write for a newsletter, you''re writing for people who chose to listen. Not people who were algorithmically served your content. Not people whose attention you''re competing for with a thousand other creators.

This shift—from broadcast to direct—is reshaping how an entire generation thinks about communication. And we''re here for it.'
  ),
  (
    'Start Your Own Newsletter',
    'Guide',
    'April 12, 2026',
    'A practical guide to launching something that''s genuinely yours.',
    'Editorial Team',
    '8 min',
    ARRAY['tutorial', 'creator'],
    'A practical guide to launching something that''s genuinely yours. It''s easier than you think.

You have something worth sharing. Maybe it''s your perspective on current events. Maybe it''s your thoughts on a niche community. Maybe it''s just your voice.

The barrier to entry is lower than ever. Here''s what you need to know.'
  ),
  (
    'The Cost of Independence',
    'Analysis',
    'April 10, 2026',
    'Why reader-supported media is the future (and why it needs your help).',
    'Editorial Team',
    '7 min',
    ARRAY['media', 'sustainability'],
    'Why reader-supported media is the future (and why it needs your help).

The economics of media are changing. Advertising-supported models are collapsing. Engagement metrics reward sensationalism. The incentives are all wrong.

Reader-supported models align incentives properly. Your success is our success. There''s no tension between what readers want and what we publish.

But reader-supported media can only work if readers support it. If you value independent journalism, that means putting your money where your mouth is.'
  )
ON CONFLICT DO NOTHING;
