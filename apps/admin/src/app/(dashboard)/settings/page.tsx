"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button, Card, Input } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";

interface SiteSettings {
  id: string;
  site_name: string;
  site_description: string | null;
  hero_image_url: string | null;
  og_image_url: string | null;
  updated_at: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingOg, setIsUploadingOg] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const ogInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .single();

    if (data) {
      setSettings(data);
      setSiteName(data.site_name);
      setSiteDescription(data.site_description || "");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!settings || !siteName.trim()) return;

    setIsSaving(true);
    setMessage(null);

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
      setMessage({ type: "error", text: "설정 저장에 실패했습니다." });
    } else {
      setMessage({ type: "success", text: "설정이 저장되었습니다." });
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
    setMessage(null);

    const fileExt = file.name.split(".").pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `site/${fileName}`;

    // 기존 이미지 삭제
    if (currentUrl) {
      const oldPath = currentUrl.split("/").slice(-2).join("/");
      await supabase.storage.from("media").remove([oldPath]);
    }

    // 새 이미지 업로드
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file);

    if (uploadError) {
      setUploading(false);
      setMessage({ type: "error", text: "이미지 업로드에 실패했습니다." });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    // 설정 업데이트
    const { error: updateError } = await supabase
      .from("site_settings")
      .update({
        [fieldName]: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    setUploading(false);

    if (updateError) {
      setMessage({ type: "error", text: "설정 업데이트에 실패했습니다." });
    } else {
      setMessage({ type: "success", text: "이미지가 업로드되었습니다." });
      setSettings({ ...settings, [fieldName]: publicUrl });
    }

    // input 초기화
    if (type === "hero" && heroInputRef.current) {
      heroInputRef.current.value = "";
    }
    if (type === "og" && ogInputRef.current) {
      ogInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (type: "hero" | "og") => {
    if (!settings) return;

    const fieldName = type === "hero" ? "hero_image_url" : "og_image_url";
    const currentUrl = type === "hero" ? settings.hero_image_url : settings.og_image_url;
    const label = type === "hero" ? "메인 이미지" : "OG 이미지";

    if (!currentUrl) return;
    if (!confirm(`${label}를 삭제하시겠습니까?`)) return;

    setMessage(null);

    // 스토리지에서 파일 삭제
    const oldPath = currentUrl.split("/").slice(-2).join("/");
    await supabase.storage.from("media").remove([oldPath]);

    // 설정 업데이트
    const { error } = await supabase
      .from("site_settings")
      .update({
        [fieldName]: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) {
      setMessage({ type: "error", text: "이미지 삭제에 실패했습니다." });
    } else {
      setMessage({ type: "success", text: "이미지가 삭제되었습니다." });
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
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        블로그 설정
      </h1>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 기본 정보 */}
      <Card className="p-6">
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
          >
            저장
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          블로그명과 설명은 메타 태그, OG 태그, 헤더, Hero 섹션에 사용됩니다.
        </p>
      </Card>

      {/* 메인 이미지 */}
      <Card className="p-6">
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
          <div className="flex gap-2">
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
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {isUploadingHero ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : null}
              이미지 업로드
            </label>
            {settings?.hero_image_url && (
              <Button
                variant="secondary"
                onClick={() => handleRemoveImage("hero")}
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

      {/* OG 이미지 */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          OG 이미지 (소셜 공유용)
        </h2>
        <div className="space-y-4">
          {settings?.og_image_url ? (
            <div className="relative aspect-[1200/630] max-w-md overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
              <Image
                src={settings.og_image_url}
                alt="OG 이미지"
                fill
                sizes="400px"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-[1200/630] max-w-md items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
              <span className="text-gray-400">이미지 없음</span>
            </div>
          )}
          <div className="flex gap-2">
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
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {isUploadingOg ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : null}
              이미지 업로드
            </label>
            {settings?.og_image_url && (
              <Button
                variant="secondary"
                onClick={() => handleRemoveImage("og")}
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
    </div>
  );
}
