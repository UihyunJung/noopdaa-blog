"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Card, Input, ConfirmModal } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { ImSpinner8 } from "react-icons/im";
import { HiOutlineXMark, HiOutlinePlus, HiOutlineBars2 } from "react-icons/hi2";

interface SiteSettings {
  id: string;
  site_name: string;
  site_description: string | null;
  hero_image_url: string | null;
  og_image_url: string | null;
  hero_post_ids: string[] | null;
  updated_at: string;
}

interface Post {
  id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingOg, setIsUploadingOg] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const ogInputRef = useRef<HTMLInputElement>(null);

  // 히어로 포스트 관련 상태
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [heroPostIds, setHeroPostIds] = useState<string[]>([]);
  const [heroPosts, setHeroPosts] = useState<Post[]>([]);
  const [isPostSelectorOpen, setIsPostSelectorOpen] = useState(false);
  const [isSavingHeroPosts, setIsSavingHeroPosts] = useState(false);

  // 이미지 삭제 확인 모달
  const [confirmImageType, setConfirmImageType] = useState<"hero" | "og" | null>(null);

  // 드래그 앤 드롭 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
    loadPosts();
  }, []);

  // 히어로 포스트 ID가 변경되면 해당 포스트 정보 로드
  useEffect(() => {
    if (heroPostIds.length > 0 && allPosts.length > 0) {
      const posts = heroPostIds
        .map((id) => allPosts.find((p) => p.id === id))
        .filter(Boolean) as Post[];
      setHeroPosts(posts);
    } else {
      setHeroPosts([]);
    }
  }, [heroPostIds, allPosts]);

  const loadSettings = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .single() as { data: SiteSettings | null };

    if (data) {
      setSettings(data);
      setSiteName(data.site_name);
      setSiteDescription(data.site_description || "");
      setHeroPostIds(data.hero_post_ids || []);
    }
    setIsLoading(false);
  };

  const loadPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, title, thumbnail_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (data) {
      setAllPosts(data);
    }
  };

  const handleSave = async () => {
    if (!settings || !siteName.trim()) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        site_name: siteName.trim(),
        site_description: siteDescription.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    setIsSaving(false);

    if (error) {
      toast.error("설정 저장에 실패했습니다.");
    } else {
      toast.success("설정이 저장되었습니다.");
      setSettings({
        ...settings,
        site_name: siteName.trim(),
        site_description: siteDescription.trim() || null,
      });
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "hero" | "og"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    const setUploading = type === "hero" ? setIsUploadingHero : setIsUploadingOg;
    const fieldName = type === "hero" ? "hero_image_url" : "og_image_url";
    const currentUrl = type === "hero" ? settings.hero_image_url : settings.og_image_url;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `site/${fileName}`;

    if (currentUrl) {
      const oldPath = currentUrl.split("/").slice(-2).join("/");
      await supabase.storage.from("media").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file);

    if (uploadError) {
      setUploading(false);
      toast.error("이미지 업로드에 실패했습니다.");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("site_settings")
      .update({
        [fieldName]: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    setUploading(false);

    if (updateError) {
      toast.error("설정 업데이트에 실패했습니다.");
    } else {
      toast.success("이미지가 업로드되었습니다.");
      setSettings({ ...settings, [fieldName]: publicUrl });
    }

    if (type === "hero" && heroInputRef.current) {
      heroInputRef.current.value = "";
    }
    if (type === "og" && ogInputRef.current) {
      ogInputRef.current.value = "";
    }
  };

  // 히어로 포스트 추가
  const handleAddHeroPost = (postId: string) => {
    if (heroPostIds.length >= 3) return;
    if (heroPostIds.includes(postId)) return;
    setHeroPostIds([...heroPostIds, postId]);
    setIsPostSelectorOpen(false);
  };

  // 히어로 포스트 제거
  const handleRemoveHeroPost = (postId: string) => {
    setHeroPostIds(heroPostIds.filter((id) => id !== postId));
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newHeroPostIds = [...heroPostIds];
    const draggedId = newHeroPostIds.splice(draggedIndex, 1)[0];
    if (!draggedId) return;
    newHeroPostIds.splice(dropIndex, 0, draggedId);

    setHeroPostIds(newHeroPostIds);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 히어로 포스트 저장
  const handleSaveHeroPosts = async () => {
    if (!settings) return;

    setIsSavingHeroPosts(true);

    const { error } = await supabase
      .from("site_settings")
      .update({
        hero_post_ids: heroPostIds.length > 0 ? heroPostIds : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    setIsSavingHeroPosts(false);

    if (error) {
      toast.error("히어로 포스트 저장에 실패했습니다.");
    } else {
      toast.success("히어로 포스트가 저장되었습니다.");
      setSettings({ ...settings, hero_post_ids: heroPostIds.length > 0 ? heroPostIds : null });
    }
  };

  // 선택 가능한 포스트 (이미 선택되지 않은 것들)
  const availablePosts = allPosts.filter((post) => !heroPostIds.includes(post.id));

  const handleRemoveImage = async (type: "hero" | "og") => {
    if (!settings) return;

    const fieldName = type === "hero" ? "hero_image_url" : "og_image_url";
    const currentUrl = type === "hero" ? settings.hero_image_url : settings.og_image_url;
    const label = type === "hero" ? "메인 이미지" : "OG 이미지";

    if (!currentUrl) return;

    const oldPath = currentUrl.split("/").slice(-2).join("/");
    await supabase.storage.from("media").remove([oldPath]);

    const { error } = await supabase
      .from("site_settings")
      .update({
        [fieldName]: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) {
      toast.error("이미지 삭제에 실패했습니다.");
    } else {
      toast.success("이미지가 삭제되었습니다.");
      setSettings({ ...settings, [fieldName]: null });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

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
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!siteName.trim()}
            className="w-full sm:w-auto"
          >
            저장
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          블로그명과 설명은 메타 태그, OG 태그, 헤더, Hero 섹션에 사용됩니다.
        </p>
      </Card>

      {/* 메인 이미지 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          메인 이미지 (Hero 배경)
        </h2>
        <div className="space-y-4">
          {settings?.hero_image_url ? (
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
            />
            <label
              htmlFor="hero-upload"
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:flex-none"
            >
              {isUploadingHero ? (
                <ImSpinner8 className="h-4 w-4 animate-spin" />
              ) : null}
              이미지 업로드
            </label>
            {settings?.hero_image_url && (
              <Button
                variant="secondary"
                onClick={() => setConfirmImageType("hero")}
                className="flex-1 sm:flex-none"
              >
                삭제
              </Button>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          홈페이지 Hero 섹션의 배경 이미지입니다. 권장 비율: 21:9
        </p>
      </Card>

      {/* 히어로 포스트 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          히어로 슬라이드 포스트
        </h2>
        <div className="space-y-4">
          {/* 선택된 포스트 목록 */}
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
                  {/* 드래그 핸들 */}
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

          {/* 포스트 추가 버튼 */}
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

              {/* 포스트 선택 드롭다운 */}
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

          {/* 저장 버튼 */}
          <Button
            onClick={handleSaveHeroPosts}
            isLoading={isSavingHeroPosts}
            disabled={JSON.stringify(heroPostIds) === JSON.stringify(settings?.hero_post_ids || [])}
            className="w-full sm:w-auto"
          >
            히어로 포스트 저장
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          홈페이지 Hero 섹션에 슬라이드로 표시할 포스트를 선택하세요 (최대 3개). 드래그하여 순서를 변경할 수 있습니다. 포스트의 커버 이미지가 배경으로 사용됩니다.
        </p>
      </Card>

      {/* OG 이미지 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          OG 이미지 (소셜 공유용)
        </h2>
        <div className="space-y-4">
          {settings?.og_image_url ? (
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
            />
            <label
              htmlFor="og-upload"
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:flex-none"
            >
              {isUploadingOg ? (
                <ImSpinner8 className="h-4 w-4 animate-spin" />
              ) : null}
              이미지 업로드
            </label>
            {settings?.og_image_url && (
              <Button
                variant="secondary"
                onClick={() => setConfirmImageType("og")}
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
        onConfirm={async () => {
          if (confirmImageType) {
            await handleRemoveImage(confirmImageType);
            setConfirmImageType(null);
          }
        }}
        title="이미지 삭제"
        description={`${confirmImageType === "hero" ? "메인 이미지" : "OG 이미지"}를 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="danger"
      />
    </div>
  );
}
