import type { ConnectionStatus, EmiratesIdCard, CardReadEvent, NfcReadEvent } from './index';

export interface UseEidReaderOptions {
  url?: string;
  enabled?: boolean;
  onCard?: (card: EmiratesIdCard, raw: CardReadEvent) => void;
  onNfc?: (event: NfcReadEvent) => void;
}

export declare function useEidReader(options?: UseEidReaderOptions): {
  status: ConnectionStatus;
  isConnected: boolean;
  card: EmiratesIdCard | null;
  nfc: NfcReadEvent | null;
  error: Error | null;
  clear(): void;
};
