-- 홈 상단 "한 줄 소개" 컬럼 추가
-- blog 홈에서 큰 제목(site_description) 옆에 표시하는 짧은 소개 문장.
-- NULL이거나 빈 문자열이면 blog가 해당 영역을 렌더링하지 않는다.
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS site_intro TEXT;

COMMENT ON COLUMN site_settings.site_intro IS '홈 한 줄 소개 (비우면 홈에서 숨김)';
