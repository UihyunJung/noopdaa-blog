import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import type { SiteSettings } from "@/lib/types";
import "./globals.scss";

async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("site_name, site_description, og_image_url")
    .single();
  return data;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";

  return {
    title: {
      default: settings?.site_name || "Noopdaa Blog",
      template: `%s | ${settings?.site_name || "Noopdaa Blog"}`,
    },
    description: settings?.site_description || "",
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: siteUrl,
      siteName: settings?.site_name || "Noopdaa Blog",
      images: settings?.og_image_url ? [settings.og_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings?.site_name || "Noopdaa Blog",
      description: settings?.site_description || "",
      images: settings?.og_image_url ? [settings.og_image_url] : undefined,
    },
    verification: {
      other: {
        "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
      },
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster richColors position="top-center" />
          <PageViewTracker pageType="page" />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
