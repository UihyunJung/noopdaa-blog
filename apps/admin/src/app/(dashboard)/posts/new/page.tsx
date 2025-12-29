import { createServerClient } from "@/lib/supabase/server";
import { PostEditor } from "../PostEditor";

export default async function NewPostPage() {
  const supabase = await createServerClient();

  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        새 포스트
      </h1>
      <PostEditor categories={categories || []} tags={tags || []} />
    </div>
  );
}
