import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
 
export function generateRefreshToken() {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}