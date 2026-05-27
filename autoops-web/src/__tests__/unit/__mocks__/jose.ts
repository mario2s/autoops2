import * as crypto from 'crypto';

export class SignJWT {
  private payload: Record<string, unknown> = {};
  private protectedHeader: Record<string, unknown> = {};
  private expirationTime: number | null = null;

  setProtectedHeader(header: Record<string, unknown>) {
    this.protectedHeader = header;
    return this;
  }

  setExpirationTime(time: string | number) {
    if (typeof time === 'string') {
      // Parse duration like '7d', '1h', etc.
      const match = time.match(/^(\d+)([dhms])$/);
      if (match) {
        const [, num, unit] = match;
        const n = parseInt(num);
        const multipliers: Record<string, number> = { d: 86400, h: 3600, m: 60, s: 1 };
        this.expirationTime = Math.floor(Date.now() / 1000) + n * multipliers[unit];
      }
    } else {
      this.expirationTime = time;
    }
    return this;
  }

  constructor(payload: Record<string, unknown>) {
    this.payload = payload;
  }

  async sign(secret: Uint8Array): Promise<string> {
    const header = Buffer.from(JSON.stringify(this.protectedHeader)).toString('base64url');
    const payload = {
      ...this.payload,
      ...(this.expirationTime && { exp: this.expirationTime }),
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Create HMAC SHA-256 signature
    const message = `${header}.${body}`;
    const sig = crypto.createHmac('sha256', secret);
    sig.update(message);
    const signature = sig.digest('base64url');

    return `${message}.${signature}`;
  }
}

export async function jwtVerify(token: string, secret: Uint8Array) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token');
  }

  const [headerStr, bodyStr, signatureStr] = parts;

  // Verify signature
  const message = `${headerStr}.${bodyStr}`;
  const sig = crypto.createHmac('sha256', secret);
  sig.update(message);
  const expectedSignature = sig.digest('base64url');

  if (signatureStr !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  // Decode payload
  const payload = JSON.parse(Buffer.from(bodyStr, 'base64url').toString());

  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return { payload };
}
