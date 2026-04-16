import { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";

  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, updated_at, published_at, created_at, thumbnail_url")
    .eq("status", "published");

  const postUrls =
    posts?.map((post) => ({
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at || post.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(post.thumbnail_url ? { images: [post.thumbnail_url] } : {}),
    })) || [];

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...postUrls,
  ];
}
