import {
  registerUser,
  loginUser,
  refreshSession,
  revokeRefreshToken,
} from './auth.service.js';

const REFRESH_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS || 7);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await registerUser(
      req.validatedBody
    ); 
    
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await loginUser(
      req.validatedBody
    );
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.status(200).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies?.refreshToken;
    const { user, accessToken, refreshToken } = await refreshSession(rawToken);
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.status(200).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.refreshToken;
    await revokeRefreshToken(rawToken);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}