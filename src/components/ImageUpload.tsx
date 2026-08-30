import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
}

const MAX_SIZE_MB = 5;

export function ImageUpload({ value, onChange, folder }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !supabase) return;

    if (!file.type.startsWith('image/')) {
      setError('Merci de choisir une image (JPG, PNG, WebP…).');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image trop lourde — ${MAX_SIZE_MB} Mo maximum.`);
      return;
    }

    setUploading(true);
    setError(null);

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('vendor-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      setUploading(false);
      setError(
        uploadError.message.includes('Bucket not found')
          ? "Stockage non configuré côté serveur (bucket manquant) — contactez l'administrateur."
          : "Échec de l'envoi — vérifiez votre connexion et réessayez."
      );
      return;
    }

    const { data } = supabase.storage.from('vendor-images').getPublicUrl(path);
    setUploading(false);
    onChange(data.publicUrl);
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Photo</span>

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Aperçu"
            className="h-24 w-24 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Retirer la photo"
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-primary-400 hover:text-primary-500 disabled:opacity-60 dark:border-slate-600"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Ajouter</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-[11px] text-error-500">{error}</p>}
    </div>
  );
}
