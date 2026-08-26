#!/usr/bin/env node
/**
 * turbo.json의 env 선언 누락 검사
 *
 * Turborepo는 strict 모드(2.0부터 기본값)에서 turbo.json에 선언되지 않은 환경변수를
 * 빌드 태스크에 전달하지 않고, 캐시 해시에도 반영하지 않는다. 선언을 빠뜨리면
 * 값을 바꿔도 해시가 그대로라 예전 빌드 결과가 재사용되므로,
 * 소스 코드와 .env.example을 기준으로 누락을 미리 잡아낸다.
 *
 * NEXT_PUBLIC_* 는 Turborepo 프레임워크 추론이 Next.js 앱에 자동 포함하므로 검사 제외.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

// Vercel/Node가 자동 주입하므로 선언이 필요 없는 시스템 변수
const SYSTEM_VARS = [/^NODE_ENV$/, /^CI$/, /^PORT$/, /^VERCEL/, /^TURBO_/, /^npm_/];

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".turbo", ".git"]);

/** 소스 파일 목록을 재귀 수집 */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path, out);
    } else if (SOURCE_EXT.has(extname(entry.name))) {
      out.push(path);
    }
  }
  return out;
}

/** turbo.json에 선언된 변수 패턴 수집 (globalEnv + build 태스크의 env) */
function declaredPatterns() {
  const turbo = JSON.parse(readFileSync(join(ROOT, "turbo.json"), "utf8"));
  return [...(turbo.globalEnv ?? []), ...(turbo.tasks?.build?.env ?? [])];
}

/**
 * 와일드카드 패턴 매칭 (turbo.json은 `FOO_*` 형태를 지원)
 * 환경변수명은 영숫자와 밑줄뿐이라 정규식 없이 조각 매칭으로 처리한다.
 */
function matchesPattern(key, pattern) {
  if (!pattern.includes("*")) return pattern === key;

  const parts = pattern.split("*");
  const prefix = parts[0];
  const suffix = parts[parts.length - 1];

  if (!key.startsWith(prefix) || !key.endsWith(suffix)) return false;
  if (prefix.length + suffix.length > key.length) return false;

  // 중간 조각들이 순서대로 등장하는지 확인
  let cursor = prefix.length;
  for (const part of parts.slice(1, -1)) {
    const found = key.indexOf(part, cursor);
    if (found === -1) return false;
    cursor = found + part.length;
  }
  return cursor <= key.length - suffix.length;
}

/** 선언이 필요 없는 변수인지 (프레임워크 추론 / 시스템 변수) */
function isExempt(key) {
  return key.startsWith("NEXT_PUBLIC_") || SYSTEM_VARS.some((re) => re.test(key));
}

/** .env.example에서 키 이름만 추출 */
function envExampleKeys(file) {
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("=")[0].trim())
    .filter((key) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key));
}

const patterns = declaredPatterns();
const missing = new Map(); // 변수명 → 발견 위치 목록
const dynamicAccess = [];
const used = new Set();

/** 누락 목록에 위치를 기록 */
function record(key, where) {
  if (!missing.has(key)) missing.set(key, []);
  if (!missing.get(key).includes(where)) missing.get(key).push(where);
}

// 1. 소스 코드의 process.env.X 참조 검사
for (const file of [...walk(join(ROOT, "apps")), ...walk(join(ROOT, "packages"))]) {
  const content = readFileSync(file, "utf8");
  const where = relative(ROOT, file).split("\\").join("/");

  if (/process\.env\[/.test(content)) dynamicAccess.push(where);

  for (const [, key] of content.matchAll(/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
    used.add(key);
    if (isExempt(key) || patterns.some((p) => matchesPattern(key, p))) continue;
    record(key, where);
  }
}

// 2. .env.example에 문서화된 키 검사 (아직 코드에 없더라도 선언은 필요)
for (const app of ["apps/admin", "apps/blog"]) {
  const file = join(ROOT, app, ".env.example");
  if (!existsSync(file)) continue;
  for (const key of envExampleKeys(file)) {
    used.add(key);
    if (isExempt(key) || patterns.some((p) => matchesPattern(key, p))) continue;
    record(key, `${app}/.env.example`);
  }
}

// 동적 접근은 정적 분석이 불가능하므로 별도 안내
if (dynamicAccess.length > 0) {
  console.warn("경고: 동적 접근(process.env[...])은 정적 검사가 불가능합니다. 수동 확인 필요:");
  for (const file of dynamicAccess) console.warn(`  - ${file}`);
  console.warn("");
}

// turbo.json에는 있지만 어디서도 쓰이지 않는 항목 (실패시키지 않고 안내만)
const unused = patterns.filter(
  (pattern) => !pattern.includes("*") && !used.has(pattern) && !isExempt(pattern)
);
if (unused.length > 0) {
  console.warn(`참고: turbo.json에 선언됐지만 사용처를 찾지 못한 변수 — ${unused.join(", ")}`);
  console.warn("");
}

if (missing.size === 0) {
  console.log(`✓ 환경변수 선언 검사 통과 (${patterns.length}개 선언, ${used.size}개 사용)`);
  process.exit(0);
}

console.error("✗ turbo.json의 env 배열에 다음 환경변수가 누락됐습니다:\n");
for (const [key, places] of missing) {
  console.error(`  ${key}`);
  for (const place of places) console.error(`      ${place}`);
}
console.error(`
turbo.json의 tasks.build.env 배열에 위 변수를 추가하세요.
선언하지 않으면 빌드 태스크에 값이 전달되지 않고, 캐시 해시에도 반영되지 않아
값을 바꿔도 예전 빌드 결과가 재사용됩니다.`);
process.exit(1);
