import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon: ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'accent';
}

const ACCENTS = {
  primary: 'from-primary-500/10 to-primary-600/5 text-primary-600 dark:text-primary-400',
  success: 'from-success-500/10 to-success-600/5 text-success-600 dark:text-success-400',
  warning: 'from-warning-500/10 to-warning-600/5 text-warning-600 dark:text-warning-400',
  accent: 'from-accent-500/10 to-accent-600/5 text-accent-600 dark:text-accent-400',
};

export function StatCard({ label, value, sublabel, icon, accent = 'primary' }: StatCardProps) {
  const isLongText = typeof value === 'string' && value.length > 6;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/60 sm:gap-3 sm:p-3.5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br sm:h-11 sm:w-11 ${ACCENTS[accent]}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-[11px]">
          {label}
        </p>
        <p
          className={`break-words font-bold leading-tight text-slate-900 dark:text-white ${
            isLongText ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
          }`}
        >
          {value}
        </p>
        {sublabel && (
          <p className="truncate text-[10px] text-slate-400 dark:text-slate-500 sm:text-[11px]">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
