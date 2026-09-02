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
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-5 py-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
        <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        <Link
          href="/rss.xml"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
        >
          <HiOutlineRss className="h-3.5 w-3.5" />
          RSS
        </Link>
      </div>
    </footer>
  );
}
