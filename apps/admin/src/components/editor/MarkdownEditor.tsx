"use client";

import { useCallback, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { ICommand } from "@uiw/react-md-editor";
import { useImageUpload } from "@/hooks/useImageUpload";
import { MediaLibraryModal } from "./MediaLibraryModal";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  height = 500,
}: MarkdownEditorProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const { uploadImage } = useImageUpload({
    onUploadStart: () => setUploadingCount((c) => c + 1),
    onUploadComplete: () => setUploadingCount((c) => c - 1),
    onUploadError: (error) => {
      setUploadingCount((c) => c - 1);
      alert(`업로드 실패: ${error.message}`);
    },
  });

  // 이미지 파일 처리 공통 함수
  const handleImageUpload = useCallback(
    async (file: File) => {
      const placeholder = `![업로드 중: ${file.name}...](uploading-${Date.now()})`;

      // 현재 커서 위치에 플레이스홀더 삽입
      const newValue = valueRef.current + "\n" + placeholder;
      onChange(newValue);

      const result = await uploadImage(file);

      // 플레이스홀더를 실제 이미지로 교체
      if (result) {
        onChange(
          valueRef.current.replace(
            placeholder,
            `![${file.name}](${result.url})`
          )
        );
      } else {
        // 실패 시 플레이스홀더 제거
        onChange(
          valueRef.current
            .replace(placeholder + "\n", "")
            .replace("\n" + placeholder, "")
            .replace(placeholder, "")
        );
      }
    },
    [uploadImage, onChange]
  );

  // 여러 파일 처리
  const handleImageFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );

      for (const file of imageFiles) {
        await handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  // Paste 핸들러
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        event.preventDefault();
        await handleImageFiles(imageFiles);
      }
    },
    [handleImageFiles]
  );

  // Drop 핸들러
  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files) return;

      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );

      if (imageFiles.length > 0) {
        event.preventDefault();
        await handleImageFiles(imageFiles);
      }
    },
    [handleImageFiles]
  );

  // 미디어 라이브러리에서 선택
  const handleMediaLibrarySelect = useCallback(
    (url: string, filename: string) => {
      const imageMarkdown = `![${filename}](${url})`;
      onChange(valueRef.current + "\n" + imageMarkdown);
    },
    [onChange]
  );

  // 커스텀 이미지 업로드 커맨드
  const imageUploadCommand: ICommand = {
    name: "image-upload",
    keyCommand: "image-upload",
    buttonProps: {
      "aria-label": "이미지 업로드",
      title: "이미지 업로드",
    },
    icon: (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    ),
    execute: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          await handleImageFiles(files);
        }
      };
      input.click();
    },
  };

  // 미디어 라이브러리 커맨드
  const mediaLibraryCommand: ICommand = {
    name: "media-library",
    keyCommand: "media-library",
    buttonProps: {
      "aria-label": "미디어 라이브러리",
      title: "미디어 라이브러리에서 선택",
    },
    icon: (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
        <path d="M20 4v12H8V4h12m0-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 9.67l1.69 2.26 2.48-3.1L19 15H9zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
      </svg>
    ),
    execute: () => {
      setIsMediaLibraryOpen(true);
    },
  };

  // 기본 이미지 커맨드를 커스텀 커맨드로 교체
  const commandsFilter = useCallback(
    (command: ICommand) => {
      if (command.name === "image") {
        return imageUploadCommand;
      }
      return command;
    },
    [handleImageFiles]
  );

  // extraCommands에 미디어 라이브러리 추가
  const extraCommands: ICommand[] = [mediaLibraryCommand];

  return (
    <div className="relative">
      {/* 업로드 중 인디케이터 */}
      {uploadingCount > 0 && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white shadow-lg">
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
          이미지 업로드 중... ({uploadingCount})
        </div>
      )}

      {/* Light Mode Editor */}
      <div data-color-mode="light" className="dark:hidden">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || "")}
          height={height}
          commandsFilter={commandsFilter}
          extraCommands={extraCommands}
          textareaProps={{
            onPaste: handlePaste,
            onDrop: handleDrop,
            onDragOver: (e) => e.preventDefault(),
            placeholder:
              "마크다운을 입력하세요. 이미지는 붙여넣기 또는 드래그하여 업로드할 수 있습니다.",
          }}
        />
      </div>

      {/* Dark Mode Editor */}
      <div data-color-mode="dark" className="hidden dark:block">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || "")}
          height={height}
          commandsFilter={commandsFilter}
          extraCommands={extraCommands}
          textareaProps={{
            onPaste: handlePaste,
            onDrop: handleDrop,
            onDragOver: (e) => e.preventDefault(),
            placeholder:
              "마크다운을 입력하세요. 이미지는 붙여넣기 또는 드래그하여 업로드할 수 있습니다.",
          }}
        />
      </div>

      {/* 미디어 라이브러리 모달 */}
      <MediaLibraryModal
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={handleMediaLibrarySelect}
      />
    </div>
  );
}
