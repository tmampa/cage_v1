'use client';

import { useEffect, useState } from 'react';

/**
 * Countdown timer for a single question.
 *
 * The timer is paused unless `enabled` is true and the answer is not yet
 * being explained. When it reaches zero it fires `onTimeout()` exactly once
 * (the calling component should set `enabled` to false in response).
 */
export function useGameTimer({ enabled, initialTime, onTimeout, resetKey }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Reset countdown whenever a fresh question/level is loaded or the key changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional state reset on resetKey change
    setTimeLeft(initialTime);
  }, [initialTime, resetKey]);

  useEffect(() => {
    if (!enabled) return undefined;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [enabled, onTimeout]);

  return { timeLeft, setTimeLeft };
}
