import { Sparkles } from 'lucide-react';
import type { TutorialContent } from '@/lib/tutorialContent';

interface TutorialModalProps {
  open: boolean;
  content: TutorialContent;
  onDismiss: () => void;
}

export function TutorialModal({ open, content, onDismiss }: TutorialModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{content.title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{content.body}</p>
        <button
          onClick={onDismiss}
          className="mt-4 w-full rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
}
