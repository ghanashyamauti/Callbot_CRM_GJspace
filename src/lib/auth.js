// Lightweight session token generator & validator using Web Crypto API
// Compatible with both Node.js and Next.js Edge Middleware

const COOKIE_NAME = 'callbot_admin_token';
const SECRET = process.env.ADMIN_SESSION_SECRET || 'gjspaces_fallback_session_secret_key_2026';

export { COOKIE_NAME };

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
  const dataB64 = Buffer.from(data).toString('base64url');

  const key = await getKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(dataB64)
  );
  const sigB64 = Buffer.from(signature).toString('base64url');
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
    const sigBytes = Buffer.from(sigB64, 'base64url');

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(dataB64)
    );

    if (!isValid) return null;

    const dataJson = Buffer.from(dataB64, 'base64url').toString('utf8');
    const data = JSON.parse(dataJson);

    if (data.exp && Date.now() > data.exp) {
      return null; // expired
    }

    return data;
  } catch (err) {
    return null;
  }
}
