// User-Agent 파싱 유틸리티

// 봇 패턴
const BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebot/i,
  /ia_archiver/i,
  /crawler/i,
  /spider/i,
  /bot/i,
  /lighthouse/i,
  /pagespeed/i,
];

export function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// 디바이스 타입 파싱
export function parseDeviceType(userAgent: string): "desktop" | "mobile" | "tablet" {
  const ua = userAgent.toLowerCase();

  // 태블릿 체크 (모바일보다 먼저)
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return "tablet";
  }

  // 모바일 체크
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return "mobile";
  }

  // 안드로이드는 모바일이 없으면 태블릿
  if (/android/i.test(ua)) {
    return "tablet";
  }

  return "desktop";
}

// 브라우저 파싱
export function parseBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  // 순서 중요: 더 구체적인 것 먼저 체크
  if (ua.includes("edg/") || ua.includes("edge/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("whale/")) return "Whale";
  if (ua.includes("samsung")) return "Samsung";
  if (ua.includes("firefox/") || ua.includes("fxios")) return "Firefox";
  if (ua.includes("crios")) return "Chrome"; // iOS Chrome
  if (ua.includes("chrome/") && !ua.includes("chromium")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("msie") || ua.includes("trident/")) return "IE";

  return "Other";
}

// 레퍼러 도메인 추출
export function parseReferrerDomain(referrer: string | null): string {
  if (!referrer) return "Direct";

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    // 검색 엔진
    if (hostname.includes("google")) return "Google";
    if (hostname.includes("naver")) return "Naver";
    if (hostname.includes("daum")) return "Daum";
    if (hostname.includes("bing")) return "Bing";
    if (hostname.includes("yahoo")) return "Yahoo";

    // SNS
    if (hostname.includes("twitter") || hostname.includes("t.co")) return "Twitter";
    if (hostname.includes("facebook") || hostname.includes("fb.")) return "Facebook";
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("linkedin")) return "LinkedIn";

    // 개발 관련
    if (hostname.includes("github")) return "GitHub";
    if (hostname.includes("stackoverflow")) return "StackOverflow";

    return hostname;
  } catch {
    return "Other";
  }
}
