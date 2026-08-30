import { useState } from 'react';
import { Loader2, Plus, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MUNICIPALITIES } from '@/lib/constants';
import { LocationPicker } from './LocationPicker';
import { ImageUpload } from './ImageUpload';
import type { Bureau } from '@/lib/types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

interface BureauFormProps {
  userId: string;
  existing?: Bureau | null;
  onDone: () => void;
  onCancel?: () => void;
}

export function BureauForm({ userId, existing, onDone, onCancel }: BureauFormProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [municipality, setMunicipality] = useState(existing?.municipality ?? MUNICIPALITIES[0]);
  const [address, setAddress] = useState(existing?.address ?? '');
  const [addressDescription, setAddressDescription] = useState(existing?.address_description ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [latitude, setLatitude] = useState(existing?.latitude != null ? String(existing.latitude) : '');
  const [longitude, setLongitude] = useState(existing?.longitude != null ? String(existing.longitude) : '');
  const [logoUrl, setLogoUrl] = useState(existing?.logo_url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!supabase || !name.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      municipality,
      address: address.trim() || null,
      address_description: addressDescription.trim() || null,
      phone: phone.trim() || null,
      latitude: latitude.trim() ? parseFloat(latitude) : null,
      longitude: longitude.trim() ? parseFloat(longitude) : null,
      logo_url: logoUrl.trim() || null,
    };

    const { error: err } = existing
      ? await supabase.from('bureaus').update(payload).eq('id', existing.id)
      : await supabase.from('bureaus').insert({ ...payload, user_id: userId, verified: false });

    setSaving(false);
    if (err) {
      setError('Enregistrement impossible — reconnectez-vous et réessayez.');
      return;
    }
    onDone();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        {existing ? 'Modifier ma cabine' : 'Créer ma cabine de change'}
      </h3>
      {!existing && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Votre cabine sera visible immédiatement, marquée "non vérifiée" jusqu'à validation par un
          administrateur.
        </p>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom de la cabine *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cabine Centrale" className={inputClass} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Commune *</span>
        <select value={municipality} onChange={(e) => setMunicipality(e.target.value)} className={inputClass}>
          {MUNICIPALITIES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Adresse</span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Avenue du Marché" className={inputClass} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Repère / description du lieu</span>
        <input
          value={addressDescription}
          onChange={(e) => setAddressDescription(e.target.value)}
          placeholder="En face de la pharmacie, à côté du rond-point"
          className={inputClass}
        />
      </label>

      <ImageUpload value={logoUrl} onChange={setLogoUrl} folder="bureaus" />

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Téléphone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+243…" className={inputClass} />
      </label>

      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
      </div>

      {error && <p className="text-xs text-error-500">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : existing ? (
            <Save className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {existing ? 'Enregistrer' : 'Créer ma cabine'}
        </button>
      </div>
    </div>
  );
}
