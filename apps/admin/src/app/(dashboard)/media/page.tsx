"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Card, ConfirmModal } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatFileSize } from "@/lib/utils";
import type { Media, MediaInsert } from "@/lib/types";
import { ImSpinner8 } from "react-icons/im";

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Media | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false }) as { data: Media[] | null };
      setMedia(data || []);
    } finally {
      setIsLoading(false);
    }
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
        toast.error(`${file.name} 업로드에 실패했습니다.`);
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
    setDeletingId(item.id);
    try {
      const urlParts = item.url.split("/");
      const filePath = `uploads/${urlParts[urlParts.length - 1]}`;

      await supabase.storage.from("media").remove([filePath]);
      await supabase.from("media").delete().eq("id", item.id);

      await loadMedia();
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL이 복사되었습니다.");
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
              <ImSpinner8 className="h-5 w-5 animate-spin" />
            ) : null}
            이미지 업로드
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : media.length === 0 ? (
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
                    onClick={() => setConfirmTarget(item)}
                    isLoading={deletingId === item.id}
                    disabled={deletingId !== null}
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

      <ConfirmModal
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (confirmTarget) {
            await handleDelete(confirmTarget);
            setConfirmTarget(null);
          }
        }}
        title="미디어 삭제"
        description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="danger"
        isLoading={deletingId !== null}
      />
    </div>
  );
}
