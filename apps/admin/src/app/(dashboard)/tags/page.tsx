"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Input, Card, ConfirmModal } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { generateSlug } from "@/lib/utils";
import type { Tag } from "@/lib/types";
import { HiOutlinePencilSquare, HiOutlineXMark } from "react-icons/hi2";
import { ImSpinner8 } from "react-icons/im";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsPageLoading(true);
    try {
      const { data } = await supabase.from("tags").select("*").order("name") as { data: Tag[] | null };
      setTags(data || []);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    const tagData = {
      name,
      slug: generateSlug(name),
    };

    if (editingId) {
      const { error } = await supabase.from("tags").update(tagData).eq("id", editingId);
      if (error) {
        toast.error("태그 수정에 실패했습니다.");
        setIsLoading(false);
        return;
      }
      toast.success("태그가 수정되었습니다.");
    } else {
      const { error } = await supabase.from("tags").insert(tagData);
      if (error) {
        toast.error("태그 추가에 실패했습니다.");
        setIsLoading(false);
        return;
      }
      toast.success("태그가 추가되었습니다.");
    }

    setName("");
    setEditingId(null);
    setIsLoading(false);
    loadTags();
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) {
        toast.error("태그 삭제에 실패했습니다.");
        return;
      }
      toast.success("태그가 삭제되었습니다.");
      await loadTags();
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
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
              <Button type="submit" isLoading={isLoading} className="flex-1 sm:flex-none">
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
          {isPageLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : tags.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">태그가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
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
                      disabled={deletingId !== null}
                    >
                      <HiOutlinePencilSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmTarget(tag.id)}
                      className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                      disabled={deletingId !== null}
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
        onConfirm={async () => {
          if (confirmTarget) {
            await handleDelete(confirmTarget);
            setConfirmTarget(null);
          }
        }}
        title="태그 삭제"
        description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="danger"
        isLoading={deletingId !== null}
      />
    </div>
  );
}
