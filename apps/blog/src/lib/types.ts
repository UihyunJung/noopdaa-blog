// 공통 타입은 packages/database에서 re-export
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Category,
  CategoryInsert,
  CategoryUpdate,
  Comment,
  CommentInsert,
  CommentUpdate,
  Media,
  MediaInsert,
  MediaUpdate,
  Post,
  PostInsert,
  PostUpdate,
  PostTag,
  PostTagInsert,
  PostTagUpdate,
  PageView,
  PageViewInsert,
  PageViewUpdate,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Tag,
  TagInsert,
  TagUpdate,
  PostStatus,
  PostWithCategory,
  PostWithRelations,
  CommentWithPost,
} from "@noopdaa/database/types";

// blog 전용 합성 타입
export interface SiteSettings {
  site_name: string;
  site_description: string | null;
  og_image_url: string | null;
  hero_image_url?: string | null;
  hero_post_ids?: string[] | null;
}
