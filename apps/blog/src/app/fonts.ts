import localFont from "next/font/local";
import { Hahmlet, Fira_Code } from "next/font/google";

// 본문: Pretendard 가변 폰트 — npm 패키지(pretendard)의 woff2를 next/font/local로 셀프 호스팅
// (CDN 없이 빌드에 포함되고, 폰트 로딩 중 레이아웃 흔들림을 next/font가 막아준다)
export const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

// 제목: Hahmlet (세리프, 가변). 한글 글리프는 Google Fonts의 unicode-range 분할 파일로 함께 내려온다
export const hahmlet = Hahmlet({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hahmlet",
});

// 날짜·메타·코드: Fira Code (가변)
export const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fira-code",
});
