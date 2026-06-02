/**
 * ResumeInput - 简历输入组件
 *
 * 支持两种输入方式（Tab 切换）：
 * - Tab 1：上传 PDF（拖拽或点击）
 * - Tab 2：粘贴文字（大文本框）
 *
 * 提交后返回简历原文文本，进入下一步对话
 */

'use client';

import { useState, useCallback, useRef } from 'react';

type TabMode = 'pdf' | 'text';

interface ResumeInputProps {
  /** 提交简历后回调，传入解析/输入的简历原文 */
  onSubmit: (resumeText: string) => void;
  /** 取消输入 */
  onCancel?: () => void;
  /** 是否正在处理中 */
  loading?: boolean;
}

export function ResumeInput({ onSubmit, onCancel, loading = false }: ResumeInputProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // 处理文件选择
  const handleFileChange = useCallback((selectedFile: File | null) => {
    setError(null);
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // 检查文件类型
    if (!selectedFile.type.includes('pdf') && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('请选择 PDF 文件');
      setFile(null);
      return;
    }

    // 检查文件大小（5MB 限制）
    const MAX_SIZE = 5 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError('文件大小超过 5MB 限制');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }, []);

  // 点击上传区域
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // 文件 input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0] || null);
  };

  // 拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  // 解析 PDF 文件
  const parsePDF = async (pdfFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', pdfFile);

    const res = await fetch('/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: '解析失败' }));
      throw new Error(data.error || `解析失败 (${res.status})`);
    }

    const data = await res.json();
    return data.data.text;
  };

  // 提交处理
  const handleSubmit = async () => {
    setError(null);

    if (activeTab === 'pdf') {
      if (!file) {
        setError('请先选择 PDF 文件');
        return;
      }

      setParsing(true);
      try {
        const text = await parsePDF(file);
        setParsing(false);
        onSubmit(text);
      } catch (err) {
        setParsing(false);
        setError(err instanceof Error ? err.message : '解析失败，请重试');
      }
    } else {
      // 粘贴文字模式
      if (!pastedText.trim()) {
        setError('请输入简历内容');
        return;
      }
      onSubmit(pastedText.trim());
    }
  };

  // 是否正在处理（外部 loading 或内部解析中）
  const isProcessing = loading || parsing;

  return (
    <div className="rounded-2xl border-2 border-ink/15 bg-paper p-6 shadow-warm">
      {/* 标题 */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-ink">📄 简历输入</h3>
        <p className="mt-1 text-sm text-ink/60">
          Scalpel 需要你的简历原文来进行专业诊断
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-5 flex gap-1 rounded-xl bg-ink/5 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            activeTab === 'pdf'
              ? 'bg-white text-cta shadow-sm'
              : 'text-ink/60 hover:text-ink/80'
          }`}
        >
          📤 上传 PDF
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            activeTab === 'text'
              ? 'bg-white text-cta shadow-sm'
              : 'text-ink/60 hover:text-ink/80'
          }`}
        >
          ✍️ 粘贴文字
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 rounded-lg border border-cta/30 bg-[#fff0f2] px-4 py-3 text-sm font-semibold text-cta">
          {error}
        </div>
      )}

      {/* Tab 内容 */}
      <div className="min-h-[240px]">
        {activeTab === 'pdf' ? (
          // PDF 上传区域
          <div>
            {!file ? (
              <div
                onClick={handleClickUpload}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                  isDragOver
                    ? 'border-cta bg-[#fff6f7]'
                    : 'border-ink/25 hover:border-cta/50 hover:bg-[#fff9f5]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div className="mb-3 text-4xl">📁</div>
                <p className="mb-2 font-bold text-ink">
                  点击或拖拽 PDF 到此处
                </p>
                <p className="text-xs text-ink/50">
                  支持 .pdf 格式，最大 5MB
                </p>
              </div>
            ) : (
              // 已选择文件
              <div className="rounded-xl border-2 border-cta/30 bg-[#fff8f7] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-2xl">
                    📄
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-ink/50">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={isProcessing}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-ink/50 transition hover:bg-ink/10 hover:text-cta disabled:opacity-40"
                  >
                    移除
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 粘贴文字区域
          <div>
            <label htmlFor="resume-text" className="sr-only">
              简历内容
            </label>
            <textarea
              id="resume-text"
              rows={12}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="请把简历内容粘贴进来&#10;&#10;可以包含：&#10;- 个人信息&#10;- 教育背景&#10;- 实习/工作经历&#10;- 项目经验&#10;- 技能特长&#10;- 自我评价&#10;&#10;不需要完美排版，纯文字即可。"
              disabled={isProcessing}
              className="min-h-[240px] w-full resize-y rounded-xl border-2 border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-cta/60 focus:outline-none focus:ring-2 focus:ring-cta/20 disabled:opacity-55"
            />
            <p className="mt-2 text-right text-xs text-ink/40">
              已输入 {pastedText.length} 字
            </p>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="mt-6 flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-full border-2 border-ink/20 px-6 py-2.5 text-sm font-bold text-ink/70 transition hover:bg-ink/5 disabled:opacity-40"
          >
            取消
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isProcessing ||
            (activeTab === 'pdf' ? !file : !pastedText.trim())
          }
          className="flex-1 rounded-full bg-cta px-6 py-2.5 text-sm font-bold text-white shadow-[3px_4px_0_rgba(61,40,23,0.15)] transition hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-48"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {parsing ? '正在解析 PDF…' : '处理中…'}
            </span>
          ) : (
            '提交简历，开始诊断 →'
          )}
        </button>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-ink/5 px-3 py-2">
        <span className="text-sm">💡</span>
        <p className="text-xs leading-relaxed text-ink/60">
          你的简历仅用于本次诊断分析，不会被存储或用于其他用途。
          建议上传完整简历以获得最准确的改写建议。
        </p>
      </div>
    </div>
  );
}
