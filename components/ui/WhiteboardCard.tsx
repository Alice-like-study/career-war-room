import type { ReactNode } from "react";

type WhiteboardCardProps = {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function WhiteboardCard({ icon, children, className = "" }: WhiteboardCardProps) {
  return (
    <article
      className={`paper-texture marker-border relative flex h-full flex-col gap-4 p-5 sm:p-6 ${className}`}
    >
      {icon ? (
        <div className="flex justify-center border-b border-ink/10 pb-3 text-4xl sm:text-[2.75rem]">
          {icon}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </article>
  );
}
