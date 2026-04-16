-- posts.slug NOT NULL 제약 제거
-- draft 상태 포스트에 slug = NULL 허용 (다중 draft 동시 보관 가능)
-- PostgreSQL UNIQUE는 NULL을 distinct로 취급하므로 복수 NULL draft 공존 가능
ALTER TABLE posts ALTER COLUMN slug DROP NOT NULL;
