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
pnpm check-env        # turbo.json env 선언 누락 검사 (빌드 시 자동 실행)
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
│       │       └── [slug]/   # 포스트 상세 (slug 기반 URL)
│       ├── components/  # Header, Footer, PostCard, HeroSection, Comments 등
│       └── lib/      # supabase/, types.ts, database.types.ts, analytics/
└── admin/            # 관리자 대시보드 (포트 3001)
    └── src/
        ├── app/
        │   ├── (auth)/       # /login, /signup (비보호)
        │   └── (dashboard)/  # /dashboard/* (인증 필요)
        ├── components/  # PostEditor, Sidebar, StatsCards 등
        ├── lib/      # supabase/, types.ts, database.types.ts
        └── proxy.ts       # 인증 체크: 미인증 → /login 리다이렉트 (Next.js 16 규약)

packages/
├── ui/               # 공유 컴포넌트 (Button, Input, Card, Spinner) + cn() 유틸
├── database/         # Supabase auto-generated 타입 + 공유 타입 별칭 (`@noopdaa/database/types`로 앱에서 re-export)
└── config/           # 공유 tsconfig & tailwind 설정
```

## 주요 패턴

**Supabase 클라이언트 사용:**
- 브라우저: `createClient()` - `@/lib/supabase/client` (blog에서는 `/login`의 로그인·로그아웃에만 사용)
- 서버: `createServerClient()` - `@/lib/supabase/server`
- 빌드: `createBuildClient()` - `@/lib/supabase/build` (generateStaticParams 등 빌드 컨텍스트 전용)
- **blog 댓글**: `Comments.tsx`는 Supabase SDK를 직접 사용하지 않고 서버 API(`/api/auth/check`, `/api/comments`)를 통해 통신. ISR 환경에서 SDK 세션 순환 루프 방지를 위한 설계
- 쿠키 기반 세션 관리, `NEXT_PUBLIC_COOKIE_DOMAIN`으로 서브도메인 간 세션 공유 가능. 값이 접속 중인 호스트와 맞지 않으면 브라우저가 세션 쿠키를 조용히 버리므로, 도메인이 다른 환경에서는 반드시 비워둔다

**관리자 판정 (blog):**
- `isAdminUser()` - `@/lib/auth`. **`ADMIN_EMAIL`과 일치하는 계정만 관리자로 인정한다**
- 세션 존재 여부(`!!user`)로 판정하지 말 것. Supabase anon key는 설계상 공개 값이라, 계정을 만들 수 있는 사람은 누구나 관리자 배지를 달 수 있게 된다
- `ADMIN_EMAIL` 미설정 시 항상 false (fail-closed). 서버 전용 변수라 클라이언트에 노출되지 않는다
- `/api/auth/check`(배지 표시 여부)와 `/api/comments`(INSERT 시 `is_admin`) 양쪽에서 동일하게 사용. 한쪽만 고치면 판정이 어긋난다
- blog `/login`은 로그인 후 `/api/auth/check`로 세션 저장과 관리자 여부를 재확인하고, 실패 시 `signOut()` 후 에러를 표시한다 (쿠키가 저장되지 않았는데 성공한 것처럼 보이는 상황 방지)

**패키지 간 import:**
- UI: `import { Button, Card, LoadingSpinner } from "@noopdaa/ui"`
- 타입: `import type { Post, Category } from "@/lib/types"` (각 앱에서 `@noopdaa/database/types` re-export)
- 공통 합성 타입: `PostWithCategory`, `SiteSettings`는 `@/lib/types`에 정의 (중복 선언 금지)
- `cn()` 유틸: `import { cn } from "@noopdaa/ui"` (clsx + tailwind-merge)

**admin 공유 유틸 (`@/lib/utils`):**
- `getDateString(offset)` - KST 기준 날짜 문자열 생성 (예: `getDateString(-30)`)
- `formatFileSize(bytes)` - 파일 크기 포맷 (예: `1.5 MB`)
- `generateSlug(name)` - URL slug 생성 (한글 지원)
- `formatDateKR(dateStr)` - 한국어 날짜 포맷

**admin 인증 흐름:**
- `proxy.ts`가 모든 요청에서 세션 체크 (Next.js 16에서 middleware → proxy로 명칭 변경)
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
- `confirm()` 사용 금지, 커스텀 확인 모달로 대체

**에러 처리 패턴:**
- Supabase 쿼리 후 반드시 `{ data, error }` 구조분해하여 `error` 확인
- 에러 시 `toast.error("메시지")` 호출
- 성공 시 `toast.success("메시지")` 호출 (CUD 작업)

**로딩 상태 처리:**
- 페이지 이동: Next.js `loading.tsx` 파일 사용 (각 라우트별 스켈레톤 UI)
- `loading.tsx`는 같은 레벨의 page + 하위 children까지 Suspense로 감싸므로, 형제 라우트와 스켈레톤이 겹칠 경우 route group `()`으로 스코프 분리 필요
- 필터/검색 등 같은 라우트 내 네비게이션: `useTransition` + `isPending`으로 로딩 표시
- 컴포넌트 로딩: `LoadingSpinner`, `PageLoadingSpinner` 컴포넌트 (`@noopdaa/ui`)
- 버튼 로딩: `Button`의 `isLoading` prop 사용
- 삭제/수정 작업: 개별 항목 ID로 로딩 상태 추적 (`deletingId`, `actionLoading`)

**폼 컴포넌트 주의사항:**
- 폼 컴포넌트는 부모 컴포넌트 외부에 정의 (내부 정의 시 상태 변경마다 remount되어 입력 포커스 유실)
- 비동기 작업 시 중복 클릭 방지: `if (isSubmitting) return;` + `try-finally`로 상태 관리
- admin 폼 관리: `useState` + 직접 `handleSubmit` 패턴 사용 (`react-hook-form` 미사용)

**이미지 최적화:**
- 배경 이미지는 CSS `background-image` 대신 Next.js `Image` 컴포넌트 + `fill` + `object-cover` 사용
- 마크다운 본문 이미지: `PostContent`의 react-markdown `img` 컴포넌트 (외부 URL 대응)
- HeroSection, 포스트 상세 커버 이미지에 `priority` 속성 적용

**React Compiler:**
- `reactCompiler: true` 활성화됨 (blog, admin 양쪽 `next.config.ts`)
- 자동 메모이제이션이 적용되므로 `useMemo`/`useCallback`이 대부분 불필요
- 수동 `useMemo`/`useCallback`이 남아있어도 해가 되지 않음 (컴파일러가 무시)

**Dynamic Import:**
- 큰 클라이언트 라이브러리(Swiper, react-markdown, recharts 등)는 `next/dynamic`으로 동적 로드
- 서버 컴포넌트에서 `ssr: false`를 사용할 경우 별도 클라이언트 래퍼 파일 필요 (예: `ChartLoaders.tsx`)
- `export const dynamic = "force-dynamic"`와 이름 충돌 시 `import nextDynamic from "next/dynamic"` 사용

**캐싱 전략:**
- 블로그 홈: `revalidate = 3600` (1시간)
- 포스트 목록: `force-dynamic` (검색/필터 지원)
- 포스트 상세: `revalidate = 300` (5분 ISR, 조회수는 PageViewTracker로 비동기 처리)
- admin 통계: `revalidate = 60` (1분)

**다크모드:**
- `next-themes` 사용, class 기반 (`darkMode: "class"`)
- 커스텀 primary 컬러 팔레트 (indigo 계열)

## 데이터베이스 스키마

테이블: `posts`, `categories`, `tags`, `post_tags`, `comments`, `media`, `profiles`, `page_views`, `site_settings`

- `posts`: status ENUM (`draft`/`published`), `slug` UNIQUE, `updated_at` DB 트리거로 자동 갱신 (클라이언트에서 수동 설정 불필요)
- `posts.view_count`: `page_views` INSERT 시 DB 트리거(`sync_post_view_count`)로 자동 +1 (RPC 직접 호출 금지)
- `comments`: `is_approved` DB 기본값 false이나, blog에서 댓글 작성 시 `is_approved: true`로 삽입 (즉시 노출). `parent_id`로 대댓글 지원
- `post_tags`: 다대다 관계 조인 테이블
- RLS 정책: 공개 데이터 SELECT 허용, CUD는 인증 필요

스토리지: `media` 버킷 (경로: `uploads/{timestamp}-{random}.{ext}`)

**날짜/시간 기준:**
- 통계, 방문자 집계, 날짜 표시 등 **날짜 기반 필터/그룹/표시**는 한국 시간(KST, UTC+9) 기준
- 날짜 문자열 생성: `toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })` 사용 (`toISOString()` 사용 금지)
- DB 타임스탬프 필드(`published_at` 등)는 ISO 형식 허용 (서버에서 UTC 저장)

스키마 파일: `supabase/schema.sql`, 마이그레이션: `supabase/migrations/`

## 환경 변수

`.env.local`에 필요한 변수 (각 앱 디렉토리에 별도 생성):

**공통 (blog & admin):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_COOKIE_DOMAIN` (선택, 서브도메인 세션 공유용)

**admin 전용:**
- `GEMINI_API_KEY` (AI slug 생성, 서버 전용)
- `GROQ_API_KEY` (커버 이미지 프롬프트 생성, 서버 전용)

**blog 전용:**
- `RESEND_API_KEY` (이메일 알림)
- `ADMIN_EMAIL`
- `EMAIL_FROM`
- `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` (선택)

### 환경 변수 추가 시 필수 절차

서버 전용 변수(`NEXT_PUBLIC_` 접두사가 **없는** 변수)를 새로 추가할 때는 `turbo.json`의 `tasks.build.env` 배열에도 **반드시 등록**한다.

Turborepo는 2.0부터 strict 모드가 기본이라, 선언되지 않은 변수는 빌드 태스크에 전달되지 않고 캐시 해시에도 반영되지 않는다. 값을 바꿔도 해시가 그대로여서 예전 빌드 결과가 재사용되므로, preview 설정이 production에 그대로 배포되는 사고로 이어질 수 있다.

`NEXT_PUBLIC_*`는 Turborepo 프레임워크 추론이 자동 포함하므로 별도 선언이 필요 없다.

등록해야 할 곳:

| 위치 | 목적 |
|---|---|
| `apps/*/.env.local` | 로컬 개발 |
| `apps/*/.env.example` | 문서화 |
| `turbo.json`의 `tasks.build.env` | strict 모드 전달 + 캐시 해시 |
| Vercel 프로젝트 Environment Variables | 배포 런타임 |

Vercel 등록 시 API 키는 **Secret** 유형(값 재확인 불가, 빌드 로그 자동 마스킹)으로 하고 **Production 환경을 반드시 체크**한다. Secret은 Development 환경을 지원하지 않으므로 로컬은 `.env.local`을 사용한다. 등록 후 재배포해야 반영된다.

`turbo.json` 등록 누락은 `scripts/check-env.mjs`가 자동으로 잡는다. 소스의 `process.env` 참조와 `.env.example` 키를 `turbo.json` 선언과 대조하며, 각 앱의 `build` 스크립트 앞단에서 실행되므로 **누락 시 Vercel 배포가 실패**한다. 로컬에서는 `pnpm check-env`로 단독 실행할 수 있다.
