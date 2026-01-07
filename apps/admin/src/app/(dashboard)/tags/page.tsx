"use client";

import { useState, useEffect } from "react";
import { Button, Input, Card } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
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
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    };

    if (editingId) {
      await supabase.from("tags").update(tagData).eq("id", editingId);
    } else {
      await supabase.from("tags").insert(tagData);
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
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await supabase.from("tags").delete().eq("id", id);
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
                      onClick={() => handleDelete(tag.id)}
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
    </div>
  );
}
