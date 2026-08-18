import bcrypt from 'bcrypt';
import { pool } from '../../config/db.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../utils/jwt.js';

const REFRESH_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS || 7);

class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function registerUser({ name, email, phone, password }) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
    email,
  ]);
  if (existing.rows.length > 0) {
    throw new AuthError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, role`,
    [name, email, phone || null, passwordHash]
  );

  const user = result.rows[0];
  return issueSession(user);
}

export async function loginUser({ email, password }) {
  const result = await pool.query(
    `SELECT id, name, email, phone, role, password_hash
     FROM users WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    throw new AuthError('Invalid email or password', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new AuthError('Invalid email or password', 401);
  }

  delete user.password_hash;
  return issueSession(user);
}

export async function refreshSession(rawToken) {
  if (!rawToken) {
    throw new AuthError('No refresh token provided', 401);
  }

  const tokenHash = hashToken(rawToken);

  const result = await pool.query(
    `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
            u.id AS uid, u.name, u.email, u.phone, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
    [tokenHash]
  );

  const row = result.rows[0];

  if (!row) {
    throw new AuthError('Invalid refresh token', 401);
  }

  if (row.revoked) {
    // Reuse of a revoked token — treat as compromised, revoke entire session family
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [
      row.user_id,
    ]);
    throw new AuthError('Session invalidated. Please log in again.', 401);
  }

  if (new Date(row.expires_at) < new Date()) {
    throw new AuthError('Refresh token expired', 401);
  }

  // Rotate: revoke the used token, issue a new one
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [
    row.id,
  ]);

  const user = { id: row.uid, name: row.name, email: row.email, phone: row.phone, role: row.role };
  return issueSession(user);
}

export async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await pool.query(
    'UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1',
    [tokenHash]
  );
}

async function issueSession(user) {
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const { token: refreshToken, tokenHash } = generateRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRY_DAYS);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return { user, accessToken, refreshToken };
}

export { AuthError };