-- Supabase security advisors 권고 반영
-- 1) sync_post_view_count: search_path 고정 (lint 0011_function_search_path_mutable)
-- 2) SECURITY DEFINER 함수의 EXECUTE 권한 회수 (lint 0028/0029)
--    - 트리거 함수는 RPC로 직접 호출할 이유가 없음. 트리거는 함수 소유자 권한으로
--      실행되므로 EXECUTE 회수 후에도 정상 동작함.

-- 1) search_path 고정 + 스키마 한정 참조 (handle_new_user는 이미 적용되어 있음)
CREATE OR REPLACE FUNCTION public.sync_post_view_count()
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

-- 2) EXECUTE 권한 회수
REVOKE EXECUTE ON FUNCTION public.sync_post_view_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
