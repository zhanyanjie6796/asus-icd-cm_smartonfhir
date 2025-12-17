import type { NextConfig } from "next";
import path from "path";

const isGhPages = process.env.GITHUB_PAGES === "true";
const isExport = process.env.STATIC_EXPORT === "true" || isGhPages;

// derive repo name for GH Pages basePath/assetPrefix when running in Actions
const githubRepository = process.env.GITHUB_REPOSITORY || ""; // format: owner/repo
const repoNameFromEnv = githubRepository ? githubRepository.split("/")[1] : "asus-icd-cm_smartonfhir";

const nextConfig: NextConfig = {
  // 只在構建靜態網站時使用 export 模式，開發時需要 API routes
  ...(isExport && { output: "export" }),
  images: { unoptimized: true },
  // 避免 Next 往上層亂抓 lockfile（雲端同步/家目錄）
  outputFileTracingRoot: path.join(__dirname),
  // 只有 GH Pages 才設定 basePath / assetPrefix
  ...(isGhPages
    ? {
        basePath: `/${repoNameFromEnv}`,
        assetPrefix: `/${repoNameFromEnv}/`,
        // Use trailingSlash for GH Pages so exported pages are placed in directories
        // (e.g. /smart/launch/index.html) and URLs without .html resolve correctly.
        trailingSlash: true,
      }
    : {
        trailingSlash: false,
      }),
};

export default nextConfig;
