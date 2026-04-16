import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@noopdaa/ui";

export const metadata: Metadata = {
  robots: {
    index: false,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
      <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
        페이지를 찾을 수 없습니다
      </p>
      <p className="mt-2 text-gray-500 dark:text-gray-500">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link href="/" className="mt-8">
        <Button>홈으로 돌아가기</Button>
      </Link>
    </div>
  );
}
