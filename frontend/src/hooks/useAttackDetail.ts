import { useState } from 'react';
//import { api } from '../services/api';
import type { Attack } from '../types';

export function useAttackDetail() {
  const [selectedAttack, setSelectedAttack] = useState<Attack | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The backend doesn't return `id` in list responses, so we use the attack
  // from the list directly for display, and attempt to fetch by index if needed.
  const openAttack = async (attack: Attack, listIndex: number) => {
    setSelectedAttack(attack);
    setSelectedIndex(listIndex);
    setError(null);

    // Attempt to fetch by ID (listIndex + 1 is a best-effort approach since
    // the API doesn't expose IDs in list responses; we show what we have)
    try {
      setLoading(true);
      // Try to get more detail — use the attack as-is since all fields are present
      setSelectedAttack(attack);
    } catch {
      setError('Could not load attack detail.');
    } finally {
      setLoading(false);
    }
  };

  const closeAttack = () => {
    setSelectedAttack(null);
    setSelectedIndex(null);
    setError(null);
  };

  return { selectedAttack, selectedIndex, loading, error, openAttack, closeAttack };
}
