import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { PostEditor } from "../../PostEditor";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const [{ data: post }, { data: categories }, { data: tags }, { data: postTags }] =
    await Promise.all([
      supabase.from("posts").select("*").eq("id", id).single(),
      supabase.from("categories").select("*").order("name"),
      supabase.from("tags").select("*").order("name"),
      supabase.from("post_tags").select("tag_id").eq("post_id", id),
    ]);

  if (!post) {
    notFound();
  }

  const selectedTagIds = postTags?.map((pt) => pt.tag_id) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        포스트 수정
      </h1>
      <PostEditor
        post={post}
        categories={categories || []}
        tags={tags || []}
        selectedTagIds={selectedTagIds}
      />
    </div>
  );
}
