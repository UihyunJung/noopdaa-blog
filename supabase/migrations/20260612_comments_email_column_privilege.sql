-- 댓글 작성자 이메일(PII) 보호: anon 역할의 author_email 컬럼 접근 차단
--
-- 배경: RLS는 행 단위 제어라서 SELECT 정책만으로는 특정 컬럼을 숨길 수 없음.
-- 공개 anon key로 PostgREST(/rest/v1/comments?select=author_email)를 직접 호출하면
-- 댓글 작성자 이메일을 수집할 수 있었음.
--
-- ⚠️ 적용 순서 주의:
-- blog 앱이 명시적 컬럼 select(author_email 제외)로 배포된 *이후*에 적용할 것.
-- 구버전 코드(select *)가 떠 있는 상태에서 적용하면 댓글 조회/작성이 실패함.
--
-- PostgreSQL 특성상 테이블 단위 GRANT가 있으면 컬럼 단위 REVOKE가 무시되므로,
-- 테이블 SELECT를 회수한 뒤 허용 컬럼만 다시 GRANT하는 방식 사용.

REVOKE SELECT ON public.comments FROM anon;

GRANT SELECT (
  id,
  post_id,
  parent_id,
  author_name,
  content,
  created_at,
  is_admin,
  is_approved
) ON public.comments TO anon;
