-- 기존 공개 포스트 slug 마이그레이션
-- 실행 완료: 2026-04-16

BEGIN;

UPDATE posts SET slug = 'dubai-chocolate-cookie-review' WHERE id = 'b0cb2817-1dbe-4bdf-810f-bdea7f1230ce';
UPDATE posts SET slug = 'spirited-away-musical-seoul-review' WHERE id = 'b786377d-a5a7-4462-9d20-8e9e5aeb5343';
UPDATE posts SET slug = 'openclaw-ai-assistant-security' WHERE id = 'fb925a87-6b9f-486e-83dc-e2d933813772';
UPDATE posts SET slug = 'moltbook-ai-agent-social-network' WHERE id = 'f8a929e6-3229-459d-9922-a542033855c0';
UPDATE posts SET slug = 'ghost-of-yotei-review' WHERE id = 'ec2669af-ecc4-4b0e-9631-a6bce67f49f6';
UPDATE posts SET slug = 'stock-average-down-calculator' WHERE id = '1cfcada7-546e-4bdf-89b9-7ce3d961a221';

COMMIT;

-- ============================================
-- Phase 4 Task 4.3 next.config.ts redirects() 용 매핑
-- (UUID 6건 → 최종 slug)
-- ============================================
-- b0cb2817-1dbe-4bdf-810f-bdea7f1230ce  →  dubai-chocolate-cookie-review
-- b786377d-a5a7-4462-9d20-8e9e5aeb5343  →  spirited-away-musical-seoul-review
-- fb925a87-6b9f-486e-83dc-e2d933813772  →  openclaw-ai-assistant-security
-- f8a929e6-3229-459d-9922-a542033855c0  →  moltbook-ai-agent-social-network
-- ec2669af-ecc4-4b0e-9631-a6bce67f49f6  →  ghost-of-yotei-review
-- 1cfcada7-546e-4bdf-89b9-7ce3d961a221  →  stock-average-down-calculator
