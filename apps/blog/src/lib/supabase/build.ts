import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

// generateStaticParams 등 빌드 컨텍스트 전용. anon key + 쿠키 미사용.
export function createBuildClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
