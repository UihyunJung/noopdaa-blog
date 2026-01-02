"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi2";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface HeroPost {
  id: string;
  title: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  categories: { name: string; slug: string } | null;
}

interface HeroSectionProps {
  siteName: string;
  siteDescription: string | null;
  heroImageUrl: string | null;
  heroPosts: HeroPost[];
}

// 고정 높이 클래스
const HERO_HEIGHT = "h-[420px] sm:h-[480px] lg:h-[520px]";

export function HeroSection({
  siteName,
  siteDescription,
  heroImageUrl,
  heroPosts,
}: HeroSectionProps) {
  // 슬라이드가 1개뿐이면 (블로그 대문만 있는 경우) Swiper 없이 렌더링
  const hasHeroPosts = heroPosts.length > 0;

  if (!hasHeroPosts) {
    // 기존 블로그 대문만 표시
    return (
      <section className={`relative overflow-hidden ${HERO_HEIGHT}`}>
        {/* 배경 이미지 */}
        {heroImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/50" />
          </div>
        )}

        {/* 배경 그라데이션 (이미지 없을 때) */}
        {!heroImageUrl && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100/50 dark:from-primary-950/20 dark:via-zinc-900 dark:to-zinc-900" />
            <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-900/20" />
            <div className="absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-800/10" />
          </>
        )}

        <div className="relative flex h-full items-center">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h1
                className={`text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${
                  heroImageUrl ? "text-white" : "text-zinc-900 dark:text-white"
                }`}
              >
                {siteName}
              </h1>
              {siteDescription && (
                <p
                  className={`mt-4 line-clamp-2 text-base leading-relaxed sm:mt-5 sm:text-lg ${
                    heroImageUrl
                      ? "text-zinc-200"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {siteDescription}
                </p>
              )}
              <div className="mt-6 flex gap-4 sm:mt-8">
                <Link
                  href="/posts"
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-600/30 sm:px-6 sm:py-3"
                >
                  포스트 보기
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Swiper 슬라이드 렌더링
  return (
    <section className={`relative ${HERO_HEIGHT}`}>
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={{
          delay: 7000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        loop={true}
        className="hero-swiper h-full"
      >
        {/* 블로그 대문 슬라이드 */}
        <SwiperSlide>
          <div className="relative h-full overflow-hidden">
            {/* 배경 이미지 */}
            {heroImageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImageUrl})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/50" />
              </div>
            )}

            {/* 배경 그라데이션 (이미지 없을 때) */}
            {!heroImageUrl && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
            )}

            <div className="relative flex h-full items-center">
              <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
                <div className="max-w-2xl">
                  <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {siteName}
                  </h2>
                  {siteDescription && (
                    <p className="mt-4 line-clamp-2 text-base leading-relaxed text-zinc-200 sm:mt-5 sm:text-lg">
                      {siteDescription}
                    </p>
                  )}
                  <div className="mt-6 flex gap-4 sm:mt-8">
                    <Link
                      href="/posts"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 sm:px-6 sm:py-3"
                    >
                      포스트 보기
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>

        {/* 포스트 슬라이드들 */}
        {heroPosts.map((post) => (
          <SwiperSlide key={post.id}>
            <div className="relative h-full overflow-hidden">
              {/* 배경 이미지 (포스트 썸네일 또는 사이트 대표이미지) */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${post.thumbnail_url || heroImageUrl || ""})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/50" />
              </div>

              {/* 배경 그라데이션 (이미지 없을 때) */}
              {!post.thumbnail_url && !heroImageUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
              )}

              <div className="relative flex h-full items-center">
                <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
                  <div className="max-w-2xl">
                    {post.categories && (
                      <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                        {post.categories.name}
                      </span>
                    )}
                    <h2
                      className={`font-bold tracking-tight text-white ${post.categories ? "mt-4" : ""} text-3xl sm:text-4xl lg:text-5xl`}
                    >
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-4 line-clamp-2 text-base leading-relaxed text-zinc-200 sm:mt-5 sm:text-lg">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-6 flex gap-4 sm:mt-8">
                      <Link
                        href={`/posts/${post.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 sm:px-6 sm:py-3"
                      >
                        자세히 보기
                        <HiOutlineArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 커스텀 스타일 */}
      <style jsx global>{`
        .hero-swiper {
          --swiper-pagination-bottom: 24px;
        }
        .hero-swiper .swiper-pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        .hero-swiper .swiper-pagination-bullet {
          width: 32px;
          height: 4px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 2px;
          opacity: 1;
          transition: all 0.3s ease;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          width: 48px;
          background: #6366f1;
        }
      `}</style>
    </section>
  );
}
