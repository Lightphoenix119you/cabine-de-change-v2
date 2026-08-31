import { useState } from 'react';
import { FileText, Loader2, Megaphone, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { EmptyState } from './EmptyState';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function PublishForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (!supabase || !title.trim() || !body.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('announcements').insert({
      title: title.trim(),
      body: body.trim(),
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setTitle('');
    setBody('');
    onDone();
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="space-y-3 rounded-2xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800/50 dark:bg-primary-950/20">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
        <Megaphone className="h-4 w-4 text-primary-600" /> Publier une note (admin)
      </h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre de la note"
        className={inputClass}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Contenu du message…"
        rows={3}
        className={inputClass}
      />
      {error && <p className="text-xs text-error-500">{error}</p>}
      <button
        onClick={handlePublish}
        disabled={saving || !title.trim() || !body.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Publier
      </button>
    </div>
  );
}

export function NotesTab({ isAdmin }: { isAdmin: boolean }) {
  const { announcements, loading, refetch } = useAnnouncements();
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(id: string) {
    if (!supabase) return;
    if (!confirm('Supprimer cette note ?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    refetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notes & Mises à jour du DG</h2>
        {isAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
          >
            <Plus className="h-3.5 w-3.5" /> Nouvelle note
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <PublishForm
          onDone={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Aucune note pour l'instant"
          message="Les annonces et mises à jour de la plateforme apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-800/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {a.author_name} · {formatDate(a.created_at)}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    aria-label="Supprimer"
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
