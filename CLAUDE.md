# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작성 규칙

- **모든 문서와 주석은 한국어로 작성한다**
- 코드 내 주석, README, 커밋 메시지 설명 등 모두 한국어 사용

## 프로젝트 개요

Noopdaa Blog는 Turborepo 모노레포로 구성된 블로그 플랫폼. 공개 블로그(blog)와 관리자 대시보드(admin) 두 개의 Next.js 16 앱과 공유 패키지들로 구성. pnpm 9.x 사용.

## 명령어

```bash
# 개발
pnpm dev              # 모든 앱 실행 (blog:3000, admin:3001)
pnpm dev:blog         # 블로그만 실행
pnpm dev:admin        # 관리자만 실행

# 빌드 & 린트
pnpm build            # 전체 빌드 (Turbo 캐싱 사용)
pnpm lint             # 전체 린트
pnpm clean            # 캐시 및 node_modules 삭제

# 데이터베이스 타입 (packages/database 디렉토리에서 실행)
pnpm generate-types   # Supabase 타입 재생성 → database.types.ts
```

테스트 프레임워크는 설정되어 있지 않음.

## 아키텍처

```
apps/
├── blog/             # 공개 블로그 (포트 3000)
│   └── src/
│       ├── app/      # 포스트, 댓글, RSS, 사이트맵, API 라우트
│       │   └── posts/
│       │       ├── (list)/   # route group: 목록 전용 (loading.tsx 스코프 분리)
│       │       └── [id]/     # 포스트 상세
│       ├── components/  # Header, Footer, PostCard, HeroSection, Comments 등
│       └── lib/      # supabase/, types.ts, database.types.ts, analytics/
└── admin/            # 관리자 대시보드 (포트 3001)
    └── src/
        ├── app/
        │   ├── (auth)/       # /login, /signup (비보호)
        │   └── (dashboard)/  # /dashboard/* (인증 필요)
        ├── components/  # PostEditor, Sidebar, StatsCards 등
        ├── lib/      # supabase/, types.ts, database.types.ts
        └── middleware.ts  # 인증 체크: 미인증 → /login 리다이렉트

packages/
├── ui/               # 공유 컴포넌트 (Button, Input, Card, Spinner) + cn() 유틸
├── database/         # Supabase 클라이언트 팩토리 & auto-generated 타입
└── config/           # 공유 tsconfig & tailwind 설정
```

## 주요 패턴

**Supabase 클라이언트 사용:**
- 브라우저: `createClient()` - `@/lib/supabase/client`
- 서버: `createServerClient()` - `@/lib/supabase/server`
- 쿠키 기반 세션 관리, `NEXT_PUBLIC_COOKIE_DOMAIN`으로 서브도메인 간 세션 공유 가능

**패키지 간 import:**
- UI: `import { Button, Card } from "@noopdaa/ui"`
- 타입: `import type { Post, Category } from "@/lib/types"` (각 앱에서 로컬 re-export)
- 공통 합성 타입: `PostWithCategory`, `SiteSettings`는 `@/lib/types`에 정의 (중복 선언 금지)
- `cn()` 유틸: `import { cn } from "@noopdaa/ui"` (clsx + tailwind-merge)

**admin 공유 유틸 (`@/lib/utils`):**
- `getDateString(offset)` - KST 기준 날짜 문자열 생성 (예: `getDateString(-30)`)
- `formatFileSize(bytes)` - 파일 크기 포맷 (예: `1.5 MB`)
- `generateSlug(name)` - URL slug 생성 (한글 지원)
- `formatDateKR(dateStr)` - 한국어 날짜 포맷

**admin 인증 흐름:**
- `middleware.ts`가 모든 요청에서 세션 체크
- 미인증 → `/login` 리다이렉트, 인증 완료 시 `/login` → `/dashboard` 리다이렉트
- 라우트 그룹: `(auth)` = 공개, `(dashboard)` = 보호

**마크다운:**
- 에디터 (admin): `@uiw/react-md-editor`, 이미지 업로드 시 최대 1920px 자동 리사이징
- 렌더링 (blog): `react-markdown` + `remark-gfm` + `rehype-highlight`

**Toast 알림:**
- `sonner` 라이브러리 사용 (blog, admin 양쪽 설치됨)
- `<Toaster>` 컴포넌트는 각 앱 `layout.tsx`에 포함
- 사용법: `import { toast } from "sonner"` → `toast.success()`, `toast.error()`
- `alert()` 사용 금지, 반드시 `toast`로 대체

**에러 처리 패턴:**
- Supabase 쿼리 후 반드시 `{ data, error }` 구조분해하여 `error` 확인
- 에러 시 `toast.error("메시지")` 호출
- 성공 시 `toast.success("메시지")` 호출 (CUD 작업)

**로딩 상태 처리:**
- 페이지 이동: Next.js `loading.tsx` 파일 사용 (각 라우트별 스켈레톤 UI)
- `loading.tsx`는 같은 레벨의 page + 하위 children까지 Suspense로 감싸므로, 형제 라우트와 스켈레톤이 겹칠 경우 route group `()`으로 스코프 분리 필요
- 필터/검색 등 같은 라우트 내 네비게이션: `useTransition` + `isPending`으로 로딩 표시
- 컴포넌트 로딩: `LoadingSpinner` 컴포넌트 (`@/components/LoadingSpinner`)
- 버튼 로딩: `Button`의 `isLoading` prop 사용
- 삭제/수정 작업: 개별 항목 ID로 로딩 상태 추적 (`deletingId`, `actionLoading`)

**폼 컴포넌트 주의사항:**
- 폼 컴포넌트는 부모 컴포넌트 외부에 정의 (내부 정의 시 상태 변경마다 remount되어 입력 포커스 유실)
- 비동기 작업 시 중복 클릭 방지: `if (isSubmitting) return;` + `try-finally`로 상태 관리
- admin에서 폼 관리: `react-hook-form` 사용

**이미지 최적화:**
- 배경 이미지는 CSS `background-image` 대신 Next.js `Image` 컴포넌트 + `fill` + `object-cover` 사용
- 마크다운 본문 이미지: `PostContent`의 react-markdown `img` 컴포넌트 (외부 URL 대응)
- HeroSection, 포스트 상세 커버 이미지에 `priority` 속성 적용

**Dynamic Import:**
- 큰 클라이언트 라이브러리(Swiper, react-markdown 등)는 `next/dynamic`으로 동적 로드
- `export const dynamic = "force-dynamic"`와 이름 충돌 시 `import nextDynamic from "next/dynamic"` 사용

**캐싱 전략:**
- 블로그 홈: `revalidate = 3600` (1시간)
- 포스트 목록: `force-dynamic` (검색/필터 지원)
- 포스트 상세: `force-dynamic` (실시간 조회수 반영)
- admin 통계: `revalidate = 60` (1분)

**다크모드:**
- `next-themes` 사용, class 기반 (`darkMode: "class"`)
- 커스텀 primary 컬러 팔레트 (indigo 계열)

## 데이터베이스 스키마

테이블: `posts`, `categories`, `tags`, `post_tags`, `comments`, `media`, `profiles`, `page_views`, `site_settings`

- `posts`: status ENUM (`draft`/`published`), `slug` UNIQUE, `updated_at` 자동 갱신 트리거
- `posts.view_count`: `page_views` INSERT 시 DB 트리거(`sync_post_view_count`)로 자동 +1 (RPC 직접 호출 금지)
- `comments`: `is_approved` 기본값 false (승인 필요), `parent_id`로 대댓글 지원
- `post_tags`: 다대다 관계 조인 테이블
- RLS 정책: 공개 데이터 SELECT 허용, CUD는 인증 필요

스토리지: `media` 버킷 (경로: `uploads/{timestamp}-{random}.{ext}`)

**날짜/시간 기준:**
- 통계, 방문자 집계 등 날짜 기준은 한국 시간(KST, UTC+9)
- `toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })` 사용 (`toISOString()` 사용 금지)

스키마 파일: `supabase/schema.sql`, 마이그레이션: `supabase/migrations/`

## 환경 변수

`.env.local`에 필요한 변수 (각 앱 디렉토리에 별도 생성):

**공통 (blog & admin):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_COOKIE_DOMAIN` (선택, 서브도메인 세션 공유용)

**blog 전용:**
- `RESEND_API_KEY` (이메일 알림)
- `ADMIN_EMAIL`
- `EMAIL_FROM`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (선택)
- `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` (선택)
