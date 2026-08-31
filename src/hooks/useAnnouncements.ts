import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/types';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('announcements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchAll())
      .subscribe();
    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { announcements, loading, refetch: fetchAll };
}
