"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@noopdaa/ui";
import { MediaLibraryModal } from "./MediaLibraryModal";
import {
  HiOutlineXMark,
  HiOutlineArrowUpTray,
  HiOutlinePhoto,
  HiOutlineLightBulb,
} from "react-icons/hi2";
import { ImSpinner8 } from "react-icons/im";

// 썸네일 데이터 타입: 기존 URL 또는 새로 추가된 파일/blob
export interface ThumbnailData {
  type: "url" | "file" | "blob";
  value: string; // URL 또는 미리보기용 object URL
  file?: File; // type이 "file"일 때 원본 파일
  blob?: Blob; // type이 "blob"일 때 원본 blob (AI 생성)
  filename?: string; // 저장 시 사용할 파일명
}

interface ThumbnailPickerProps {
  value: ThumbnailData | null;
  onChange: (data: ThumbnailData | null) => void;
  markdownContent?: string; // AI 생성을 위한 마크다운 내용
}

export function ThumbnailPicker({
  value,
  onChange,
  markdownContent = "",
}: ThumbnailPickerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 언마운트 시 object URL 정리
  useEffect(() => {
    return () => {
      if (value && (value.type === "file" || value.type === "blob")) {
        URL.revokeObjectURL(value.value);
      }
    };
  }, []);

  // 파일 선택 처리 (미리보기만, 저장 시 업로드)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // 기존 object URL 정리
    if (value && (value.type === "file" || value.type === "blob")) {
      URL.revokeObjectURL(value.value);
    }

    // 미리보기용 object URL 생성
    const previewUrl = URL.createObjectURL(file);

    onChange({
      type: "file",
      value: previewUrl,
      file,
      filename: file.name,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 미디어 라이브러리에서 선택 (이미 등록된 URL)
  const handleMediaSelect = (url: string, filename: string) => {
    // 기존 object URL 정리
    if (value && (value.type === "file" || value.type === "blob")) {
      URL.revokeObjectURL(value.value);
    }

    onChange({
      type: "url",
      value: url,
      filename,
    });
    setIsMediaModalOpen(false);
  };

  // AI 이미지 생성 (미리보기만, 저장 시 업로드)
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

      // blob으로 받아서 미리보기 생성
      const blob = await response.blob();

      // 기존 object URL 정리
      if (value && (value.type === "file" || value.type === "blob")) {
        URL.revokeObjectURL(value.value);
      }

      const previewUrl = URL.createObjectURL(blob);
      const filename = `ai-thumbnail-${Date.now()}.png`;

      onChange({
        type: "blob",
        value: previewUrl,
        blob,
        filename,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 썸네일 제거
  const handleRemove = () => {
    if (value && (value.type === "file" || value.type === "blob")) {
      URL.revokeObjectURL(value.value);
    }
    onChange(null);
  };

  const previewUrl = value?.value || "";

  return (
    <div className="space-y-4">
      {/* 썸네일 미리보기 */}
      {previewUrl && (
        <div className="relative">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
            {/* object URL은 next/image에서 사용 불가하므로 img 태그 사용 */}
            <img
              src={previewUrl}
              alt="썸네일 미리보기"
              className="h-full w-full object-cover"
            />
          </div>
          {value?.type !== "url" && (
            <span className="absolute left-2 top-2 rounded bg-yellow-500 px-2 py-0.5 text-xs font-medium text-white">
              미리보기
            </span>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600 transition-colors"
            title="썸네일 삭제"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* 선택 버튼들 */}
      <div className="flex flex-wrap gap-2">
        {/* 파일 선택 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="thumbnail-upload"
        />
        <label
          htmlFor="thumbnail-upload"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <HiOutlineArrowUpTray className="h-4 w-4" />
          파일 선택
        </label>

        {/* 미디어 라이브러리 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsMediaModalOpen(true)}
        >
          <HiOutlinePhoto className="mr-1.5 h-4 w-4" />
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
            <ImSpinner8 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <HiOutlineLightBulb className="mr-1.5 h-4 w-4" />
          )}
          AI 생성
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        파일 선택 또는 AI 생성 이미지는 포스트 저장 시 미디어에 등록됩니다.
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
