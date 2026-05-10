/**
 * 外链统一从这里读取，便于部署到 Vercel 后在控制台配置，无需改代码。
 *
 * 在仓库根目录复制 `.env.example` 为 `.env.local`（本地），或在 Vercel → Settings → Environment Variables 添加同名变量。
 *
 * - NEXT_PUBLIC_EASYCLAW_APP_URL：你已部署的 EasyClaw（浏览器打开的站点根地址）
 * - NEXT_PUBLIC_SKILL_INSTALL_URL：可选；作战部 Skill 包安装页。不填则与 EASYCLAW 站点相同（同一入口时够用）
 * - NEXT_PUBLIC_GITHUB_REPO_URL：本官网仓库地址（在 GitHub 上创建仓库并 push 后填写）
 */

function trimUrl(v: string | undefined): string | undefined {
  const s = v?.trim();
  return s && s.length > 0 ? s : undefined;
}

const easyclawApp = trimUrl(process.env.NEXT_PUBLIC_EASYCLAW_APP_URL);
const skillInstall = trimUrl(process.env.NEXT_PUBLIC_SKILL_INSTALL_URL) ?? easyclawApp;
const githubRepo = trimUrl(process.env.NEXT_PUBLIC_GITHUB_REPO_URL);

export const links = {
  /** 安装作战部 Skill 包 */
  skill: skillInstall ?? "#",
  /** 打开你已部署的 EasyClaw（原「下载客户端」在 Web 场景下即打开站点） */
  easyclawDownload: easyclawApp ?? "#",
  /** 本作品源码仓库（建好仓库后配置） */
  github: githubRepo ?? "https://github.com/Alice-like-study/career-war-room.git",
} as const;
