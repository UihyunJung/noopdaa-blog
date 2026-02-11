"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Card } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { TagInput } from "@/components/editor/TagInput";
import { ThumbnailPicker, type ThumbnailData } from "@/components/editor/ThumbnailPicker";
import { generateSlug } from "@/lib/utils";
import type { Post, Category, Tag } from "@/lib/types";

interface PostEditorProps {
  post?: Post;
  categories: Category[];
  tags: Tag[];
  selectedTagNames?: string[];
}

export function PostEditor({
  post,
  categories,
  tags,
  selectedTagNames = [],
}: PostEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [categoryId, setCategoryId] = useState(post?.category_id || "");
  const [tagNames, setTagNames] = useState<string[]>(selectedTagNames);
  const [status, setStatus] = useState<"draft" | "published">(
    post?.status || "draft"
  );
  const [metaTitle, setMetaTitle] = useState(post?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(
    post?.meta_description || ""
  );
  const [thumbnailData, setThumbnailData] = useState<ThumbnailData | null>(
    post?.thumbnail_url ? { type: "url", value: post.thumbnail_url } : null
  );

  // 기존 태그 이름 목록 (자동완성용)
  const existingTagNames = tags.map((tag) => tag.name);

  // 썸네일 업로드 (파일 또는 blob인 경우)
  const uploadThumbnail = async (
    supabase: ReturnType<typeof createClient>,
    data: ThumbnailData
  ): Promise<string | null> => {
    // 이미 등록된 URL이면 그대로 반환
    if (data.type === "url") {
      return data.value;
    }

    // 파일 또는 blob 업로드
    const fileToUpload = data.type === "file" ? data.file : data.blob;
    if (!fileToUpload) return null;

    const fileExt = data.type === "file" ? data.filename?.split(".").pop() : "png";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, fileToUpload);

    if (uploadError) {
      throw new Error("썸네일 업로드에 실패했습니다.");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    // 미디어 테이블에 등록
    const size = fileToUpload instanceof File ? fileToUpload.size : fileToUpload.size;
    const type = fileToUpload instanceof File ? fileToUpload.type : "image/png";

    await supabase.from("media").insert({
      filename: data.filename || fileName,
      url: publicUrl,
      type,
      size,
    });

    return publicUrl;
  };

  const handleSubmit = async (submitStatus: "draft" | "published") => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("로그인이 필요합니다.");
      setIsLoading(false);
      return;
    }

    // 썸네일 업로드 처리
    let thumbnailUrl: string | null = null;
    if (thumbnailData) {
      try {
        thumbnailUrl = await uploadThumbnail(supabase, thumbnailData);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "썸네일 업로드 실패");
        setIsLoading(false);
        return;
      }
    }

    const postData = {
      title,
      slug: post?.slug || `post-${Date.now().toString(36)}`,
      content,
      excerpt: excerpt || content.slice(0, 200),
      thumbnail_url: thumbnailUrl,
      category_id: categoryId || null,
      author_id: user.id,
      status: submitStatus,
      meta_title: metaTitle || title,
      meta_description: metaDescription || excerpt || content.slice(0, 160),
      published_at: submitStatus === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let postId = post?.id;

    if (post) {
      // 작성자 검증: 본인이 작성한 포스트만 수정 가능
      if (post.author_id && post.author_id !== user.id) {
        toast.error("본인이 작성한 포스트만 수정할 수 있습니다.");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", post.id);

      if (error) {
        toast.error("저장에 실패했습니다.");
        setIsLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert(postData)
        .select("id")
        .single();

      if (error || !data) {
        toast.error("저장에 실패했습니다.");
        setIsLoading(false);
        return;
      }
      postId = data.id;
    }

    // 태그 처리: 없는 태그는 생성, 있는 태그는 연결
    await supabase.from("post_tags").delete().eq("post_id", postId!);

    if (tagNames.length > 0) {
      const tagIds: string[] = [];

      for (const tagName of tagNames) {
        // 기존 태그 찾기
        const existingTag = tags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase()
        );

        if (existingTag) {
          tagIds.push(existingTag.id);
        } else {
          // 새 태그 생성
          const { data: newTag } = await supabase
            .from("tags")
            .insert({ name: tagName, slug: generateSlug(tagName) })
            .select("id")
            .single();

          if (newTag) {
            tagIds.push(newTag.id);
          }
        }
      }

      // 포스트-태그 연결
      if (tagIds.length > 0) {
        await supabase.from("post_tags").insert(
          tagIds.map((tagId) => ({
            post_id: postId!,
            tag_id: tagId,
          }))
        );
      }
    }

    router.push("/posts");
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Input
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="포스트 제목을 입력하세요"
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            내용
          </label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            height={500}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            요약
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="포스트 요약 (목록에 표시됩니다)"
          />
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            발행
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleSubmit("draft")}
              isLoading={isLoading}
            >
              임시저장
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleSubmit("published")}
              isLoading={isLoading}
            >
              {post?.status === "published" ? "업데이트" : "발행"}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            카테고리
          </h3>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">카테고리 선택</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            썸네일
          </h3>
          <ThumbnailPicker
            value={thumbnailData}
            onChange={setThumbnailData}
            markdownContent={content}
          />
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            태그
          </h3>
          <TagInput
            value={tagNames}
            onChange={setTagNames}
            suggestions={existingTagNames}
            placeholder="태그 입력 (Enter로 추가)"
          />
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            SEO 설정
          </h3>
          <div className="space-y-4">
            <Input
              label="메타 타이틀"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="검색 결과에 표시될 제목"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                메타 설명
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="검색 결과에 표시될 설명"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
