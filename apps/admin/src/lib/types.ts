import type { Database } from "./database.types";

// Convenience type aliases
export type { Database };

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Row types
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Media = Database["public"]["Tables"]["media"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostTag = Database["public"]["Tables"]["post_tags"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];

// Insert types
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
export type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostTagInsert = Database["public"]["Tables"]["post_tags"]["Insert"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];

// Update types
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
export type CommentUpdate = Database["public"]["Tables"]["comments"]["Update"];
export type MediaUpdate = Database["public"]["Tables"]["media"]["Update"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
export type PostTagUpdate = Database["public"]["Tables"]["post_tags"]["Update"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type TagUpdate = Database["public"]["Tables"]["tags"]["Update"];

// Enums
export type PostStatus = Database["public"]["Enums"]["post_status"];

// Post with relations (for queries that join tables)
export type PostWithRelations = Post & {
  category?: Category | null;
  tags?: Tag[];
};
