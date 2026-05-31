// Standards-compliant Web Push for Deno (Web Crypto only — no npm web-push lib,
// which doesn't run cleanly on the edge runtime).
//
// Implements:
//   - RFC 8292  VAPID: an ES256 JWT proving we own the application server key,
//               sent as `Authorization: vapid t=<jwt>, k=<pubkey>`.
//   - RFC 8291  Message encryption (aes128gcm content-coding): per-message
//               ECDH(P-256) -> HKDF -> AES-128-GCM, with the aes128gcm header
//               (salt + record size + sender public key) prepended to the body.
//
// VAPID keys are P-256. VAPID_PRIVATE_KEY is the base64url raw 32-byte `d`
// scalar; VAPID_PUBLIC_KEY is the base64url uncompressed point (65 bytes, 0x04
// prefix) — the same value the browser passed to pushManager.subscribe() as the
// applicationServerKey. Both are produced by `npx web-push generate-vapid-keys`.

// ---------- base64url helpers ----------

// Byte helpers return Uint8Array<ArrayBuffer> (not the default
// Uint8Array<ArrayBufferLike>) so every Web Crypto call accepts them as a
// BufferSource without per-call-site casts under TS 5.7's stricter lib.
export function b64urlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const bin = atob(b64 + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function bytesToB64url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function utf8(s: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>
}

function concat(...arrs: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const total = arrs.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrs) {
    out.set(a, off)
    off += a.length
  }
  return out
}

// ---------- VAPID JWT (RFC 8292, ES256) ----------

// Import the raw 32-byte P-256 private scalar as a JWK so Web Crypto can sign.
// We need the matching public coordinates (x, y) for the JWK; derive them from
// the uncompressed public point (0x04 || X(32) || Y(32)).
async function importVapidSigningKey(
  privateScalarB64url: string,
  publicPointB64url: string,
): Promise<CryptoKey> {
  const pub = b64urlToBytes(publicPointB64url)
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error('VAPID_PUBLIC_KEY must be a 65-byte uncompressed P-256 point (0x04 prefix)')
  }
  const x = pub.slice(1, 33)
  const y = pub.slice(33, 65)
  const d = b64urlToBytes(privateScalarB64url)
  if (d.length !== 32) {
    throw new Error('VAPID_PRIVATE_KEY must be a 32-byte base64url P-256 scalar')
  }
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToB64url(x),
    y: bytesToB64url(y),
    d: bytesToB64url(d),
    ext: true,
  }
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
}

/**
 * Build the VAPID Authorization header value for a push endpoint.
 * `aud` is the endpoint origin; `sub` is a mailto: or https: contact URI.
 * Returns the full header value: `vapid t=<jwt>, k=<vapidPublicKey>`.
 */
export async function buildVapidAuthHeader(opts: {
  endpoint: string
  subject: string
  publicKey: string
  privateKey: string
  /** JWT lifetime in seconds (RFC 8292 caps `exp` at 24h from now). */
  expiresInSeconds?: number
}): Promise<string> {
  const audience = new URL(opts.endpoint).origin
  const nowSec = Math.floor(Date.now() / 1000)
  const exp = nowSec + Math.min(opts.expiresInSeconds ?? 12 * 60 * 60, 24 * 60 * 60)

  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = { aud: audience, exp, sub: opts.subject }

  const signingInput = `${bytesToB64url(utf8(JSON.stringify(header)))}.${bytesToB64url(
    utf8(JSON.stringify(payload)),
  )}`

  const key = await importVapidSigningKey(opts.privateKey, opts.publicKey)
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      utf8(signingInput),
    ),
  )
  // Web Crypto returns the ES256 signature as raw r||s (64 bytes) — exactly the
  // JWS form. No DER unwrapping needed.
  const jwt = `${signingInput}.${bytesToB64url(sig)}`
  return `vapid t=${jwt}, k=${opts.publicKey}`
}

// ---------- HKDF (RFC 5869) over SHA-256 ----------

async function hkdf(
  salt: Uint8Array<ArrayBuffer>,
  ikm: Uint8Array<ArrayBuffer>,
  info: Uint8Array<ArrayBuffer>,
  length: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  )
  return new Uint8Array(bits)
}

// ---------- aes128gcm payload encryption (RFC 8291) ----------

/**
 * Encrypt `payload` for a push subscription using the aes128gcm content coding.
 * Returns the full request body: aes128gcm header || single AES-GCM record.
 *
 * subscription.p256dh = base64url uncompressed receiver public key (65 bytes)
 * subscription.auth    = base64url 16-byte auth secret
 */
export async function encryptPayload(
  subscription: { p256dh: string; auth: string },
  payload: Uint8Array,
): Promise<Uint8Array> {
  const receiverPub = b64urlToBytes(subscription.p256dh)
  const authSecret = b64urlToBytes(subscription.auth)
  if (receiverPub.length !== 65 || receiverPub[0] !== 0x04) {
    throw new Error('subscription p256dh must be a 65-byte uncompressed P-256 point')
  }

  // Ephemeral sender ECDH key pair (fresh per message — RFC 8291 §3.1).
  const senderKeyPair = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )) as CryptoKeyPair
  const senderPubRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', senderKeyPair.publicKey),
  )

  // ECDH shared secret.
  const receiverKey = await crypto.subtle.importKey(
    'raw',
    receiverPub,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: receiverKey },
      senderKeyPair.privateKey,
      256,
    ),
  )

  // Step 1 (RFC 8291 §3.3): PRK_key = HKDF(auth, ecdh, "WebPush: info\0"||ua||as, 32)
  const keyInfo = concat(
    utf8('WebPush: info\0'),
    receiverPub,
    senderPubRaw,
  )
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32)

  // Step 2: salt (16 random bytes), then derive CEK (16) and nonce (12) per RFC 8188.
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, utf8('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, utf8('Content-Encoding: nonce\0'), 12)

  // Single record: plaintext || 0x02 delimiter (last record), then AES-128-GCM.
  const recordSize = 4096
  const plaintext = concat(payload, new Uint8Array([0x02]))
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, plaintext),
  )

  // aes128gcm header (RFC 8188 §2.1): salt(16) || rs(4, big-endian) || idlen(1) || keyid.
  // For Web Push the keyid IS the sender public key (65 bytes).
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, recordSize, false)
  const header = concat(salt, rs, new Uint8Array([senderPubRaw.length]), senderPubRaw)

  return concat(header, ciphertext)
}

// ---------- send ----------

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export interface SendResult {
  status: number
  /** 404/410 mean the subscription is gone and should be deactivated. */
  expired: boolean
}

/**
 * Encrypt + sign + POST one Web Push message. `vapid.subject` must be a
 * mailto:/https: URI. Throws only on unexpected local errors; HTTP failures are
 * returned in SendResult so the caller can decide (e.g. deactivate on 410).
 */
export async function sendWebPush(
  subscription: PushSubscription,
  payloadJson: unknown,
  vapid: { publicKey: string; privateKey: string; subject: string },
  ttlSeconds = 86400,
): Promise<SendResult> {
  const body = await encryptPayload(subscription, utf8(JSON.stringify(payloadJson)))
  const authHeader = await buildVapidAuthHeader({
    endpoint: subscription.endpoint,
    subject: vapid.subject,
    publicKey: vapid.publicKey,
    privateKey: vapid.privateKey,
  })

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttlSeconds),
      Urgency: 'high',
    },
    body,
  })

  // Drain the body so the connection can be reused / closed cleanly.
  await res.arrayBuffer().catch(() => {})

  return { status: res.status, expired: res.status === 404 || res.status === 410 }
}
