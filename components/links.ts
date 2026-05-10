/**
 * 外链统一从这里读取，便于部署到 Vercel 后在控制台配置，无需改代码。
 *
 * 在仓库根目录复制 `.env.example` 为 `.env.local`（本地），或在 Vercel → Settings → Environment Variables 添加同名变量。
 *
 * - NEXT_PUBLIC_EASYCLAW_APP_URL：你已部署的 EasyClaw（浏览器打开的站点根地址）
 * - NEXT_PUBLIC_GITHUB_REPO_URL：本官网仓库地址（在 GitHub 上创建仓库并 push 后填写）
 */

function trimUrl(v: string | undefined): string | undefined {
  const s = v?.trim();
  return s && s.length > 0 ? s : undefined;
}

const easyclawApp = trimUrl(process.env.NEXT_PUBLIC_EASYCLAW_APP_URL);
const githubRepo = trimUrl(process.env.NEXT_PUBLIC_GITHUB_REPO_URL);

export const links = {
  /** 安装作战部 Skill 包 */
  skill: "https://github.com/Alice-like-study/career-war-room/releases/download/v1.0.0/career-war-room-skill-v1.0.0.zip.zip",
  /** 打开 EasyClaw 官网中文页 */
  easyclawDownload: "https://easyclaw.link/zh",
  /** 本作品源码仓库（建好仓库后配置） */
  github: githubRepo ?? "https://github.com/Alice-like-study/career-war-room.git",
} as const;
