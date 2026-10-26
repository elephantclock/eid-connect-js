# EID Connect JS: Emirates ID integration for web apps

> **Building this for a business?** Commercial use needs a licence, which also gets you the EID Connect reader service, setup support and updates.
> **[Get a commercial licence →](./COMMERCIAL.md)** · [info@elephantclock.tech](mailto:info@elephantclock.tech?subject=EID%20Connect) · [WhatsApp +971 50 702 2916](https://wa.me/971507022916)

Read a UAE Emirates ID card straight into your web app. A customer taps the card on a
reader, and your form gets the name (English and Arabic), ID number, nationality, date of
birth, expiry and photo **in under a second**, with no re-typing and no browser plugin.

```
Emirates ID reader ──► EID Connect service (Windows PC) ──► your web / mobile / kiosk app
                         local HTTP + Server-Sent Events      this library
```

- **Zero dependencies.** It's about 5 KB unminified and works in any browser, in Node 18+ and in kiosk shells.
- **Typed.** TypeScript definitions are included.
- **React hook** included: `useEidReader()`.
- **Bilingual.** Arabic and English names and nationality.
- **Auto-reconnect** when the reader service restarts.

## Install

```bash
npm install @elephantclock/eid-connect
```

## Quick start

```js
import { connect } from '@elephantclock/eid-connect';

connect({
  onStatus: (status) => console.log('reader', status), // connecting | connected | disconnected
  onCard: (card) => {
    form.name.value = card.nameEnglish;
    form.nameAr.value = card.nameArabic;
    form.emiratesId.value = card.idNumber;
    form.dob.value = card.dateOfBirth;   // ISO yyyy-MM-dd
    photo.src = card.photoDataUrl;
  },
});
```

### React

```jsx
import { useEidReader } from '@elephantclock/eid-connect/react';

function Registration() {
  const { isConnected, card } = useEidReader();
  return (
    <>
      <p>{isConnected ? 'Tap an Emirates ID' : 'Reader offline'}</p>
      <input value={card?.nameEnglish ?? ''} readOnly />
    </>
  );
}
```

### No reader yet?

Run the mock bridge. It speaks the same protocol and sends synthetic cards:

```bash
npx @elephantclock/eid-connect-mock     # press c to send a sample card
```

## API

| Function | Description |
|---|---|
| `connect(options)` | Subscribe to the bridge. Returns `{ status, close() }`. |
| `getStatus(url?)` | Resolves to the bridge `/status` payload, or `null` if it isn't running. |
| `toCard(rawEvent)` | Normalise a raw `card_read` event into an `EmiratesIdCard`. |
| `ageOn(dateOfBirth, date?)` | Age in whole years, which is handy for age-restricted sales. |
| `parseDate(value)` | `dd/MM/yyyy` → `yyyy-MM-dd`. |

`connect` options: `url` (default `http://localhost:8080`), `onCard`, `onNfc`, `onStatus`,
`onError`, `reconnectDelayMs`, `EventSource`.

### `EmiratesIdCard`

`idNumber`, `cardNumber`, `cardSerialNumber`, `nameEnglish`, `nameArabic`, `nationality`,
`nationalityArabic`, `gender`, `dateOfBirth`, `issueDate`, `expiryDate`, `photoDataUrl`, `raw`.

Full protocol reference: **[elephantclock.github.io/eid-connect](https://elephantclock.github.io/eid-connect/)**

## Privacy

Emirates ID data is personal data under UAE PDPL. Keep only what you need: the
[age-check example](https://github.com/elephantclock/eid-connect-examples/tree/main/age-check)
shows a flow that stores nothing at all.

## What this is and isn't

EID Connect performs an **offline read** of the card chip, for capture, auto-fill and onboarding.
It does not check the card against government records. Online validation (ICP / UAE PASS)
is a separate, licensed service: [ask us](mailto:info@elephantclock.tech?subject=EID%20online%20validation).

## Licence

Free for **personal, educational and non-commercial** use under the
[PolyForm Noncommercial License 1.0.0](./LICENSE).
**Commercial use requires a licence**: see [COMMERCIAL.md](./COMMERCIAL.md).

---

Made in Abu Dhabi by [ElephantClock](https://www.elephantclock.ae).
Not affiliated with or endorsed by the Federal Authority for Identity, Citizenship, Customs & Port Security (ICP).
