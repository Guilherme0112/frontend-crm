import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from './clipboard';

/** Copia texto e controla o feedback "Copiado" sem deixar timers órfãos. */
export function useCopyToClipboard(resetAfter = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (value: string) => {
      await copyText(value);
      setCopied(true);

      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }

      timer.current = window.setTimeout(() => {
        setCopied(false);
        timer.current = null;
      }, resetAfter);
    },
    [resetAfter],
  );

  return { copied, copy };
}
