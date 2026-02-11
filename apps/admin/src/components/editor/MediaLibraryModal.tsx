"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@noopdaa/ui";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize } from "@/lib/utils";
import type { Media } from "@/lib/types";
import { HiOutlineXMark } from "react-icons/hi2";
import { ImSpinner8 } from "react-icons/im";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, filename: string) => void;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
}: MediaLibraryModalProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false }) as { data: Media[] | null };
    setMedia(data || []);
    setIsLoading(false);
  };

  const filteredMedia = media.filter((item) =>
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (item: Media) => {
    onSelect(item.url, item.filename);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            미디어 라이브러리
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="파일명으로 검색..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <ImSpinner8 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchQuery ? "검색 결과가 없습니다." : "업로드된 미디어가 없습니다."}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredMedia.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <Image
                    src={item.url}
                    alt={item.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <div className="w-full p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{item.filename}</p>
                      <p className="text-xs text-gray-300">{formatFileSize(item.size)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
