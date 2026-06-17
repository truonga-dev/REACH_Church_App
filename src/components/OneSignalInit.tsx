'use client';

import { useEffect } from 'react';
import { syncOneSignalIfEnabled } from '@/lib/onesignal';

export default function OneSignalInit() {
  useEffect(() => {
    syncOneSignalIfEnabled();
  }, []);

  return null;
}
