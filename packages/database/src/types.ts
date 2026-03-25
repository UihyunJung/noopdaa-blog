export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./database.types";

import type { Database } from "./database.types";

// 편의를 위한 타입 별칭
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
export type TagUpdate = Database["public"]["Tables"]["tags"]["Update"];

export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
export type CommentUpdate = Database["public"]["Tables"]["comments"]["Update"];

export type Media = Database["public"]["Tables"]["media"]["Row"];
export type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
export type MediaUpdate = Database["public"]["Tables"]["media"]["Update"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type PostTag = Database["public"]["Tables"]["post_tags"]["Row"];
export type PostTagInsert = Database["public"]["Tables"]["post_tags"]["Insert"];
export type PostTagUpdate = Database["public"]["Tables"]["post_tags"]["Update"];

export type PageView = Database["public"]["Tables"]["page_views"]["Row"];
export type PageViewInsert = Database["public"]["Tables"]["page_views"]["Insert"];
export type PageViewUpdate = Database["public"]["Tables"]["page_views"]["Update"];

export type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];
export type SiteSettingsInsert = Database["public"]["Tables"]["site_settings"]["Insert"];
export type SiteSettingsUpdate = Database["public"]["Tables"]["site_settings"]["Update"];

export type PostStatus = Database["public"]["Enums"]["post_status"];

// 관계 포함 타입
export type PostWithCategory = Post & {
  categories: Pick<Category, "name" | "slug"> | null;
};

export type PostWithRelations = Post & {
  categories: Category | null;
  tags: Tag[];
};

export type CommentWithPost = Comment & {
  posts: Pick<Post, "title"> | null;
};
