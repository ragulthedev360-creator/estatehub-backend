import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout } from './auth.controller.js';
import { validate, registerSchema, loginSchema } from './auth.validators.js';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});




/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User registration, login, and session management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Ragul Kumar }
 *               email: { type: string, example: ragul@example.com }
 *               phone: { type: string, example: "9876543210" }
 *               password: { type: string, example: Passw0rd123 }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *                 accessToken: { type: string }
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Email already registered
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: ragul@example.com }
 *               password: { type: string, example: Passw0rd123 }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *                 accessToken: { type: string }
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token and issue a new access token
 *     tags: [Auth]
 *     description: Reads the HttpOnly refreshToken cookie automatically — no request body needed.
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid, expired, or reused refresh token
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and revoke the current refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', logout);


export default router;