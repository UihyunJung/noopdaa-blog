"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Card, Input, ConfirmModal } from "@noopdaa/ui";
import { ImSpinner8 } from "react-icons/im";
import { updateUsername, uploadAvatar, removeAvatar } from "./actions";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

interface ProfileClientProps {
  profile: Profile;
}

export function ProfileClient({ profile }: ProfileClientProps) {
  const [username, setUsername] = useState(profile.username);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSavePending, startSaveTransition] = useTransition();
  const [isAvatarPending, startAvatarTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveUsername = () => {
    if (!username.trim()) return;
    startSaveTransition(async () => {
      const result = await updateUsername(username);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("닉네임이 저장되었습니다.");
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startAvatarTransition(async () => {
      const result = await uploadAvatar(formData);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("아바타가 업데이트되었습니다.");
    });
  };

  const handleRemoveAvatar = () => {
    startAvatarTransition(async () => {
      const result = await removeAvatar();
      setIsConfirmOpen(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("아바타가 삭제되었습니다.");
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        프로필 설정
      </h1>

      {/* 아바타 섹션 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          프로필 사진
        </h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="아바타"
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl text-gray-400">
                {profile.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
              disabled={isAvatarPending}
            />
            <label
              htmlFor="avatar-upload"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {isAvatarPending ? (
                <ImSpinner8 className="h-4 w-4 animate-spin" />
              ) : null}
              사진 변경
            </label>
            {profile.avatar_url && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isAvatarPending}
              >
                사진 삭제
              </Button>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          블로그 댓글에 표시될 프로필 사진입니다.
        </p>
      </Card>

      {/* 닉네임 섹션 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          닉네임
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="닉네임을 입력하세요"
            />
          </div>
          <Button
            onClick={handleSaveUsername}
            isLoading={isSavePending}
            disabled={!username.trim() || username === profile.username}
            className="w-full sm:w-auto"
          >
            저장
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          블로그 댓글에 표시될 닉네임입니다.
        </p>
      </Card>

      {/* 계정 정보 */}
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          계정 정보
        </h2>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">가입일</dt>
            <dd className="text-sm text-gray-900 dark:text-white">
              {new Date(profile.created_at).toLocaleDateString("ko-KR")}
            </dd>
          </div>
        </dl>
      </Card>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleRemoveAvatar}
        title="아바타 삭제"
        description="아바타를 삭제하시겠습니까?"
        confirmText="삭제"
        variant="danger"
        isLoading={isAvatarPending}
      />
    </div>
  );
}
