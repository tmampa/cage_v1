'use client';

import { useEffect } from 'react';

function removeFirebaseKeys(storage) {
  const keysToRemove = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith('firebase:')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

export default function LegacyFirebaseCleanup() {
  useEffect(() => {
    try {
      removeFirebaseKeys(window.localStorage);
      removeFirebaseKeys(window.sessionStorage);
    } catch {
      // Ignore storage access errors (private mode, disabled storage, etc.)
    }
  }, []);

  return null;
}
