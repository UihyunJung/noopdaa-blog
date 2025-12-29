# Noopdaa Blog

Turborepo 기반의 모던 블로그 플랫폼입니다.

## 기술 스택

- **프레임워크**: Next.js 16, React 19
- **언어**: TypeScript
- **스타일링**: TailwindCSS, Sass
- **데이터베이스**: Supabase (PostgreSQL + Auth + Storage)
- **빌드**: Turborepo, pnpm
- **이메일**: Resend

## 프로젝트 구조

```
apps/
├── blog/          # 공개 블로그 (포트 3000)
└── admin/         # 관리자 대시보드 (포트 3001)

packages/
├── ui/            # 공유 UI 컴포넌트
├── database/      # Supabase 클라이언트 & 타입
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
- 마크다운 기반 포스트 렌더링
- 코드 문법 하이라이팅
- 댓글 시스템
- RSS 피드
- SEO 최적화 (Sitemap, robots.txt)
- 다크/라이트 테마

### 관리자 (admin)
- 포스트 작성/편집 (마크다운 에디터)
- 이미지 드래그 앤 드롭 업로드
- 카테고리/태그 관리
- 댓글 승인/삭제
- 미디어 라이브러리
- 대시보드 통계

## 라이선스

MIT
