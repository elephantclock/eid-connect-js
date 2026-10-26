// React hook for EID Connect. React is a peer dependency.
import { useEffect, useRef, useState } from 'react';
import { connect, DEFAULT_URL } from './index.js';

/**
 * @param {{ url?: string, enabled?: boolean, onCard?: Function, onNfc?: Function }} [options]
 */
export function useEidReader({ url = DEFAULT_URL, enabled = true, onCard, onNfc } = {}) {
  const [status, setStatus] = useState('disconnected');
  const [card, setCard] = useState(null);
  const [nfc, setNfc] = useState(null);
  const [error, setError] = useState(null);

  // Keep latest callbacks without reconnecting when they change
  const handlers = useRef({ onCard, onNfc });
  handlers.current = { onCard, onNfc };

  useEffect(() => {
    if (!enabled) return;
    const conn = connect({
      url,
      onStatus: setStatus,
      onError: (e) => setError(e),
      onCard: (c, raw) => {
        setCard(c);
        setError(null);
        handlers.current.onCard?.(c, raw);
      },
      onNfc: (e) => {
        setNfc(e);
        handlers.current.onNfc?.(e);
      },
    });
    return () => conn.close();
  }, [url, enabled]);

  return { status, isConnected: status === 'connected', card, nfc, error, clear: () => setCard(null) };
}
