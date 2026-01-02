"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button, Card } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import type { Media, MediaInsert } from "@/lib/types";

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    const { data } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false }) as { data: Media[] | null };
    setMedia(data || []);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);

      await supabase.from("media").insert({
        filename: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
      });
    }

    setIsUploading(false);
    loadMedia();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item: Media) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const urlParts = item.url.split("/");
    const filePath = `uploads/${urlParts[urlParts.length - 1]}`;

    await supabase.storage.from("media").remove([filePath]);
    await supabase.from("media").delete().eq("id", item.id);

    loadMedia();
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL이 복사되었습니다.");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          미디어 관리
        </h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isUploading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
        </div>
      </div>

      {media.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            업로드된 미디어가 없습니다.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {media.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden p-0">
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                <Image
                  src={item.url}
                  alt={item.filename}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(item.url)}
                  >
                    복사
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(item)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
              <div className="p-2 sm:p-3">
                <p className="truncate text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                  {item.filename}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(item.size)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
