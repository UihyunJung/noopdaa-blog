import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { HiOutlineRss } from "react-icons/hi2";

async function getSiteName(): Promise<string> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("site_name")
    .single();
  return data?.site_name || "Noopdaa Blog";
}

export async function Footer() {
  const siteName = await getSiteName();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <Link
            href="/rss.xml"
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <HiOutlineRss className="h-4 w-4" />
            RSS
          </Link>
        </div>
      </div>
    </footer>
  );
}
