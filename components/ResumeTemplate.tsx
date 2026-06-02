"use client";

/**
 * 简历模板组件 - 用于导出图片
 * 将 Markdown 格式的简历渲染成专业排版的简历视图
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  parseResumeTitleLine,
  prepareResumeForRender,
  sanitizeResumeMarkdown,
} from "@/lib/scalpel-resume-utils";

interface ResumeTemplateProps {
  /** 简历内容（Markdown 格式） */
  content: string;
  /** 用户姓名（用于文件名） */
  name?: string;
  /** 目标岗位 */
  targetPosition?: string;
  /** 联系方式 */
  contact?: string;
}

/**
 * 从简历内容中提取姓名
 */
function extractName(content: string): string {
  const fromTitle = parseResumeTitleLine(content);
  if (fromTitle.name) return fromTitle.name;

  const nameLabelMatch = content.match(/(?:姓名|Name)[：:]\s*(.+?)(?:\n|\r|$)/i);
  if (nameLabelMatch) {
    return nameLabelMatch[1].trim();
  }
  return "";
}

/**
 * 从简历内容中提取联系方式
 */
function extractContact(content: string): string {
  const patterns = [
    /(?:手机|电话|Tel|Phone)[：:]\s*([\d\-+\s]+)/i,
    /(?:邮箱|Email|E-mail)[：:]\s*([^\s]+@[^\s]+)/i,
    /([\d]{11})/,
    /([^\s]+@[^\s]+\.[^\s]+)/,
  ];

  const contacts: string[] = [];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1] && !contacts.includes(match[1].trim())) {
      contacts.push(match[1].trim());
    }
  }

  return contacts.slice(0, 3).join("  ·  ");
}

/**
 * 从简历内容中提取目标岗位
 */
function extractTargetPosition(content: string): string {
  const fromTitle = parseResumeTitleLine(content);
  if (fromTitle.position) return fromTitle.position;

  const patterns = [
    /(?:求职意向|目标岗位|应聘岗位|Position)[：:]\s*(.+?)(?:\n|\r|$)/i,
    /(?:意向岗位)[：:]\s*(.+?)(?:\n|\r|$)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

/**
 * 处理简历内容：提取代码块、清洗 STAR 标签、去掉与模板重复的页眉
 */
function processResumeContent(content: string): string {
  let processed = content
    .replace(/#\s*简历优化报告[\s\S]*?(?=##|$)/, "")
    .replace(/#\s*简历诊断报告[\s\S]*?(?=##|$)/, "")
    .replace(/##\s*原简历.*诊断[\s\S]*?(?=##\s*(重写|改写|简历)|$)/i, "")
    .replace(/##\s*投递策略[\s\S]*$/i, "")
    .replace(/```json-output[\s\S]*?```/, "")
    .replace(/给\s*Arena.*交接备注[\s\S]*$/i, "")
    .trim();

  const codeBlockMatch = processed.match(/```(?:markdown)?\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    processed = codeBlockMatch[1].trim();
  }

  return prepareResumeForRender(sanitizeResumeMarkdown(processed));
}

export const ResumeTemplate = React.forwardRef<HTMLDivElement, ResumeTemplateProps>(
  ({ content, name: propName, targetPosition: propTarget, contact: propContact }, ref) => {
    const rawForMeta = sanitizeResumeMarkdown(content);
    const name = propName || extractName(rawForMeta) || "姓名";
    const contact = propContact || extractContact(rawForMeta) || "";
    const targetPosition = propTarget || extractTargetPosition(rawForMeta) || "";
    const processedContent = processResumeContent(content);

    const displayName = targetPosition ? `${name}  ·  ${targetPosition}` : name;

    return (
      <div
        ref={ref}
        id="resume-template"
        style={{
          width: "800px",
          minHeight: "1130px",
          maxHeight: "1130px",
          background: "#FDFCF8",
          color: "#1a1a1a",
          fontFamily: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
          padding: "48px 56px",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #c41e3a 0%, #d4a574 50%, #c41e3a 100%)",
          }}
        />

        {/* 页眉：仅一层，正文不再重复 # 标题 */}
        <div style={{ marginBottom: "16px", marginTop: "8px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#1a1a1a",
              margin: 0,
              letterSpacing: "2px",
            }}
          >
            {displayName}
          </h1>

          {contact && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#555",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {contact.split("  ·  ").map((item, idx) => (
                <span key={idx}>{item}</span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            height: "1px",
            background: "#e0d8cc",
            margin: "20px 0",
          }}
        />

        <div
          className="resume-content"
          style={{
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#333",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#c41e3a",
                    margin: "24px 0 12px 0",
                    paddingBottom: "8px",
                    borderBottom: "2px solid #f0e6d8",
                  }}
                >
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#c41e3a",
                    margin: "24px 0 12px 0",
                    paddingBottom: "8px",
                    borderBottom: "2px solid #f0e6d8",
                    letterSpacing: "1px",
                  }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#2a2a2a",
                    margin: "16px 0 8px 0",
                  }}
                >
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p style={{ margin: "8px 0", lineHeight: "1.7" }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul
                  style={{
                    margin: "8px 0",
                    paddingLeft: "20px",
                    listStyle: "disc",
                  }}
                >
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li style={{ margin: "4px 0", lineHeight: "1.6" }}>{children}</li>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 600, color: "#1a1a1a" }}>{children}</strong>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    background: "#f5f2ed",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "13px",
                    fontFamily: '"SF Mono", Monaco, monospace',
                    color: "#555",
                  }}
                >
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre
                  style={{
                    background: "#f8f6f2",
                    padding: "12px 16px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    fontSize: "13px",
                    margin: "12px 0",
                    border: "1px solid #e8e4de",
                  }}
                >
                  {children}
                </pre>
              ),
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "56px",
            right: "56px",
            textAlign: "center",
            fontSize: "11px",
            color: "#aaa",
            borderTop: "1px solid #eee",
            paddingTop: "16px",
          }}
        >
          由 Scalpel · 简历医生 优化生成
        </div>
      </div>
    );
  },
);

ResumeTemplate.displayName = "ResumeTemplate";

export default ResumeTemplate;
