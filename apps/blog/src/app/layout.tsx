import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import "./globals.scss";

export const metadata: Metadata = {
  title: {
    default: "Noopdaa Blog",
    template: "%s | Noopdaa Blog",
  },
  description: "개발과 기술에 대한 이야기",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Noopdaa Blog",
  },
};

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
