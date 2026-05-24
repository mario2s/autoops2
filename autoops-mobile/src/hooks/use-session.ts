import { useEffect, useState } from 'react';

import { decodeToken, getToken } from '@/lib/auth';
import type { JwtPayload } from '@/lib/types';

export function useSession() {
  const [payload, setPayload] = useState<JwtPayload | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      if (!active) return;
      setPayload(token ? decodeToken(token) : null);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  return {
    loaded,
    payload,
    userId: payload?.userId,
    name: payload?.name,
    email: payload?.email,
    role: payload?.role,
  };
}
