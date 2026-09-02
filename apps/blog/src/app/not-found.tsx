import type { Metadata } from "next";
import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export const metadata: Metadata = {
  robots: {
    index: false,
  },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1120px] flex-col items-center justify-center px-5 text-center sm:px-8">
      <p className="font-mono text-[13px] tracking-[0.12em] text-ink-3">404</p>
      <h1 className="mt-4 font-serif text-[28px] font-semibold tracking-tight text-ink sm:text-[36px]">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-3 text-[15px] text-ink-2">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-md border border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-paper-3"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        홈으로 돌아가기
      </Link>
    </div>
  );
}
