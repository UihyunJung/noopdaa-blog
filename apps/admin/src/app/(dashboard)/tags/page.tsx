"use client";

import { useState, useEffect } from "react";
import { Button, Input, Card } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/lib/types";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const { data } = await supabase.from("tags").select("*").order("name") as { data: Tag[] | null };
    setTags(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    const tagData = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
    };

    if (editingId) {
      await supabase.from("tags").update(tagData).eq("id", editingId);
    } else {
      await supabase.from("tags").insert(tagData);
    }

    setName("");
    setSlug("");
    setEditingId(null);
    setIsLoading(false);
    loadTags();
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setSlug(tag.slug);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("tags").delete().eq("id", id);
    loadTags();
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setSlug("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        태그 관리
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
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
            <Input
              label="슬러그"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tag-slug"
            />
            <div className="flex gap-2">
              <Button type="submit" isLoading={isLoading}>
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
          {tags.length === 0 ? (
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
                  <div className="hidden gap-1 group-hover:flex">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-gray-500 hover:text-primary-600"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
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
