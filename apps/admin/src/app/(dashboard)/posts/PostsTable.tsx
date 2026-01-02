"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";

interface PostsTableProps {
  posts: (Post & { categories: { name: string } | null })[];
}

export function PostsTable({ posts }: PostsTableProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", id);
    router.refresh();
  };

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 모바일 카드 뷰 */}
      <div className="space-y-4 md:hidden">
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                className="font-medium text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
              >
                {post.title}
              </Link>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  post.status === "published"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {post.status === "published" ? "발행됨" : "임시저장"}
              </span>
            </div>
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              {post.categories?.name && (
                <span>{post.categories.name}</span>
              )}
              <span>조회 {post.view_count.toLocaleString()}</span>
              <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
            </div>
            <div className="flex gap-2">
              <Link href={`/posts/${post.id}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  수정
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(post.id)}
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱 테이블 뷰 */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                카테고리
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                조회수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                작성일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="font-medium text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                  >
                    {post.title}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {post.categories?.name || "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      post.status === "published"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {post.status === "published" ? "발행됨" : "임시저장"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {post.view_count.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/posts/${post.id}/edit`}>
                      <Button variant="outline" size="sm">
                        수정
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
