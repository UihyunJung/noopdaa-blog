"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Card, Input, ConfirmModal } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { ImSpinner8 } from "react-icons/im";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setUsername(data.username);
      }
    }
    setIsLoading(false);
  };

  const handleSaveUsername = async () => {
    if (!profile || !username.trim()) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", profile.id);

    setIsSaving(false);

    if (error) {
      toast.error("닉네임 저장에 실패했습니다.");
    } else {
      toast.success("닉네임이 저장되었습니다.");
      setProfile({ ...profile, username: username.trim() });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    if (profile.avatar_url) {
      const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
      await supabase.storage.from("media").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file);

    if (uploadError) {
      setIsUploading(false);
      toast.error("아바타 업로드에 실패했습니다.");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    setIsUploading(false);

    if (updateError) {
      toast.error("프로필 업데이트에 실패했습니다.");
    } else {
      toast.success("아바타가 업데이트되었습니다.");
      setProfile({ ...profile, avatar_url: publicUrl });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile || !profile.avatar_url) return;

    setIsUploading(true);

    const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
    await supabase.storage.from("media").remove([oldPath]);

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", profile.id);

    setIsUploading(false);

    if (error) {
      toast.error("아바타 삭제에 실패했습니다.");
    } else {
      toast.success("아바타가 삭제되었습니다.");
      setProfile({ ...profile, avatar_url: null });
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
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="아바타"
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl text-gray-400">
                {profile?.username?.charAt(0)?.toUpperCase() || "?"}
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
            />
            <label
              htmlFor="avatar-upload"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {isUploading ? (
                <ImSpinner8 className="h-4 w-4 animate-spin" />
              ) : null}
              사진 변경
            </label>
            {profile?.avatar_url && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isUploading}
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
            isLoading={isSaving}
            disabled={!username.trim() || username === profile?.username}
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
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("ko-KR")
                : "-"}
            </dd>
          </div>
        </dl>
      </Card>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          await handleRemoveAvatar();
          setIsConfirmOpen(false);
        }}
        title="아바타 삭제"
        description="아바타를 삭제하시겠습니까?"
        confirmText="삭제"
        variant="danger"
        isLoading={isUploading}
      />
    </div>
  );
}
