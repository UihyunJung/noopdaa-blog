"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Input, Card, ConfirmModal } from "@noopdaa/ui";
import type { Category } from "@/lib/types";
import { createCategory, updateCategory, deleteCategory } from "./actions";

interface CategoriesClientProps {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startSubmitTransition(async () => {
      const input = { name, slug, description };
      const result = editingId
        ? await updateCategory(editingId, input)
        : await createCategory(input);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(editingId ? "카테고리가 수정되었습니다." : "카테고리가 추가되었습니다.");
      resetForm();
    });
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
  };

  const handleConfirmDelete = () => {
    if (!confirmTarget) return;
    const id = confirmTarget;
    setDeletingId(id);
    startDeleteTransition(async () => {
      const result = await deleteCategory(id);
      setDeletingId(null);
      setConfirmTarget(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("카테고리가 삭제되었습니다.");
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
        카테고리 관리
      </h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            {editingId ? "카테고리 수정" : "새 카테고리"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="카테고리 이름"
              required
            />
            <Input
              label="슬러그"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="category-slug"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                설명
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="카테고리 설명"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" isLoading={isSubmitPending} className="flex-1 sm:flex-none">
                {editingId ? "수정" : "추가"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            카테고리 목록
          </h2>
          {initialCategories.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              카테고리가 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {initialCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      /{category.slug}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      className="flex-1 sm:flex-none"
                    >
                      수정
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmTarget(category.id)}
                      className="flex-1 sm:flex-none"
                      isLoading={deletingId === category.id}
                      disabled={isDeletePending}
                    >
                      삭제
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <ConfirmModal
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmDelete}
        title="카테고리 삭제"
        description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="danger"
        isLoading={isDeletePending}
      />
    </div>
  );
}
