type JwtPayload = Record<string, unknown> & {
  exp?: number;
  sub?: string;
  email?: string;
  'cognito:username'?: string;
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64(base64: string) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const char of base64.replace(/=+$/, '')) {
    const index = BASE64_ALPHABET.indexOf(char);

    if (index === -1) {
      continue;
    }

    value = (value << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((value >> bits) & 0xff);
    }
  }

  return output;
}

function decodeBase64Url(base64Url: string) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  return decodeBase64(`${base64}${'='.repeat(padding)}`);
}

function decodeUtf8(value: string) {
  const percentEncoded = value
    .split('')
    .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
    .join('');

  return decodeURIComponent(percentEncoded);
}

export function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split('.');

  if (parts.length < 2) {
    throw new Error('Invalid JWT');
  }

  const json = decodeUtf8(decodeBase64Url(parts[1]));
  return JSON.parse(json) as JwtPayload;
}

export function getJwtExpiration(token: string) {
  return decodeJwtPayload(token).exp ?? 0;
}
