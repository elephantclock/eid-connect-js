export declare const DEFAULT_URL: 'http://localhost:8080';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/** Raw `card_read` event exactly as the EID Connect bridge sends it. Dates are typically dd/MM/yyyy. */
export interface CardReadEvent {
  type: 'card_read';
  timestamp: string;
  id?: string;
  cardNumber?: string;
  cardSerialNumber?: string;
  nfcUid?: string;
  status?: string;
  nationality?: string;
  nationalityArabic?: string;
  fullNameEnglish?: string;
  fullNameArabic?: string;
  gender?: string;
  dateOfBirth?: string;
  issueDate?: string;
  expiryDate?: string;
  /** Base64 cardholder photo */
  photo?: string;
  photoSize?: number;
  cardCount?: number;
  readerState?: string;
}

/** Raw `nfc_card_read` event: a non-Emirates-ID NFC tag, or UID-only fallback mode. */
export interface NfcReadEvent {
  type: 'nfc_card_read';
  timestamp: string;
  uid: string;
  nfcUid?: string;
  cardSerialNumber?: string;
  cardType?: string;
  sak?: string;
  readerType?: 'NFC' | 'HID' | 'KEYBOARD_EMULATION' | 'PCSC' | string;
  readerName?: string;
  readerState?: string;
  cardCount?: number;
  /** true when the full Emirates ID read failed and only the UID is available */
  fallback?: boolean;
  note?: string;
}

export interface ConnectionEvent {
  type: 'connection';
  status: 'connected';
  timestamp: string;
  clientId: string;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
  timestamp: string;
}

export type BridgeEvent = CardReadEvent | NfcReadEvent | ConnectionEvent | ErrorEvent;

/** Friendly, normalised card. Dates are ISO yyyy-MM-dd. */
export interface EmiratesIdCard {
  idNumber: string | null;
  cardNumber: string | null;
  cardSerialNumber: string | null;
  nameEnglish: string | null;
  nameArabic: string | null;
  nationality: string | null;
  nationalityArabic: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  photoDataUrl: string | null;
  raw: CardReadEvent;
}

export interface ConnectOptions {
  /** Bridge base URL. Default http://localhost:8080 */
  url?: string;
  onCard?: (card: EmiratesIdCard, raw: CardReadEvent) => void;
  onNfc?: (event: NfcReadEvent) => void;
  onStatus?: (status: ConnectionStatus) => void;
  onError?: (error: Error, raw?: ErrorEvent) => void;
  /** Reconnect delay for the fetch fallback. Default 3000 */
  reconnectDelayMs?: number;
  /** Supply an EventSource implementation; defaults to globalThis.EventSource, else uses fetch streaming. */
  EventSource?: typeof globalThis.EventSource;
}

export interface EidConnection {
  readonly status: ConnectionStatus;
  close(): void;
}

export declare function connect(options?: ConnectOptions): EidConnection;
export declare function toCard(event: CardReadEvent): EmiratesIdCard;
export declare function parseDate(value: string | undefined): string | null;
export declare function ageOn(dateOfBirth: string, on?: Date): number | null;
export declare function getStatus(url?: string): Promise<{ status: string; clients: number; timestamp: string } | null>;
