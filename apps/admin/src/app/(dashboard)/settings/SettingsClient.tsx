"use client";

import { useState, useMemo, useRef, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Card, Input, ConfirmModal } from "@noopdaa/ui";
import { ImSpinner8 } from "react-icons/im";
import { HiOutlineXMark, HiOutlinePlus, HiOutlineBars2 } from "react-icons/hi2";
import {
  updateSiteInfo,
  uploadSiteImage,
  removeSiteImage,
  updateHeroPosts,
} from "./actions";

export interface SiteSettings {
  id: string;
  site_name: string;
  site_description: string | null;
  site_intro: string | null;
  hero_image_url: string | null;
  og_image_url: string | null;
  hero_post_ids: string[] | null;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
}

interface SettingsClientProps {
  settings: SiteSettings;
  allPosts: Post[];
}

export function SettingsClient({ settings, allPosts }: SettingsClientProps) {
  // 사이트 정보
  const [siteName, setSiteName] = useState(settings.site_name);
  const [siteDescription, setSiteDescription] = useState(settings.site_description ?? "");
  const [siteIntro, setSiteIntro] = useState(settings.site_intro ?? "");
  const [isSavePending, startSaveTransition] = useTransition();

  // 이미지 업로드
  const heroInputRef = useRef<HTMLInputElement>(null);
  const ogInputRef = useRef<HTMLInputElement>(null);
  const [isHeroPending, startHeroTransition] = useTransition();
  const [isOgPending, startOgTransition] = useTransition();
  const [confirmImageType, setConfirmImageType] = useState<"hero" | "og" | null>(null);

  // 추천 글 (hero_post_ids)
  const [heroPostIds, setHeroPostIds] = useState<string[]>(settings.hero_post_ids ?? []);
  const [isPostSelectorOpen, setIsPostSelectorOpen] = useState(false);
  const [isHeroPostsPending, startHeroPostsTransition] = useTransition();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 추천 글 (hero_post_ids) 정보 — heroPostIds + allPosts에서 파생
  const heroPosts = useMemo<Post[]>(() => {
    if (heroPostIds.length === 0) return [];
    return heroPostIds
      .map((id) => allPosts.find((p) => p.id === id))
      .filter(Boolean) as Post[];
  }, [heroPostIds, allPosts]);

  const isHeroPostsChanged = useMemo(
    () => JSON.stringify(heroPostIds) !== JSON.stringify(settings.hero_post_ids ?? []),
    [heroPostIds, settings.hero_post_ids]
  );

  const availablePosts = useMemo(
    () => allPosts.filter((p) => !heroPostIds.includes(p.id)),
    [allPosts, heroPostIds]
  );

  // ─── 사이트 정보 ───────────────────────────────────────
  const handleSaveSiteInfo = () => {
    if (!siteName.trim()) return;
    startSaveTransition(async () => {
      const result = await updateSiteInfo({ siteName, siteDescription, siteIntro });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("설정이 저장되었습니다.");
    });
  };

  // ─── 이미지 업로드/삭제 ────────────────────────────────
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "hero" | "og"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const transition = type === "hero" ? startHeroTransition : startOgTransition;
    const ref = type === "hero" ? heroInputRef : ogInputRef;

    transition(async () => {
      const result = await uploadSiteImage(type, formData);
      if (ref.current) ref.current.value = "";
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("이미지가 업로드되었습니다.");
    });
  };

  const handleRemoveImage = (type: "hero" | "og") => {
    const transition = type === "hero" ? startHeroTransition : startOgTransition;
    transition(async () => {
      const result = await removeSiteImage(type);
      setConfirmImageType(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("이미지가 삭제되었습니다.");
    });
  };

  // ─── 히어로 포스트 ────────────────────────────────────
  const handleAddHeroPost = (postId: string) => {
    if (heroPostIds.length >= 3 || heroPostIds.includes(postId)) return;
    setHeroPostIds([...heroPostIds, postId]);
    setIsPostSelectorOpen(false);
  };

  const handleRemoveHeroPost = (postId: string) => {
    setHeroPostIds(heroPostIds.filter((id) => id !== postId));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== index) setDragOverIndex(index);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...heroPostIds];
    const dragged = next.splice(draggedIndex, 1)[0];
    if (!dragged) return;
    next.splice(dropIndex, 0, dragged);
    setHeroPostIds(next);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveHeroPosts = () => {
    startHeroPostsTransition(async () => {
      const result = await updateHeroPosts(heroPostIds);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("추천 글이 저장되었습니다.");
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        블로그 설정
      </h1>

      {/* 기본 정보 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          기본 정보
        </h2>
        <div className="space-y-4">
          <Input
            label="블로그명"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="블로그 이름을 입력하세요"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              블로그 설명
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              rows={3}
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              placeholder="블로그 설명을 입력하세요"
            />
          </div>
          <Input
            label="홈 한 줄 소개"
            value={siteIntro}
            onChange={(e) => setSiteIntro(e.target.value)}
            placeholder="홈 큰 제목 옆에 붙는 한 줄 소개 (비우면 표시되지 않음)"
          />
          <Button
            onClick={handleSaveSiteInfo}
            isLoading={isSavePending}
            disabled={!siteName.trim()}
            className="w-full sm:w-auto"
          >
            저장
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          블로그명은 헤더와 메타 태그에, 블로그 설명은 홈 상단 큰 제목과 메타·OG 설명에, 한 줄 소개는 홈 큰 제목 옆에 표시됩니다.
        </p>
      </Card>

      {/* 메인 이미지 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          대문 이미지
        </h2>
        <div className="space-y-4">
          {settings.hero_image_url ? (
            <div className="relative aspect-[21/9] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
              <Image
                src={settings.hero_image_url}
                alt="메인 이미지"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-[21/9] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
              <span className="text-gray-400">이미지 없음</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "hero")}
              className="hidden"
              id="hero-upload"
              disabled={isHeroPending}
            />
            <label
              htmlFor="hero-upload"
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:flex-none"
            >
              {isHeroPending ? <ImSpinner8 className="h-4 w-4 animate-spin" /> : null}
              이미지 업로드
            </label>
            {settings.hero_image_url && (
              <Button
                variant="secondary"
                onClick={() => setConfirmImageType("hero")}
                disabled={isHeroPending}
                className="flex-1 sm:flex-none"
              >
                삭제
              </Button>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          홈 맨 위에 어둡게 덮지 않고 그대로 보여줍니다. 권장 비율 3:1, 가로 1500px 이상
        </p>
      </Card>

      {/* 히어로 포스트 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          추천 글
        </h2>
        <div className="space-y-4">
          {heroPosts.length > 0 ? (
            <div className="space-y-2">
              {heroPosts.map((post, index) => (
                <div
                  key={post.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 ${
                    draggedIndex === index
                      ? "opacity-50 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
                      : dragOverIndex === index
                        ? "border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20"
                        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <div className="shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300">
                    <HiOutlineBars2 className="h-5 w-5" />
                  </div>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    {index + 1}
                  </span>
                  {post.thumbnail_url ? (
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                      <Image
                        src={post.thumbnail_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded bg-gray-200 text-xs text-gray-400 dark:bg-gray-700">
                      No Image
                    </div>
                  )}
                  <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                    {post.title}
                  </span>
                  <button
                    onClick={() => handleRemoveHeroPost(post.id)}
                    className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700"
                    title="제거"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center dark:border-gray-600 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                선택된 포스트가 없습니다
              </p>
            </div>
          )}

          {heroPostIds.length < 3 && (
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPostSelectorOpen(!isPostSelectorOpen)}
                className="w-full justify-center gap-2"
              >
                <HiOutlinePlus className="h-4 w-4" />
                포스트 추가 ({heroPostIds.length}/3)
              </Button>
              {isPostSelectorOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {availablePosts.length > 0 ? (
                    availablePosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => handleAddHeroPost(post.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {post.thumbnail_url ? (
                          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                            <Image
                              src={post.thumbnail_url}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-gray-200 text-xs text-gray-400 dark:bg-gray-700">
                            No Image
                          </div>
                        )}
                        <span className="flex-1 truncate text-sm text-gray-900 dark:text-white">
                          {post.title}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      선택 가능한 포스트가 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSaveHeroPosts}
            isLoading={isHeroPostsPending}
            disabled={!isHeroPostsChanged}
            className="w-full sm:w-auto"
          >
            추천 글 저장
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          홈 &lsquo;추천 글&rsquo; 영역에 고정으로 보여줄 포스트를 고르세요 (최대 3개). 첫 번째 글이 크게, 나머지가 옆에 작게 놓입니다. 드래그해서 순서를 바꿀 수 있습니다.
        </p>
      </Card>

      {/* OG 이미지 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          OG 이미지 (소셜 공유용)
        </h2>
        <div className="space-y-4">
          {settings.og_image_url ? (
            <div className="relative aspect-[1200/630] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 sm:max-w-md">
              <Image
                src={settings.og_image_url}
                alt="OG 이미지"
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-[1200/630] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800 sm:max-w-md">
              <span className="text-gray-400">이미지 없음</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              ref={ogInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "og")}
              className="hidden"
              id="og-upload"
              disabled={isOgPending}
            />
            <label
              htmlFor="og-upload"
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:flex-none"
            >
              {isOgPending ? <ImSpinner8 className="h-4 w-4 animate-spin" /> : null}
              이미지 업로드
            </label>
            {settings.og_image_url && (
              <Button
                variant="secondary"
                onClick={() => setConfirmImageType("og")}
                disabled={isOgPending}
                className="flex-1 sm:flex-none"
              >
                삭제
              </Button>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          SNS에서 블로그 링크 공유 시 표시되는 이미지입니다. 권장 크기: 1200x630px
        </p>
      </Card>

      <ConfirmModal
        isOpen={confirmImageType !== null}
        onClose={() => setConfirmImageType(null)}
        onConfirm={() => confirmImageType && handleRemoveImage(confirmImageType)}
        title="이미지 삭제"
        description={`${confirmImageType === "hero" ? "메인 이미지" : "OG 이미지"}를 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="danger"
        isLoading={isHeroPending || isOgPending}
      />
    </div>
  );
}
