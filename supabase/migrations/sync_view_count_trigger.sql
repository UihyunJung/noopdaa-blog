-- ============================================
-- 조회수 통합: page_views → posts.view_count 자동 동기화
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. page_views INSERT 시 posts.view_count를 +1 하는 트리거 함수
CREATE OR REPLACE FUNCTION sync_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    UPDATE posts
    SET view_count = view_count + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. page_views 테이블에 트리거 연결
DROP TRIGGER IF EXISTS on_page_view_inserted ON page_views;
CREATE TRIGGER on_page_view_inserted
  AFTER INSERT ON page_views
  FOR EACH ROW EXECUTE FUNCTION sync_post_view_count();

-- 3. 기존 데이터 보정: page_views 기준으로 posts.view_count 동기화
UPDATE posts
SET view_count = COALESCE(pv.cnt, 0)
FROM (
  SELECT post_id, COUNT(*) AS cnt
  FROM page_views
  WHERE post_id IS NOT NULL
  GROUP BY post_id
) pv
WHERE posts.id = pv.post_id;

-- 4. 기존 increment_view_count RPC 함수 제거 (더 이상 사용하지 않음)
DROP FUNCTION IF EXISTS increment_view_count(UUID);
