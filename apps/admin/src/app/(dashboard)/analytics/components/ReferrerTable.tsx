"use client";

import { Card } from "@noopdaa/ui";
import { FaGoogle } from "react-icons/fa6";
import { SiNaver } from "react-icons/si";
import { FaXTwitter, FaFacebookF, FaGithub } from "react-icons/fa6";
import { HiOutlineGlobeAlt, HiOutlineLink } from "react-icons/hi2";

interface ReferrerTableProps {
  data: Array<{
    source: string;
    views: number;
  }>;
}

export function ReferrerTable({ data }: ReferrerTableProps) {
  const total = data.reduce((sum, item) => sum + item.views, 0);

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">유입 경로</h2>

      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item) => {
            const percentage = total > 0 ? Math.round((item.views / total) * 100) : 0;
            return (
              <div key={item.source} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SourceIcon source={item.source} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.views.toLocaleString()}
                  </span>
                  <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다
        </div>
      )}
    </Card>
  );
}

function SourceIcon({ source }: { source: string }) {
  const lowerSource = source.toLowerCase();

  switch (lowerSource) {
    case "google":
      return <FaGoogle className="h-4 w-4 text-blue-500" />;
    case "naver":
      return <SiNaver className="h-4 w-4 text-green-500" />;
    case "twitter":
      return <FaXTwitter className="h-4 w-4 text-sky-500" />;
    case "facebook":
      return <FaFacebookF className="h-4 w-4 text-indigo-500" />;
    case "github":
      return <FaGithub className="h-4 w-4 text-gray-700 dark:text-gray-300" />;
    case "direct":
      return <HiOutlineLink className="h-4 w-4 text-purple-500" />;
    default:
      return <HiOutlineGlobeAlt className="h-4 w-4 text-gray-400" />;
  }
}
