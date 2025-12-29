"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import type { Post, Category, Tag } from "@/lib/types";

interface PostEditorProps {
  post?: Post;
  categories: Category[];
  tags: Tag[];
  selectedTagIds?: string[];
}

export function PostEditor({
  post,
  categories,
  tags,
  selectedTagIds = [],
}: PostEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [categoryId, setCategoryId] = useState(post?.category_id || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(selectedTagIds);
  const [status, setStatus] = useState<"draft" | "published">(
    post?.status || "draft"
  );
  const [metaTitle, setMetaTitle] = useState(post?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(
    post?.meta_description || ""
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnail_url || "");

  const handleSubmit = async (submitStatus: "draft" | "published") => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다.");
      setIsLoading(false);
      return;
    }

    const postData = {
      title,
      slug: post?.slug || `post-${Date.now().toString(36)}`,
      content,
      excerpt: excerpt || content.slice(0, 200),
      thumbnail_url: thumbnailUrl || null,
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
      const { error } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", post.id);

      if (error) {
        alert("저장에 실패했습니다.");
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
        alert("저장에 실패했습니다.");
        setIsLoading(false);
        return;
      }
      postId = data.id;
    }

    // 태그 업데이트
    await supabase.from("post_tags").delete().eq("post_id", postId!);

    if (selectedTags.length > 0) {
      await supabase.from("post_tags").insert(
        selectedTags.map((tagId) => ({
          post_id: postId!,
          tag_id: tagId,
        }))
      );
    }

    router.push("/posts");
    router.refresh();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
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
          <Input
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="이미지 URL을 입력하세요"
          />
          {thumbnailUrl && (
            <div className="mt-2 overflow-hidden rounded-lg">
              <img
                src={thumbnailUrl}
                alt="썸네일 미리보기"
                className="w-full object-cover"
              />
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            미디어 관리에서 업로드 후 URL을 복사해서 붙여넣으세요
          </p>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            태그
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedTags.includes(tag.id)
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {tag.name}
              </button>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-gray-500">태그가 없습니다.</p>
            )}
          </div>
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
