import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { connect, toCard, parseDate, ageOn, getStatus } from '../src/index.js';

function startBridge(events) {
  const server = http.createServer((req, res) => {
    if (req.url === '/status') return res.end(JSON.stringify({ status: 'running', clients: 0, timestamp: 'x' }));
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    for (const e of events) res.write(`data: ${JSON.stringify(e)}\n\n`);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

test('parseDate converts dd/MM/yyyy to ISO', () => {
  assert.equal(parseDate('15/06/1985'), '1985-06-15');
  assert.equal(parseDate('1985-06-15'), '1985-06-15');
  assert.equal(parseDate('2027-04-14+04:00'), '2027-04-14');
  assert.equal(parseDate('15-06-1985'), '1985-06-15');
  assert.equal(parseDate(''), null);
  assert.equal(parseDate('garbage'), null);
});

test('ageOn handles birthdays not yet reached', () => {
  assert.equal(ageOn('15/06/2008', new Date(2026, 5, 14)), 17);
  assert.equal(ageOn('15/06/2008', new Date(2026, 5, 15)), 18);
});

test('toCard maps bridge fields', () => {
  const c = toCard({ type: 'card_read', timestamp: 't', id: '784-0000-0000001-0', fullNameEnglish: 'A', nfcUid: 'U', dateOfBirth: '01/01/1990', photo: 'AAA' });
  assert.equal(c.idNumber, '784-0000-0000001-0');
  assert.equal(c.cardSerialNumber, 'U');
  assert.equal(c.dateOfBirth, '1990-01-01');
  assert.equal(c.photoDataUrl, 'data:image/jpeg;base64,AAA');
});

test('connect streams card, nfc and error events via fetch fallback', async () => {
  const server = await startBridge([
    { type: 'connection', status: 'connected', timestamp: 't', clientId: '1' },
    { type: 'card_read', timestamp: 't', id: '784-0000-0000001-0', fullNameEnglish: 'SAMPLE' },
    { type: 'nfc_card_read', timestamp: 't', uid: '04A1' },
    { type: 'error', timestamp: 't', message: 'boom' },
  ]);
  const url = `http://127.0.0.1:${server.address().port}`;
  const seen = [];
  await new Promise((done) => {
    const conn = connect({
      url,
      EventSource: null,
      onStatus: (s) => seen.push(`status:${s}`),
      onCard: (c) => seen.push(`card:${c.nameEnglish}`),
      onNfc: (e) => seen.push(`nfc:${e.uid}`),
      onError: (e) => {
        seen.push(`error:${e.message}`);
        conn.close();
        done();
      },
    });
  });
  server.closeAllConnections();
  server.close();
  assert.deepEqual(seen.slice(0, 5), ['status:connected', 'card:SAMPLE', 'nfc:04A1', 'error:boom', 'status:disconnected']);
});

test('getStatus returns null when no bridge is running', async () => {
  assert.equal(await getStatus('http://127.0.0.1:1'), null);
});
