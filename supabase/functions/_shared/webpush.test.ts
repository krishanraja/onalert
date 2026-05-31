// Runtime correctness test for the Web Push crypto (RFC 8291 + RFC 8292).
// Run: deno test supabase/functions/_shared/webpush.test.ts
//
// We can't hit a real push service offline, so instead we play BOTH sides:
// generate a receiver keypair (the "browser"), encrypt as the sender, then
// decrypt as the receiver and assert the plaintext round-trips. That exercises
// the exact ECDH -> HKDF -> AES-128-GCM path a real push gateway relays.
import {
  encryptPayload,
  buildVapidAuthHeader,
  bytesToB64url,
  b64urlToBytes,
} from './webpush.ts'
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const b64url = (bytes: Uint8Array): string => bytesToB64url(bytes)
const enc = (s: string): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>
const bytes = (a: Uint8Array): Uint8Array<ArrayBuffer> =>
  new Uint8Array(a) as Uint8Array<ArrayBuffer>

function concatBytes(...a: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0))
  let o = 0
  for (const x of a) { out.set(x, o); o += x.length }
  return out
}

async function hkdf(
  salt: Uint8Array<ArrayBuffer>,
  ikm: Uint8Array<ArrayBuffer>,
  info: Uint8Array<ArrayBuffer>,
  len: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8),
  )
}

// Re-derive the receiver side to decrypt what encryptPayload produced.
async function decryptAsReceiver(
  body: Uint8Array,
  receiverPriv: CryptoKey,
  receiverPubRaw: Uint8Array,
  authSecret: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array> {
  // Parse aes128gcm header: salt(16) || rs(4) || idlen(1) || keyid(idlen)
  const salt = bytes(body.slice(0, 16))
  const idlen = body[20]
  const senderPubRaw = bytes(body.slice(21, 21 + idlen))
  const ciphertext = bytes(body.slice(21 + idlen))

  const senderKey = await crypto.subtle.importKey(
    'raw', senderPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  )
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: senderKey }, receiverPriv, 256),
  ) as Uint8Array<ArrayBuffer>

  const keyInfo = concatBytes(enc('WebPush: info\0'), receiverPubRaw, senderPubRaw)
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32)
  const cek = await hkdf(salt, ikm, enc('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc('Content-Encoding: nonce\0'), 12)

  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt'])
  const plain = new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, ciphertext),
  )
  // Strip the RFC 8188 padding delimiter (0x02 for the last record).
  return plain.slice(0, plain.length - 1)
}

Deno.test('aes128gcm payload round-trips (encrypt as sender, decrypt as receiver)', async () => {
  const receiver = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'],
  ) as CryptoKeyPair
  const receiverPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', receiver.publicKey))
  const authSecret = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>

  const message = { title: 'OnAlert', body: 'JFK slot open', url: '/app/alerts/abc' }
  const body = await encryptPayload(
    { p256dh: b64url(receiverPubRaw), auth: b64url(authSecret) },
    enc(JSON.stringify(message)),
  )

  // Header sanity: salt(16)+rs(4)+idlen(1)+key(65) = 86 bytes minimum.
  assert(body.length > 86, 'body shorter than aes128gcm header')
  assertEquals(body[20], 65, 'keyid length byte must be 65 (uncompressed P-256)')

  const decrypted = await decryptAsReceiver(body, receiver.privateKey, receiverPubRaw, authSecret)
  const got = JSON.parse(new TextDecoder().decode(decrypted))
  assertEquals(got, message)
})

Deno.test('VAPID header is a well-formed ES256 JWT with correct claims', async () => {
  const kp = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'],
  ) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey)
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey))

  const header = await buildVapidAuthHeader({
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    subject: 'mailto:support@onalert.app',
    publicKey: b64url(pubRaw),
    privateKey: jwk.d!, // raw scalar, base64url
  })

  assert(header.startsWith('vapid t='), 'must be a vapid Authorization value')
  const m = header.match(/^vapid t=([^,]+), k=(.+)$/)
  assert(m, 'header must be `vapid t=<jwt>, k=<key>`')
  const [, jwt, k] = m!
  assertEquals(k, b64url(pubRaw), 'k must equal the VAPID public key')

  const [h, p, s] = jwt.split('.')
  const decH = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)))
  const decP = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)))
  assertEquals(decH, { typ: 'JWT', alg: 'ES256' })
  assertEquals(decP.aud, 'https://fcm.googleapis.com', 'aud must be the endpoint ORIGIN')
  assertEquals(decP.sub, 'mailto:support@onalert.app')
  assert(typeof decP.exp === 'number' && decP.exp > Math.floor(Date.now() / 1000), 'exp in future')
  assert(decP.exp <= Math.floor(Date.now() / 1000) + 24 * 60 * 60 + 5, 'exp <= 24h (RFC 8292)')
  assertEquals(b64urlToBytes(s).length, 64, 'ES256 signature must be raw r||s = 64 bytes')

  // Cryptographically verify the signature with the public key.
  const verifyKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'],
  )
  const ok = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    verifyKey,
    b64urlToBytes(s),
    enc(`${h}.${p}`),
  )
  assert(ok, 'VAPID JWT signature must verify against the public key')
})
