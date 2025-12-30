import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import "./globals.scss";

interface SiteSettings {
  site_name: string;
  site_description: string | null;
  og_image_url: string | null;
}

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

  return {
    title: {
      default: settings?.site_name || "Noopdaa Blog",
      template: `%s | ${settings?.site_name || "Noopdaa Blog"}`,
    },
    description: settings?.site_description || "",
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: settings?.site_name || "Noopdaa Blog",
      images: settings?.og_image_url ? [settings.og_image_url] : undefined,
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
          <PageViewTracker pageType="page" />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
