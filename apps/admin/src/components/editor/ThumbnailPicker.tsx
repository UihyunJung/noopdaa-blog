"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { MediaLibraryModal } from "./MediaLibraryModal";

interface ThumbnailPickerProps {
  value: string;
  onChange: (url: string) => void;
  markdownContent?: string; // AI 생성을 위한 마크다운 내용
}

export function ThumbnailPicker({
  value,
  onChange,
  markdownContent = "",
}: ThumbnailPickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // 파일 업로드 처리 (미디어에도 등록)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error("파일 업로드에 실패했습니다.");
      }

      // Public URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);

      // 미디어 테이블에 등록
      await supabase.from("media").insert({
        filename: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
      });

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 미디어 라이브러리에서 선택
  const handleMediaSelect = (url: string) => {
    onChange(url);
    setIsMediaModalOpen(false);
  };

  // AI 이미지 생성
  const handleAIGenerate = async () => {
    if (!markdownContent.trim()) {
      setError("AI 이미지 생성을 위해 먼저 글 내용을 작성해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: markdownContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "이미지 생성에 실패했습니다.");
      }

      const { url } = await response.json();
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 썸네일 제거
  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-4">
      {/* 썸네일 미리보기 */}
      {value && (
        <div className="relative">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
            <Image
              src={value}
              alt="썸네일 미리보기"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600 transition-colors"
            title="썸네일 삭제"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* 선택 버튼들 */}
      <div className="flex flex-wrap gap-2">
        {/* 파일 업로드 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id="thumbnail-upload"
        />
        <label
          htmlFor="thumbnail-upload"
          className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isUploading ? (
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
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          업로드
        </label>

        {/* 미디어 라이브러리 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsMediaModalOpen(true)}
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          미디어 선택
        </Button>

        {/* AI 이미지 생성 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAIGenerate}
          disabled={isGenerating || !markdownContent.trim()}
          title={!markdownContent.trim() ? "글 내용을 먼저 작성해주세요" : "AI로 썸네일 생성"}
        >
          {isGenerating ? (
            <svg className="mr-1.5 h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
          ) : (
            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
          AI 생성
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        이미지를 직접 업로드하거나, 미디어 라이브러리에서 선택하거나, AI가 글 내용을 기반으로 생성할 수 있습니다.
      </p>

      {/* 미디어 선택 모달 */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
