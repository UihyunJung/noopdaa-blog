"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button, Input } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";

interface CommentsProps {
  postId: string;
  postTitle?: string;
}

type CommentWithAdmin = Comment & { is_admin?: boolean };

interface AdminProfile {
  username: string;
  email: string;
  avatar_url: string | null;
}

export function Comments({ postId, postTitle }: CommentsProps) {
  const [comments, setComments] = useState<CommentWithAdmin[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  // 관리자 댓글 표시용 프로필 (모든 방문자에게 보여줌)
  const [publicAdminProfile, setPublicAdminProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadComments();
    checkAdmin();
    loadPublicAdminProfile();
  }, [postId]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      setIsAdmin(true);
      setAdminProfile({
        username: profile?.username || "관리자",
        email: user.email || "",
        avatar_url: profile?.avatar_url || null,
      });
    }
  };

  // 관리자 프로필을 공개적으로 조회 (모든 방문자가 관리자 댓글 아바타를 볼 수 있도록)
  const loadPublicAdminProfile = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .limit(1)
      .single();

    if (profile) {
      setPublicAdminProfile({
        username: profile.username,
        avatar_url: profile.avatar_url,
      });
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });
    setComments((data as CommentWithAdmin[]) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const authorName = isAdmin ? adminProfile?.username || "관리자" : name;
    const authorEmail = isAdmin ? adminProfile?.email || "" : email;

    if (!isAdmin && (!name.trim() || !email.trim())) return;
    if (!content.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      parent_id: replyTo,
      author_name: authorName,
      author_email: authorEmail,
      content,
      is_approved: true,
      is_admin: isAdmin,
    });

    setIsSubmitting(false);

    if (error) {
      alert("댓글 작성에 실패했습니다.");
      return;
    }

    // 관리자가 아닌 경우에만 이메일 알림 발송
    if (!isAdmin && postTitle) {
      try {
        await fetch("/api/comments/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            postTitle,
            authorName,
            content,
            isReply: !!replyTo,
          }),
        });
      } catch (e) {
        // 이메일 발송 실패해도 댓글은 등록됨
        console.error("Failed to send notification:", e);
      }
    }

    // 댓글 목록 새로고침
    loadComments();
    setContent("");
    setReplyTo(null);

    if (!isAdmin) {
      setName("");
      setEmail("");
    }
  };

  // 댓글을 트리 구조로 정리
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  const renderComment = (comment: CommentWithAdmin, depth = 0) => (
    <div
      key={comment.id}
      className={`${depth > 0 ? "ml-8 border-l-2 border-gray-100 pl-4 dark:border-gray-700" : ""}`}
    >
      <div className={`rounded-lg p-4 ${comment.is_admin ? "bg-primary-50 dark:bg-primary-900/20" : "bg-gray-50 dark:bg-gray-800"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {comment.is_admin && (
              publicAdminProfile?.avatar_url ? (
                <Image
                  src={publicAdminProfile.avatar_url}
                  alt={comment.author_name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                  {comment.author_name.charAt(0).toUpperCase()}
                </div>
              )
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {comment.author_name}
            </span>
            {comment.is_admin && (
              <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
                관리자
              </span>
            )}
          </div>
          <time className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(comment.created_at).toLocaleDateString("ko-KR")}
          </time>
        </div>
        <p className="mt-2 text-gray-700 dark:text-gray-300">{comment.content}</p>
        <button
          onClick={() => setReplyTo(comment.id)}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          답글
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {getReplies(comment.id).map((reply) => renderComment(reply, depth + 1))}
      </div>
    </div>
  );

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div className="mt-6 space-y-6">
          {rootComments.map((comment) => renderComment(comment))}
        </div>
      ) : (
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
        </p>
      )}

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {replyTo && (
          <div className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              답글 작성 중
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-sm text-red-500 hover:text-red-600"
            >
              취소
            </button>
          </div>
        )}

        {isAdmin ? (
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 dark:bg-primary-900/20">
            {adminProfile?.avatar_url ? (
              <Image
                src={adminProfile.avatar_url}
                alt={adminProfile.username}
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                {adminProfile?.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {adminProfile?.username}
            </span>
            <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
              관리자
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              로 댓글 작성
            </span>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
            <Input
              type="email"
              label="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            내용
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 작성하세요"
            required
          />
        </div>

        <Button type="submit" isLoading={isSubmitting}>
          댓글 작성
        </Button>
      </form>
    </section>
  );
}
