// VideoSDK Helper — JWT Token Generator & WebRTC Room Manager
import crypto from 'crypto';

const API_KEY = process.env.VIDEOSDK_API_KEY || '';
const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY || '';

/**
 * Generate a VideoSDK JWT Token valid for 30 days
 */
export function getVideoSDKToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    apikey: API_KEY,
    permissions: ['allow_join', 'allow_mod'],
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

/**
 * Create a new VideoSDK Room
 */
export async function createVideoSDKRoom() {
  const token = getVideoSDKToken();
  const res = await fetch('https://api.videosdk.live/v2/rooms', {
    method: 'POST',
    headers: {
      authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(`Failed to create VideoSDK room: ${res.statusText}`);
  }

  const data = await res.json();
  return { roomId: data.roomId, token };
}
