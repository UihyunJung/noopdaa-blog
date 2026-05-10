"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Input, Card, ConfirmModal } from "@noopdaa/ui";
import type { Tag } from "@/lib/types";
import { HiOutlinePencilSquare, HiOutlineXMark } from "react-icons/hi2";
import { ImSpinner8 } from "react-icons/im";
import { createTag, updateTag, deleteTag } from "./actions";

interface TagsClientProps {
  initialTags: Tag[];
}

export function TagsClient({ initialTags }: TagsClientProps) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startSubmitTransition(async () => {
      const result = editingId
        ? await updateTag(editingId, name)
        : await createTag(name);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(editingId ? "태그가 수정되었습니다." : "태그가 추가되었습니다.");
      setName("");
      setEditingId(null);
    });
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
  };

  const handleConfirmDelete = () => {
    if (!confirmTarget) return;
    const id = confirmTarget;
    setDeletingId(id);
    startDeleteTransition(async () => {
      const result = await deleteTag(id);
      setDeletingId(null);
      setConfirmTarget(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("태그가 삭제되었습니다.");
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        태그 관리
      </h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            {editingId ? "태그 수정" : "새 태그"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="태그 이름"
              required
            />
            <div className="flex gap-2">
              <Button type="submit" isLoading={isSubmitPending} className="flex-1 sm:flex-none">
                {editingId ? "수정" : "추가"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  취소
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            태그 목록
          </h2>
          {initialTags.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">태그가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {initialTags.map((tag) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-700"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tag.name}
                  </span>
                  <div className="flex gap-1 sm:hidden sm:group-hover:flex">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-gray-500 hover:text-primary-600"
                      disabled={isDeletePending}
                    >
                      <HiOutlinePencilSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmTarget(tag.id)}
                      className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                      disabled={isDeletePending}
                    >
                      {deletingId === tag.id ? (
                        <ImSpinner8 className="h-4 w-4 animate-spin" />
                      ) : (
                        <HiOutlineXMark className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <ConfirmModal
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmDelete}
        title="태그 삭제"
        description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="danger"
        isLoading={isDeletePending}
      />
    </div>
  );
}
