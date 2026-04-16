# Noopdaa Blog

Turborepo 기반의 모던 블로그 플랫폼입니다.

## 기술 스택

- **프레임워크**: Next.js 16, React 19
- **언어**: TypeScript
- **스타일링**: TailwindCSS, Sass
- **데이터베이스**: Supabase (PostgreSQL + Auth + Storage)
- **빌드**: Turborepo, pnpm
- **최적화**: React Compiler
- **이메일**: Resend
- **AI**: Google Gemini 2.5 Flash (slug 생성)

## 프로젝트 구조

```
apps/
├── blog/          # 공개 블로그 (포트 3000)
└── admin/         # 관리자 대시보드 (포트 3001)

packages/
├── ui/            # 공유 UI 컴포넌트 (Button, Input, Card, Spinner, LoadingSpinner, ConfirmModal)
├── database/      # Supabase 타입 정의 + 공유 타입 별칭
└── config/        # 공유 설정 (TypeScript, TailwindCSS)
```

## 시작하기

### 요구사항

- Node.js >= 18
- pnpm 9.x

### 설치

```bash
pnpm install
```

### 환경 변수 설정

각 앱 폴더에 `.env.local` 파일 생성:

```bash
# apps/blog/.env.local & apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# apps/blog/.env.local (이메일 알림용)
RESEND_API_KEY=your-resend-api-key
ADMIN_EMAIL=admin@example.com
EMAIL_FROM=noreply@example.com

# apps/admin/.env.local (AI slug 생성용)
GEMINI_API_KEY=your-gemini-api-key
```

### 개발 서버 실행

```bash
# 모든 앱 실행
pnpm dev

# 개별 실행
pnpm dev:blog    # http://localhost:3000
pnpm dev:admin   # http://localhost:3001
```

### 빌드

```bash
pnpm build
```

## 주요 기능

### 블로그 (blog)
- SEO 친화적 slug URL (`/posts/stock-average-down-calculator`)
- BlogPosting JSON-LD 구조화 데이터
- ISR (Incremental Static Regeneration, 5분 TTL)
- 마크다운 기반 포스트 렌더링 (코드 문법 하이라이팅)
- 카테고리/태그 필터링, 검색
- 댓글 시스템 (대댓글 지원, 관리자 배지)
- 조회수 추적 (IP 해시 기반, 봇 필터링)
- RSS 피드, 사이트맵 (이미지 포함)
- SEO 최적화 (메타 태그, OG 이미지, canonical URL)
- 다크/라이트 테마
- API rate limiting

### 관리자 (admin)
- 포스트 작성/편집 (마크다운 에디터, 이미지 드래그 앤 드롭)
- AI 기반 영문 slug 자동 생성 (Gemini 2.5 Flash)
- 카테고리/태그/댓글/미디어 관리
- 방문자 통계 대시보드 (일별 조회수, 디바이스, 브라우저, 유입경로)
- 블로그 설정 (히어로 슬라이드, OG 이미지)
- 세션 기반 인증 + 비활성 타임아웃

## 라이선스

MIT
