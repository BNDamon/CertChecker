'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMe, type MeInfo } from './api';
import { useSession } from './useSession';

export function useMe() {
  const { session } = useSession();
  const [me, setMe] = useState<MeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const info = await getMe();
      setMe(info);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  return { me, loading, refresh };
}
