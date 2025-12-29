"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

interface UseImageUploadOptions {
  onUploadStart?: () => void;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
  maxWidth?: number;
  maxFileSize?: number;
}

const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 이미지를 Canvas API를 사용하여 리사이징합니다.
 */
async function resizeImage(file: File, maxWidth: number): Promise<File> {
  return new Promise((resolve, reject) => {
    // 이미지가 아니면 원본 반환
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      // 이미지가 maxWidth보다 작으면 원본 반환
      if (img.width <= maxWidth) {
        URL.revokeObjectURL(img.src);
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * ratio);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("이미지를 로드할 수 없습니다."));
    };

    img.src = URL.createObjectURL(file);
  });
}

export function useImageUpload(options?: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);

  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxFileSize = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    // 이미지 타입 검증
    if (!file.type.startsWith("image/")) {
      options?.onUploadError?.(new Error("이미지 파일만 업로드할 수 있습니다."));
      return null;
    }

    // 파일 크기 제한 (리사이징 전)
    if (file.size > maxFileSize) {
      options?.onUploadError?.(
        new Error(`파일 크기가 ${Math.round(maxFileSize / 1024 / 1024)}MB를 초과합니다.`)
      );
      return null;
    }

    setIsUploading(true);
    options?.onUploadStart?.();

    try {
      const supabase = createClient();

      // 이미지 리사이징
      const resizedFile = await resizeImage(file, maxWidth);

      // 파일명 생성 (기존 미디어 관리와 동일한 패턴)
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Supabase Storage 업로드
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, resizedFile);

      if (uploadError) {
        throw new Error(`업로드 실패: ${uploadError.message}`);
      }

      // Public URL 획득
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);

      // media 테이블에 메타데이터 저장
      const { error: dbError } = await supabase.from("media").insert({
        filename: file.name,
        url: publicUrl,
        type: resizedFile.type,
        size: resizedFile.size,
      });

      if (dbError) {
        // 스토리지 업로드는 성공했으나 DB 저장 실패 - 로그만 남기고 진행
        console.error("Media DB insert error:", dbError);
      }

      const result: UploadResult = {
        url: publicUrl,
        filename: file.name,
        size: resizedFile.size,
        type: resizedFile.type,
      };

      options?.onUploadComplete?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("업로드 중 오류가 발생했습니다.");
      options?.onUploadError?.(err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}
