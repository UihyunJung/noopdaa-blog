-- page_views INSERT 정책 강화: 길이 상한 추가
--
-- 기존 정책은 비어있지 않은지 + page_type enum만 검사해서,
-- anon key로 직접 REST를 호출하면 임의 길이의 쓰레기 데이터를 적재할 수 있었음.
-- (API 라우트에는 rate limit + 검증이 추가되었지만, 직접 REST 호출 경로도 방어)

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
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
