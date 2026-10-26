// EID Connect client: subscribes to the local EID Connect bridge (HTTP + Server-Sent Events)
// and turns its messages into typed events. Works in browsers and in Node 18+.

export const DEFAULT_URL = 'http://localhost:8080';

/**
 * Normalise a card_read payload into friendly field names while keeping the raw event.
 * @param {import('./index').CardReadEvent} e
 * @returns {import('./index').EmiratesIdCard}
 */
export function toCard(e) {
  return {
    idNumber: e.id ?? null,
    cardNumber: e.cardNumber ?? null,
    cardSerialNumber: e.cardSerialNumber ?? e.nfcUid ?? null,
    nameEnglish: e.fullNameEnglish ?? null,
    nameArabic: e.fullNameArabic ?? null,
    nationality: e.nationality ?? null,
    nationalityArabic: e.nationalityArabic ?? null,
    gender: e.gender ?? null,
    dateOfBirth: parseDate(e.dateOfBirth),
    issueDate: parseDate(e.issueDate),
    expiryDate: parseDate(e.expiryDate),
    photoDataUrl: e.photo ? `data:${e.photo.startsWith('iVBOR') ? 'image/png' : 'image/jpeg'};base64,${e.photo}` : null,
    raw: e,
  };
}

/**
 * Parse the bridge's dates (dd/MM/yyyy, or ISO with optional time/offset) into yyyy-MM-dd.
 * Returns null when empty or unrecognised.
 * @param {string | undefined} value
 */
export function parseDate(value) {
  if (!value) return null;
  const v = value.trim();
  const dmy = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(v);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(v);
  return iso ? iso[1] : null;
}

/**
 * Age in whole years on a given date (default today) from an ISO or dd/MM/yyyy date of birth.
 * @param {string} dateOfBirth
 * @param {Date} [on]
 */
export function ageOn(dateOfBirth, on = new Date()) {
  const iso = parseDate(dateOfBirth);
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return null;
  let age = on.getFullYear() - y;
  if (on.getMonth() + 1 < m || (on.getMonth() + 1 === m && on.getDate() < d)) age--;
  return age;
}

/**
 * Connect to an EID Connect bridge.
 * @param {import('./index').ConnectOptions} [options]
 * @returns {import('./index').EidConnection}
 */
export function connect(options = {}) {
  const {
    url = DEFAULT_URL,
    onCard,
    onNfc,
    onStatus,
    onError,
    reconnectDelayMs = 3000,
    EventSource: ES = globalThis.EventSource,
  } = options;

  let closed = false;
  let source = null;
  let abort = null;
  let timer = null;
  let status = 'connecting';

  const setStatus = (s) => {
    if (s === status) return;
    status = s;
    onStatus?.(s);
  };

  const handle = (raw) => {
    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    switch (event.type) {
      case 'connection':
        setStatus('connected');
        break;
      case 'card_read':
        onCard?.(toCard(event), event);
        break;
      case 'nfc_card_read':
        onNfc?.(event);
        break;
      case 'error':
        onError?.(new Error(event.message || 'Bridge reported an error'), event);
        break;
    }
  };

  const scheduleReconnect = () => {
    if (closed || timer) return;
    setStatus('disconnected');
    timer = setTimeout(() => {
      timer = null;
      open();
    }, reconnectDelayMs);
  };

  const open = () => {
    if (closed) return;
    setStatus('connecting');
    const endpoint = `${url.replace(/\/$/, '')}/events`;
    if (ES) {
      source = new ES(endpoint);
      source.onmessage = (m) => handle(m.data);
      // EventSource retries by itself; we only report the state change.
      source.onerror = () => setStatus(source.readyState === 2 ? 'error' : 'disconnected');
      return;
    }
    streamWithFetch(endpoint);
  };

  // Fallback for runtimes without EventSource (Node 18-21, some kiosk shells).
  const streamWithFetch = async (endpoint) => {
    abort = new AbortController();
    try {
      const res = await fetch(endpoint, { headers: { Accept: 'text/event-stream' }, signal: abort.signal });
      if (!res.ok || !res.body) throw new Error(`Bridge responded ${res.status}`);
      const decoder = new TextDecoder();
      let buffer = '';
      for await (const chunk of res.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const data = frame
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).trimStart())
            .join('\n');
          if (data) handle(data);
        }
      }
      scheduleReconnect();
    } catch (err) {
      if (closed) return;
      onError?.(err);
      scheduleReconnect();
    }
  };

  open();

  return {
    get status() {
      return status;
    },
    close() {
      closed = true;
      clearTimeout(timer);
      source?.close();
      abort?.abort();
      setStatus('disconnected');
    },
  };
}

/**
 * Check whether a bridge is running. Resolves to the /status payload or null.
 * @param {string} [url]
 */
export async function getStatus(url = DEFAULT_URL) {
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/status`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
