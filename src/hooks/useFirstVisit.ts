import { useState } from 'react';

export function useFirstVisit(key: string) {
  const storageKey = `tutorial_seen_${key}`;

  const [show, setShow] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) !== '1';
    } catch {
      return false;
    }
  });

  function markSeen() {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // localStorage indisponible (navigation privée stricte) — on ferme quand même
    }
    setShow(false);
  }

  return { show, markSeen };
}
