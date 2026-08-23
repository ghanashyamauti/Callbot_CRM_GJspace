// Pure Web Crypto authentication helper — 100% Edge runtime & Node.js compatible
// Does NOT use Node Buffer to ensure zero crashes in Next.js Middleware on Vercel.

const COOKIE_NAME = 'callbot_admin_token';
const SECRET = process.env.ADMIN_SESSION_SECRET || 'b8d7a4c9e2f1503698d41bc37a0542fe81c2d96a735e08b14cf692a105e4839d';

export { COOKIE_NAME };

// Base64URL encoding/decoding without Node.js Buffer
function bytesToBase64Url(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(str) {
  const enc = new TextEncoder();
  return bytesToBase64Url(enc.encode(str));
}

function base64UrlToString(base64url) {
  const dec = new TextDecoder();
  return dec.decode(base64UrlToBytes(base64url));
}

async function getKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Create a signed token with payload and expiry
export async function createToken(payload = { user: 'admin' }, expiresInHours = 72) {
  const enc = new TextEncoder();
  const exp = Date.now() + expiresInHours * 3600 * 1000;
  const data = JSON.stringify({ ...payload, exp });
  const dataB64 = stringToBase64Url(data);

  const key = await getKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(dataB64)
  );
  const sigB64 = bytesToBase64Url(new Uint8Array(signatureBuffer));
  return `${dataB64}.${sigB64}`;
}

// Verify a signed token
export async function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataB64, sigB64] = parts;
  try {
    const enc = new TextEncoder();
    const key = await getKey();
    const sigBytes = base64UrlToBytes(sigB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(dataB64)
    );

    if (!isValid) return null;

    const dataJson = base64UrlToString(dataB64);
    const data = JSON.parse(dataJson);

    if (data.exp && Date.now() > data.exp) {
      return null; // expired
    }

    return data;
  } catch (err) {
    return null;
  }
}
