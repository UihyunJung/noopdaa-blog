"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name") as { data: Category[] | null };
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    const categoryData = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description: description || null,
    };

    if (editingId) {
      await supabase.from("categories").update(categoryData).eq("id", editingId);
    } else {
      await supabase.from("categories").insert(categoryData);
    }

    setName("");
    setSlug("");
    setDescription("");
    setEditingId(null);
    setIsLoading(false);
    loadCategories();
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadCategories();
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        카테고리 관리
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
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
            카테고리 목록
          </h2>
          {categories.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              카테고리가 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      /{category.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      수정
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
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
    </div>
  );
}
