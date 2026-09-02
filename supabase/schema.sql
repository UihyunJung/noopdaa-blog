-- Noopdaa Blog Database Schema
-- Supabase SQL Editor에서 실행하세요
--
-- ⚠️ 이 파일은 운영 DB의 현재 상태를 반영한 문서입니다 (2026-06 현행화).
-- 운영 DB에 적용된 변경은 supabase/migrations/ 의 마이그레이션 파일을 참고하세요.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Profiles (관리자 프로필)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- 새 유저 가입 시 자동으로 profile 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

-- SECURITY DEFINER 함수는 RPC 직접 호출 차단 (트리거 동작에는 영향 없음)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. Categories (카테고리)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 설정
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================
-- 3. Tags (태그)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 설정
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON tags FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update tags"
  ON tags FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete tags"
  ON tags FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================
-- 4. Posts (포스트)
-- ============================================
CREATE TYPE post_status AS ENUM ('draft', 'published');

CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE, -- 슬러그 미지정 포스트 허용 (마이그레이션 20260416_slug_allow_null)
  content TEXT NOT NULL,
  excerpt TEXT,
  thumbnail_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status post_status DEFAULT 'draft' NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  view_count INTEGER DEFAULT 0 NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS posts_category_id_idx ON posts(category_id);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);

-- RLS 설정
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (status = 'published' OR (SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update posts"
  ON posts FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete posts"
  ON posts FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Post Tags (포스트-태그 연결)
-- ============================================
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

-- RLS 설정
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post tags are viewable by everyone"
  ON post_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert post tags"
  ON post_tags FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update post tags"
  ON post_tags FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete post tags"
  ON post_tags FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================
-- 6. Comments (댓글)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  is_admin BOOLEAN DEFAULT false, -- 관리자 댓글 표시 (서버 API에서 인증 검증 후 설정)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_is_approved_idx ON comments(is_approved);

-- RLS 설정
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are viewable by everyone"
  ON comments FOR SELECT
  USING (is_approved = true OR (SELECT auth.role()) = 'authenticated');

-- 익명 댓글 작성: 필수 필드 + 길이 + 이메일 형식 검증, is_admin 사칭 차단
CREATE POLICY "Anyone can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    length(trim(author_name)) > 0
    AND length(trim(author_email)) > 0
    AND length(trim(content)) > 0
    AND length(content) <= 5000
    AND author_email ~ '^[^@]+@[^@]+\.[^@]+$'
    AND is_admin = false
  );

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update comments"
  ON comments FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete comments"
  ON comments FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- author_email(PII) 컬럼 보호: anon은 author_email을 제외한 컬럼만 SELECT 가능
-- (마이그레이션 20260612_comments_email_column_privilege 참고)
REVOKE SELECT ON public.comments FROM anon;
GRANT SELECT (
  id, post_id, parent_id, author_name, content, created_at, is_admin, is_approved
) ON public.comments TO anon;

-- ============================================
-- 7. Media (미디어 파일)
-- ============================================
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 설정
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media is viewable by everyone"
  ON media FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert media"
  ON media FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can update media"
  ON media FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete media"
  ON media FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================
-- 8. Page Views (방문 기록 / 통계)
-- ============================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_type TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL,
  ip_hash TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_post_id ON page_views(post_id);

-- RLS 설정
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read"
  ON page_views FOR SELECT
  TO authenticated
  USING (true);

-- 누구나 INSERT 가능하되 필드 형식/길이 제한 (마이그레이션 20260612_page_views_insert_check 참고)
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (
    length(trim(page_path)) > 0 AND length(page_path) <= 500
    AND length(trim(visitor_id)) > 0 AND length(visitor_id) <= 100
    AND page_type IN ('post', 'home', 'category', 'tag', 'about', 'page')
    AND (referrer IS NULL OR length(referrer) <= 1000)
    AND (user_agent IS NULL OR length(user_agent) <= 500)
    AND (ip_hash IS NULL OR length(ip_hash) <= 64)
    AND (device_type IS NULL OR length(device_type) <= 20)
    AND (browser IS NULL OR length(browser) <= 50)
  );

-- ============================================
-- 9. Site Settings (사이트 설정 — 단일 행)
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT DEFAULT '눞다''s Blog' NOT NULL,
  site_description TEXT DEFAULT '',
  site_intro TEXT,
  hero_image_url TEXT,
  og_image_url TEXT,
  hero_post_ids TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 설정
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update site settings"
  ON site_settings FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated');

-- ============================================
-- 10. Page Views → Posts 조회수 동기화
-- ============================================
-- page_views INSERT 시 posts.view_count를 자동으로 +1
CREATE OR REPLACE FUNCTION sync_post_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    UPDATE public.posts
    SET view_count = view_count + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$;

-- SECURITY DEFINER 함수는 RPC 직접 호출 차단 (트리거 동작에는 영향 없음)
REVOKE EXECUTE ON FUNCTION public.sync_post_view_count() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER on_page_view_inserted
  AFTER INSERT ON page_views
  FOR EACH ROW EXECUTE FUNCTION sync_post_view_count();

-- ============================================
-- 11. Storage Bucket 설정
-- ============================================
-- Supabase Dashboard > Storage에서 'media' 버킷을 생성하고
-- Public access를 활성화하세요.

-- Storage Policy (SQL Editor가 아닌 Dashboard에서 설정)
-- INSERT: authenticated users만
-- SELECT: 모든 사용자
-- DELETE: authenticated users만
