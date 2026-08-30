import { X } from 'lucide-react';
import { BureauForm } from './BureauForm';
import type { Bureau } from '@/lib/types';

interface BureauEditModalProps {
  bureau: Bureau | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function BureauEditModal({ bureau, userId, onClose, onSaved }: BureauEditModalProps) {
  if (!bureau) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />
        <div className="mb-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <BureauForm
          userId={userId}
          existing={bureau}
          onDone={() => {
            onSaved();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
