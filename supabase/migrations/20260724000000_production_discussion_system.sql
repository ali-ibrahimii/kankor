-- Migration: 20260724000000_production_discussion_system.sql
-- Production-Ready Discussion System for Abzar Kankor

-- 1. Create Enums if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discussion_thread_type') THEN
    CREATE TYPE public.discussion_thread_type AS ENUM (
      'question', 'discussion', 'tip', 'announcement', 'poll', 'report_mistake'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discussion_thread_status') THEN
    CREATE TYPE public.discussion_thread_status AS ENUM (
      'open', 'answered', 'solved', 'closed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discussion_resource_type') THEN
    CREATE TYPE public.discussion_resource_type AS ENUM (
      'course', 'lesson', 'quiz', 'deck', 'library', 'classroom', 'general'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discussion_report_reason') THEN
    CREATE TYPE public.discussion_report_reason AS ENUM (
      'spam', 'offensive', 'wrong_information', 'duplicate', 'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discussion_report_status') THEN
    CREATE TYPE public.discussion_report_status AS ENUM (
      'pending', 'reviewed', 'dismissed', 'actioned'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discussion_reaction_emoji') THEN
    CREATE TYPE public.discussion_reaction_emoji AS ENUM (
      '👍', '❤️', '😂', '😮', '🎉', '🤔'
    );
  END IF;
END $$;

-- 2. Alter existing discussion_threads table
ALTER TABLE public.discussion_threads
  ADD COLUMN IF NOT EXISTS resource_type public.discussion_resource_type NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS resource_id text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS type public.discussion_thread_type NOT NULL DEFAULT 'discussion',
  ADD COLUMN IF NOT EXISTS status public.discussion_thread_status NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_instructor_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vote_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bookmark_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscriber_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(id);

-- Safely populate resource_type and resource_id from existing course_id and lesson_id
UPDATE public.discussion_threads
SET 
  resource_type = CASE 
    WHEN lesson_id IS NOT NULL THEN 'lesson'::public.discussion_resource_type
    WHEN course_id IS NOT NULL THEN 'course'::public.discussion_resource_type
    ELSE 'general'::public.discussion_resource_type
  END,
  resource_id = CASE 
    WHEN lesson_id IS NOT NULL THEN lesson_id::text
    WHEN course_id IS NOT NULL THEN course_id::text
    ELSE 'general'
  END
WHERE resource_id = 'general' AND (lesson_id IS NOT NULL OR course_id IS NOT NULL);

-- Add FTS Generated Column to discussion_threads
ALTER TABLE public.discussion_threads
  ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B')
  ) STORED;

-- 3. Alter existing discussion_posts table
ALTER TABLE public.discussion_posts
  ADD COLUMN IF NOT EXISTS vote_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(content, ''))
  ) STORED;

-- 4. Create New Supporting Tables
CREATE TABLE IF NOT EXISTS public.discussion_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discussion_thread_tags (
  thread_id uuid NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.discussion_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.discussion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('thread', 'post')),
  target_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (1, -1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discussion_votes_user_target_unique UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS public.discussion_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('thread', 'post')),
  target_id uuid NOT NULL,
  emoji public.discussion_reaction_emoji NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discussion_reactions_user_target_emoji_unique UNIQUE (user_id, target_type, target_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.discussion_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discussion_bookmarks_user_thread_unique UNIQUE (user_id, thread_id)
);

CREATE TABLE IF NOT EXISTS public.discussion_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  is_muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discussion_subscriptions_user_thread_unique UNIQUE (user_id, thread_id)
);

CREATE TABLE IF NOT EXISTS public.discussion_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentioned_by_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discussion_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'pdf', 'audio')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discussion_thread_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_hash text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discussion_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('thread', 'post')),
  target_id uuid NOT NULL,
  reason public.discussion_report_reason NOT NULL,
  details text,
  status public.discussion_report_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discussion_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create Essential Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_discussion_threads_resource ON public.discussion_threads(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_status_type ON public.discussion_threads(status, type);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_activity ON public.discussion_threads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_not_deleted ON public.discussion_threads(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_discussion_threads_fts ON public.discussion_threads USING gin(fts);

CREATE INDEX IF NOT EXISTS idx_discussion_posts_thread_parent ON public.discussion_posts(thread_id, parent_post_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_not_deleted ON public.discussion_posts(created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_discussion_posts_fts ON public.discussion_posts USING gin(fts);

CREATE INDEX IF NOT EXISTS idx_discussion_tags_slug ON public.discussion_tags(slug);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_target ON public.discussion_votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_discussion_reactions_target ON public.discussion_reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_discussion_reports_status ON public.discussion_reports(status, created_at DESC);

-- 6. Trigger Functions & Rules

-- Rule A: Max Depth (2 Levels) Limit Check
CREATE OR REPLACE FUNCTION public.check_discussion_post_depth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_parent_id uuid;
BEGIN
  IF NEW.parent_post_id IS NOT NULL THEN
    SELECT parent_post_id INTO v_parent_parent_id
    FROM public.discussion_posts
    WHERE id = NEW.parent_post_id;

    -- Level 0 = Thread, Level 1 = Direct Post, Level 2 = Reply to Direct Post.
    -- If v_parent_parent_id IS NOT NULL, target parent is already Level 2, so enforce capping at Level 2.
    IF v_parent_parent_id IS NOT NULL THEN
      NEW.parent_post_id := v_parent_parent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_discussion_post_depth ON public.discussion_posts;
CREATE TRIGGER trg_check_discussion_post_depth
  BEFORE INSERT OR UPDATE ON public.discussion_posts
  FOR EACH ROW EXECUTE FUNCTION public.check_discussion_post_depth();

-- Rule B: Auto Sync Thread Reply Counts, Status, and Last Activity
CREATE OR REPLACE FUNCTION public.sync_discussion_thread_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_thread_id uuid;
  v_count integer;
  v_latest timestamptz;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_thread_id := OLD.thread_id;
  ELSE
    v_thread_id := NEW.thread_id;
  END IF;

  IF v_thread_id IS NOT NULL THEN
    SELECT count(*), max(created_at)
    INTO v_count, v_latest
    FROM public.discussion_posts
    WHERE thread_id = v_thread_id AND deleted_at IS NULL;

    UPDATE public.discussion_threads
    SET 
      reply_count = v_count,
      last_activity_at = coalesce(v_latest, created_at),
      status = CASE 
        WHEN status = 'open' AND v_count > 0 THEN 'answered'::public.discussion_thread_status
        WHEN status = 'answered' AND v_count = 0 THEN 'open'::public.discussion_thread_status
        ELSE status
      END
    WHERE id = v_thread_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_discussion_thread_metrics ON public.discussion_posts;
CREATE TRIGGER trg_sync_discussion_thread_metrics
  AFTER INSERT OR DELETE ON public.discussion_posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_discussion_thread_metrics();

-- Rule C: Auto Sync Vote Counters
CREATE OR REPLACE FUNCTION public.sync_discussion_vote_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_type text;
  v_target_id uuid;
  v_score integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_target_type := OLD.target_type;
    v_target_id := OLD.target_id;
  ELSE
    v_target_type := NEW.target_type;
    v_target_id := NEW.target_id;
  END IF;

  SELECT coalesce(sum(vote), 0) INTO v_score
  FROM public.discussion_votes
  WHERE target_type = v_target_type AND target_id = v_target_id;

  IF v_target_type = 'thread' THEN
    UPDATE public.discussion_threads SET vote_count = v_score WHERE id = v_target_id;
  ELSIF v_target_type = 'post' THEN
    UPDATE public.discussion_posts SET vote_count = v_score WHERE id = v_target_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_discussion_vote_counters ON public.discussion_votes;
CREATE TRIGGER trg_sync_discussion_vote_counters
  AFTER INSERT OR UPDATE OR DELETE ON public.discussion_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_discussion_vote_counters();

-- 7. High Performance RPC Functions

-- RPC 1: Atomic Vote Handling
CREATE OR REPLACE FUNCTION public.vote_discussion(
  p_target_type text,
  p_target_id uuid,
  p_vote smallint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_vote smallint;
  v_new_score integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to vote';
  END IF;

  IF p_vote NOT IN (1, -1) THEN
    RAISE EXCEPTION 'Invalid vote value';
  END IF;

  SELECT vote INTO v_existing_vote
  FROM public.discussion_votes
  WHERE user_id = v_user_id AND target_type = p_target_type AND target_id = p_target_id;

  IF v_existing_vote IS NULL THEN
    INSERT INTO public.discussion_votes (user_id, target_type, target_id, vote)
    VALUES (v_user_id, p_target_type, p_target_id, p_vote);
  ELSIF v_existing_vote = p_vote THEN
    DELETE FROM public.discussion_votes
    WHERE user_id = v_user_id AND target_type = p_target_type AND target_id = p_target_id;
  ELSE
    UPDATE public.discussion_votes
    SET vote = p_vote, updated_at = now()
    WHERE user_id = v_user_id AND target_type = p_target_type AND target_id = p_target_id;
  END IF;

  IF p_target_type = 'thread' THEN
    SELECT vote_count INTO v_new_score FROM public.discussion_threads WHERE id = p_target_id;
  ELSE
    SELECT vote_count INTO v_new_score FROM public.discussion_posts WHERE id = p_target_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'score', coalesce(v_new_score, 0));
END;
$$;

-- RPC 2: Toggle Reaction
CREATE OR REPLACE FUNCTION public.toggle_reaction(
  p_target_type text,
  p_target_id uuid,
  p_emoji public.discussion_reaction_emoji
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_exists boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.discussion_reactions
    WHERE user_id = v_user_id AND target_type = p_target_type AND target_id = p_target_id AND emoji = p_emoji
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.discussion_reactions
    WHERE user_id = v_user_id AND target_type = p_target_type AND target_id = p_target_id AND emoji = p_emoji;
  ELSE
    INSERT INTO public.discussion_reactions (user_id, target_type, target_id, emoji)
    VALUES (v_user_id, p_target_type, p_target_id, p_emoji);
  END IF;

  RETURN jsonb_build_object('success', true, 'toggled', NOT v_exists);
END;
$$;

-- RPC 3: Mark Accepted Solution
CREATE OR REPLACE FUNCTION public.mark_accepted_solution(
  p_post_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_thread_id uuid;
  v_thread_author_id uuid;
  v_is_authorized boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT thread_id INTO v_thread_id
  FROM public.discussion_posts
  WHERE id = p_post_id AND deleted_at IS NULL;

  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  SELECT user_id INTO v_thread_author_id
  FROM public.discussion_threads
  WHERE id = v_thread_id;

  -- Verify caller is thread author, instructor, or admin
  IF v_user_id = v_thread_author_id THEN
    v_is_authorized := true;
  ELSIF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND role IN ('instructor', 'admin')
  ) THEN
    v_is_authorized := true;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to accept solutions for this thread';
  END IF;

  -- Reset existing solutions for this thread
  UPDATE public.discussion_posts
  SET is_solution = false
  WHERE thread_id = v_thread_id;

  -- Mark target post as solution
  UPDATE public.discussion_posts
  SET is_solution = true
  WHERE id = p_post_id;

  -- Update thread status to solved
  UPDATE public.discussion_threads
  SET status = 'solved'::public.discussion_thread_status
  WHERE id = v_thread_id;

  RETURN jsonb_build_object('success', true, 'thread_id', v_thread_id, 'post_id', p_post_id);
END;
$$;

-- RPC 4: Record Thread View (Deduplicated)
CREATE OR REPLACE FUNCTION public.record_thread_view(
  p_thread_id uuid,
  p_client_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_recent_view boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.discussion_thread_views
    WHERE thread_id = p_thread_id
      AND client_hash = p_client_hash
      AND viewed_at > (now() - INTERVAL '1 hour')
  ) INTO v_recent_view;

  IF NOT v_recent_view THEN
    INSERT INTO public.discussion_thread_views (thread_id, user_id, client_hash)
    VALUES (p_thread_id, v_user_id, p_client_hash);

    UPDATE public.discussion_threads
    SET views_count = views_count + 1
    WHERE id = p_thread_id;
  END IF;
END;
$$;

-- RPC 5: Find Similar Threads (Duplicate Detection)
CREATE OR REPLACE FUNCTION public.find_similar_threads(
  p_title text,
  p_content text,
  p_resource_type public.discussion_resource_type DEFAULT 'general',
  p_resource_id text DEFAULT 'general',
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  status public.discussion_thread_status,
  reply_count integer,
  vote_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.content,
    t.status,
    t.reply_count,
    t.vote_count,
    t.created_at
  FROM public.discussion_threads t
  WHERE t.deleted_at IS NULL
    AND t.resource_type = p_resource_type
    AND t.resource_id = p_resource_id
    AND t.fts @@ (
      to_tsquery('simple', coalesce(nullif(p_title, ''), 'discussion'))
    )
  ORDER BY ts_rank(t.fts, to_tsquery('simple', coalesce(nullif(p_title, ''), 'discussion'))) DESC, t.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 8. Enable Row Level Security (RLS) Policies
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_thread_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_thread_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_audit_logs ENABLE ROW LEVEL SECURITY;

-- Clean old policies if re-running
DROP POLICY IF EXISTS "Public view threads" ON public.discussion_threads;
DROP POLICY IF EXISTS "Authenticated create threads" ON public.discussion_threads;
DROP POLICY IF EXISTS "Authors and staff update threads" ON public.discussion_threads;

-- Threads Policies
CREATE POLICY "Public view threads" ON public.discussion_threads
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated create threads" ON public.discussion_threads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authors and staff update threads" ON public.discussion_threads
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

-- Posts Policies
DROP POLICY IF EXISTS "Public view posts" ON public.discussion_posts;
DROP POLICY IF EXISTS "Authenticated create posts" ON public.discussion_posts;
DROP POLICY IF EXISTS "Authors and staff update posts" ON public.discussion_posts;

CREATE POLICY "Public view posts" ON public.discussion_posts
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated create posts" ON public.discussion_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authors and staff update posts" ON public.discussion_posts
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

-- Public Read Policies for Tags, Reactions, Attachments
CREATE POLICY "Public read tags" ON public.discussion_tags FOR SELECT USING (true);
CREATE POLICY "Public read thread tags" ON public.discussion_thread_tags FOR SELECT USING (true);
CREATE POLICY "Public read reactions" ON public.discussion_reactions FOR SELECT USING (true);
CREATE POLICY "Public read votes" ON public.discussion_votes FOR SELECT USING (true);
CREATE POLICY "Public read attachments" ON public.discussion_attachments FOR SELECT USING (true);

-- User Private Operations (Bookmarks, Subscriptions, Reports)
CREATE POLICY "Users manage own bookmarks" ON public.discussion_bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own subscriptions" ON public.discussion_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users create reports" ON public.discussion_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Staff view reports" ON public.discussion_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
  );

-- Storage bucket setup for discussion attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('discussion-attachments', 'discussion-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public attachment storage read" ON storage.objects
  FOR SELECT USING (bucket_id = 'discussion-attachments');

CREATE POLICY "Authenticated attachment storage insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'discussion-attachments' AND auth.uid() IS NOT NULL);
