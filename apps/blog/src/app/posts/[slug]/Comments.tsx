"use client";

import { useState, useEffect, useReducer, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@noopdaa/ui";
import type { Comment } from "@/lib/types";
import { fetchAuthCheck } from "@/lib/auth-client";
import { formatDateDot } from "@/lib/format";
import { HiOutlineArrowUturnLeft, HiOutlinePlus, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

interface CommentsProps {
  postId: string;
}

// 공개 API는 author_email(PII)을 반환하지 않음
type CommentWithAdmin = Omit<Comment, "author_email">;

interface AdminProfile {
  username: string;
  email: string;
  avatar_url: string | null;
}

// 폼 입력 공통 스타일 (종이색 배경, 포커스 시 먹색 테두리)
const fieldClass =
  "h-[42px] w-full rounded-md border border-line bg-paper-2 px-3 text-sm text-ink transition-colors placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-0";
const labelClass = "text-[13px] font-medium text-ink-2";
const submitButtonClass =
  "h-10 rounded-md bg-ink px-[18px] text-sm font-semibold text-paper hover:bg-ink hover:opacity-85 focus:ring-ink";

// 관리자 배지 — 인디고 테두리
function AdminBadge() {
  return (
    <span className="inline-flex h-[18px] items-center rounded-[3px] border border-accent px-1.5 text-[11px] font-semibold tracking-wide text-accent">
      관리자
    </span>
  );
}

// 아바타 — 관리자는 프로필 사진 또는 먹색 원, 방문자는 종이색 원
function Avatar({
  name,
  isAdmin,
  avatarUrl,
}: {
  name: string;
  isAdmin: boolean;
  avatarUrl?: string | null;
}) {
  if (isAdmin && avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${
        isAdmin ? "bg-ink text-paper" : "bg-paper-3 text-ink-2"
      }`}
    >
      {name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

// CommentForm을 외부로 분리하여 리렌더링 시 unmount 방지
interface CommentFormProps {
  parentId?: string | null;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent, parentId: string | null) => void;
  formRef?: React.RefObject<HTMLFormElement | null>;
  isAdmin: boolean;
  adminProfile: AdminProfile | null;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  isSubmitting: boolean;
}

function CommentForm({
  parentId = null,
  onCancel,
  onSubmit,
  formRef,
  isAdmin,
  adminProfile,
  name,
  setName,
  email,
  setEmail,
  content,
  setContent,
  isSubmitting,
}: CommentFormProps) {
  return (
    <form
      ref={formRef}
      onSubmit={(e) => onSubmit(e, parentId)}
      className="flex flex-col gap-3.5 rounded-md border border-line bg-paper-2 p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          {parentId ? "답글 작성" : "댓글 작성"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
        >
          취소
        </button>
      </div>

      {isAdmin ? (
        <div className="flex items-center gap-2.5 rounded-md bg-paper-3 px-3.5 py-2.5">
          <Avatar
            name={adminProfile?.username || "?"}
            isAdmin
            avatarUrl={adminProfile?.avatar_url}
          />
          <span className="text-sm font-semibold text-ink">{adminProfile?.username}</span>
          <AdminBadge />
          <span className="ml-auto text-xs text-ink-3">관리자 이름으로 작성됩니다</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>이름</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
              className={fieldClass}
            />
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>내용</span>
        <textarea
          className="min-h-[92px] w-full rounded-md border border-line bg-paper-2 px-3 py-2.5 text-sm leading-relaxed text-ink transition-colors placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-0"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentId ? "답글을 작성하세요" : "댓글을 작성하세요"}
          required
        />
      </label>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} className={submitButtonClass}>
          {parentId ? "답글 작성" : "댓글 작성"}
        </Button>
      </div>
    </form>
  );
}

// 서버 fetch 결과를 단일 dispatch로 적용하기 위한 reducer
// (react-hooks/set-state-in-effect 규칙 회피용 — useEffect 안에서 setState 여러 번 호출 대신
//  단일 dispatch로 묶음)
type CommentsServerState = {
  comments: CommentWithAdmin[];
  isAdmin: boolean;
  adminProfile: AdminProfile | null;
  publicAdminProfile: { username: string; avatar_url: string | null } | null;
};

type CommentsAction =
  | { type: "INIT"; payload: CommentsServerState }
  | { type: "REFRESH_COMMENTS"; comments: CommentWithAdmin[]; publicAdminProfile: { username: string; avatar_url: string | null } | null };

function commentsReducer(state: CommentsServerState, action: CommentsAction): CommentsServerState {
  switch (action.type) {
    case "INIT":
      return action.payload;
    case "REFRESH_COMMENTS":
      return { ...state, comments: action.comments, publicAdminProfile: action.publicAdminProfile ?? state.publicAdminProfile };
  }
}

const INITIAL_SERVER_STATE: CommentsServerState = {
  comments: [],
  isAdmin: false,
  adminProfile: null,
  publicAdminProfile: null,
};

export function Comments({ postId }: CommentsProps) {
  const [serverState, dispatch] = useReducer(commentsReducer, INITIAL_SERVER_STATE);
  const { comments, isAdmin, adminProfile, publicAdminProfile } = serverState;

  // 폼 입력 및 UI 상태 (서버 데이터와 무관)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const commentFormRef = useRef<HTMLFormElement>(null);
  const replyFormRef = useRef<HTMLFormElement>(null);

  // 댓글 + 관리자 정보를 병렬로 fetch한 뒤 단일 dispatch로 반영
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [commentsRes, authRes] = await Promise.all([
        fetch(`/api/comments?postId=${postId}`).then((r) => r.json()).catch(() => ({ comments: [], adminProfile: null })),
        // Header와 요청을 공유한다 (auth-client 참고)
        fetchAuthCheck(),
      ]);
      if (cancelled) return;
      dispatch({
        type: "INIT",
        payload: {
          comments: commentsRes.comments || [],
          publicAdminProfile: commentsRes.adminProfile || null,
          isAdmin: !!authRes.isAdmin,
          adminProfile: authRes.profile || null,
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // 답글 폼이 열리면 스크롤
  useEffect(() => {
    if (replyTo && replyFormRef.current) {
      replyFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [replyTo]);

  // 댓글 작성 후 목록만 다시 가져오기 (작성 핸들러에서 호출 — useEffect 밖이라 규칙 무관)
  const refreshComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      dispatch({
        type: "REFRESH_COMMENTS",
        comments: data.comments || [],
        publicAdminProfile: data.adminProfile || null,
      });
    } catch {
      // 무시 (사용자가 페이지 새로고침으로 복구 가능)
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();

    // 중복 클릭 방지
    if (isSubmitting) return;

    const authorName = isAdmin ? adminProfile?.username || "관리자" : name;
    const authorEmail = isAdmin ? adminProfile?.email || "" : email;

    if (!isAdmin && (!name.trim() || !email.trim())) return;
    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      // 서버 API로 댓글 작성
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId,
          authorName,
          authorEmail,
          content,
          isAdmin,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "댓글 작성에 실패했습니다.");
        return;
      }

      // 관리자가 아닌 경우에만 이메일 알림 발송
      // 서버가 commentId로 DB에서 직접 내용을 조회하므로 본문은 보내지 않음
      if (!isAdmin && data.comment?.id) {
        try {
          await fetch("/api/comments/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commentId: data.comment.id }),
          });
        } catch (e) {
          console.error("Failed to send notification:", e);
        }
      }

      // 폼 초기화
      setContent("");
      setReplyTo(null);
      setShowCommentForm(false);

      if (!isAdmin) {
        setName("");
        setEmail("");
      }

      // 댓글 목록 새로고침 후 하이라이트
      await refreshComments();

      const newComment = data.comment;
      if (newComment?.id) {
        setHighlightedCommentId(newComment.id);

        // 새 댓글로 스크롤
        setTimeout(() => {
          const commentElement = document.getElementById(`comment-${newComment.id}`);
          if (commentElement) {
            commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);

        // 2초 후 하이라이트 제거
        setTimeout(() => {
          setHighlightedCommentId(null);
        }, 2000);
      }
    } finally {
      // 모든 작업 완료 후 로딩 상태 해제
      setIsSubmitting(false);
    }
  };

  const handleReplyClick = (commentId: string) => {
    setReplyTo(commentId);
    setShowCommentForm(false);
    setContent("");
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setContent("");
  };

  const handleShowCommentForm = () => {
    setShowCommentForm(true);
    setReplyTo(null);
    setContent("");
  };

  const handleCancelComment = () => {
    setShowCommentForm(false);
    setContent("");
  };

  // 댓글을 트리 구조로 정리
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  // CommentForm에 전달할 공통 props
  const commentFormProps = {
    isAdmin,
    adminProfile,
    name,
    setName,
    email,
    setEmail,
    content,
    setContent,
    isSubmitting,
    onSubmit: handleSubmit,
  };

  const renderComment = (comment: CommentWithAdmin, depth = 0) => {
    const isHighlighted = highlightedCommentId === comment.id;
    const replies = getReplies(comment.id);

    return (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className={depth === 0 ? "border-b border-line py-6" : ""}
      >
        {/* 작성 직후 2초간 강조 — 인디고 연한 배경 + 왼쪽 인디고 선 */}
        <div
          className={`transition-all duration-500 ${
            isHighlighted
              ? "-mx-4 rounded-md bg-accent-soft px-4 py-3 shadow-[inset_2px_0_0_var(--accent)]"
              : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={comment.author_name}
                isAdmin={!!comment.is_admin}
                avatarUrl={comment.is_admin ? publicAdminProfile?.avatar_url : null}
              />
              <span className="text-sm font-semibold text-ink">{comment.author_name}</span>
              {comment.is_admin && <AdminBadge />}
            </div>
            <time className="font-mono text-xs text-ink-3" dateTime={comment.created_at}>
              {formatDateDot(comment.created_at)}
            </time>
          </div>
          <p className="mt-3 whitespace-pre-wrap pl-[42px] text-[15px] leading-relaxed text-ink">
            {comment.content}
          </p>
          <button
            onClick={() => handleReplyClick(comment.id)}
            className="ml-[42px] mt-3 flex items-center gap-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-accent"
          >
            <HiOutlineArrowUturnLeft className="h-3.5 w-3.5" />
            답글
          </button>
        </div>

        {/* 이 댓글에 대한 답글 폼 */}
        {replyTo === comment.id && (
          <div className="ml-[42px] mt-5 border-l border-line pl-5">
            <CommentForm
              {...commentFormProps}
              parentId={comment.id}
              onCancel={handleCancelReply}
              formRef={replyFormRef}
            />
          </div>
        )}

        {/* 답글 목록 — 왼쪽 세로선으로 들여쓰기 */}
        {replies.length > 0 && (
          <div className="ml-[42px] mt-5 flex flex-col gap-5 border-l border-line pl-5">
            {replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between border-b border-ink pb-3.5">
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-serif text-[22px] font-semibold text-ink">댓글</h2>
          {comments.length > 0 && (
            <span className="font-mono text-[13px] text-ink-3">{comments.length}</span>
          )}
        </div>
        {!showCommentForm && !replyTo && (
          <button
            onClick={handleShowCommentForm}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-paper-3"
          >
            <HiOutlinePlus className="h-3.5 w-3.5" />
            댓글 쓰기
          </button>
        )}
      </div>

      {/* 댓글 작성 폼 (상단) */}
      {showCommentForm && (
        <div className="mt-5">
          <CommentForm
            {...commentFormProps}
            onCancel={handleCancelComment}
            formRef={commentFormRef}
          />
        </div>
      )}

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div>{rootComments.map((comment) => renderComment(comment))}</div>
      ) : (
        <div className="flex flex-col items-center gap-3 border-b border-line py-11 text-ink-3">
          <HiOutlineChatBubbleLeftRight className="h-7 w-7" />
          <p className="text-sm">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
        </div>
      )}
    </section>
  );
}
