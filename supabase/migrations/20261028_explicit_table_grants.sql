-- 테이블별 Data API 접근 권한 명시
--
-- 배경: 2026-10-30부터 Supabase는 기존 프로젝트에서도 public 스키마에 새로 만든 테이블에
-- anon / authenticated / service_role 권한을 자동으로 부여하지 않는다.
-- 기존 테이블은 영향이 없지만, schema.sql로 스키마를 재현하는 경우
-- (새 프로젝트, preview 브랜치, 로컬 `supabase db reset`)에는 GRANT가 없으면
-- supabase-js / PostgREST가 "permission denied"를 돌려준다.
--
-- 방침:
-- - 행 단위 접근 제어는 RLS 정책이 담당하므로, 테이블 권한은 기존 자동 부여 수준(SELECT/INSERT/UPDATE/DELETE)을 유지한다.
-- - anon에게도 INSERT/UPDATE가 필요하다: 댓글 작성·page_views 기록(INSERT), view_count 동기화 트리거(UPDATE).
-- - comments의 anon SELECT는 컬럼 단위 권한(20260612_comments_email_column_privilege)으로 관리하므로
--   테이블 단위 SELECT를 다시 부여하지 않는다 (테이블 GRANT가 있으면 컬럼 REVOKE가 무효화됨).
--
-- 운영 DB에는 이미 같은 권한이 있어 이 마이그레이션은 사실상 no-op이며,
-- 마이그레이션 이력 기록과 schema.sql 동기화가 목적이다.
-- 앞으로 테이블을 추가하는 마이그레이션에는 같은 GRANT를 함께 넣는다.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles      TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories    TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags          TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts         TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tags     TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media         TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_views    TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO anon, authenticated, service_role;

-- comments: anon은 SELECT 제외 (허용 컬럼만 별도 GRANT)
GRANT INSERT, UPDATE, DELETE ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated, service_role;
