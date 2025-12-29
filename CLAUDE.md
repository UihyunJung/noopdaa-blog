# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 작성 규칙

- **모든 문서와 주석은 한국어로 작성한다**
- 코드 내 주석, README, 커밋 메시지 설명 등 모두 한국어 사용

## 프로젝트 개요

Noopdaa Blog는 Turborepo 모노레포로 구성된 블로그 플랫폼입니다. 공개 블로그와 관리자 대시보드로 구성되어 있으며, Next.js 16, React 19, Supabase, TailwindCSS를 사용합니다.

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

# 데이터베이스 타입 (packages/database 에서)
pnpm generate-types   # Supabase 타입 재생성
```

## 아키텍처

```
apps/
├── blog/             # 공개 블로그 (포트 3000)
│   └── src/app/      # 포스트, 댓글, RSS, 사이트맵
└── admin/            # 관리자 대시보드 (포트 3001)
    └── src/app/      # 포스트 에디터, 미디어, 카테고리, 태그, 댓글 관리

packages/
├── ui/               # 공유 컴포넌트 (Button, Input, Card, Spinner)
├── database/         # Supabase 클라이언트 & 타입
└── config/           # 공유 tsconfig & tailwind 설정
```

## 주요 패턴

**Supabase 클라이언트 사용:**
- 브라우저: `createClient()` - `@/lib/supabase/client`
- 서버: `createServerClient()` - `@/lib/supabase/server`

**패키지 간 import:**
- UI: `import { Button, Card } from "@noopdaa/ui"`
- 타입: `import type { Post, Category } from "@/lib/types"` (로컬 re-export)

**마크다운 에디터 (admin):**
- `@uiw/react-md-editor` 사용, 커스텀 이미지 업로드 지원
- 드래그 앤 드롭, 붙여넣기, 미디어 라이브러리 선택 지원
- 이미지 업로드 시 최대 1920px로 자동 리사이징

**마크다운 렌더링 (blog):**
- `react-markdown` + `remark-gfm` + `rehype-highlight`
- `highlight.js`로 코드 하이라이팅

## 데이터베이스 스키마

테이블: `posts`, `categories`, `tags`, `post_tags`, `comments`, `media`, `profiles`

스토리지: `media` 버킷 (경로: `uploads/{timestamp}-{random}.{ext}`)

## 환경 변수

`.env.local`에 필요한 변수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY` (이메일 알림용)
- `ADMIN_EMAIL`
- `EMAIL_FROM`
