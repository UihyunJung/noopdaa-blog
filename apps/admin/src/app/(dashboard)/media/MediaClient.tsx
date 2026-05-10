"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Card, ConfirmModal } from "@noopdaa/ui";
import { formatFileSize } from "@/lib/utils";
import type { Media } from "@/lib/types";
import { ImSpinner8 } from "react-icons/im";
import { uploadMedia, deleteMedia } from "./actions";

interface MediaClientProps {
  initialMedia: Media[];
}

export function MediaClient({ initialMedia }: MediaClientProps) {
  const [confirmTarget, setConfirmTarget] = useState<Media | null>(null);
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const [isUploadPending, startUploadTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    startUploadTransition(async () => {
      const result = await uploadMedia(formData);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { uploaded, failed } = result.data!;
      if (uploaded > 0) {
        toast.success(`${uploaded}개 업로드 완료`);
      }
      failed.forEach((name) => toast.error(`${name} 업로드 실패`));
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setActionTargetId(target.id);
    startDeleteTransition(async () => {
      const result = await deleteMedia(target.id, target.url);
      setActionTargetId(null);
      setConfirmTarget(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("미디어가 삭제되었습니다.");
    });
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
            disabled={isUploadPending}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isUploadPending ? (
              <ImSpinner8 className="h-5 w-5 animate-spin" />
            ) : null}
            이미지 업로드
          </label>
        </div>
      </div>

      {initialMedia.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            업로드된 미디어가 없습니다.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {initialMedia.map((item) => (
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
                    isLoading={actionTargetId === item.id}
                    disabled={isDeletePending}
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
        onConfirm={handleConfirmDelete}
        title="미디어 삭제"
        description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="danger"
        isLoading={isDeletePending}
      />
    </div>
  );
}
