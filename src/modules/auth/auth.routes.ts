import { Router } from 'express';
import passport from 'passport';
import { authController } from './auth.controller';
import { protect } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from './auth.dto';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: User authentication and credentials verification
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user profile
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: guest@gmail.com
 *               name:
 *                 type: string
 *                 example: Nguyen Van A
 *               password:
 *                 type: string
 *                 format: password
 *                 example: guest123
 *               avatar:
 *                 type: string
 *                 example: https://avatar.example.com
 *               role:
 *                 type: string
 *                 enum: [USER, VILLAGE_OWNER, ADMIN]
 *                 example: USER
 *               locale:
 *                 type: string
 *                 example: vi
 *     responses:
 *       201:
 *         description: User profile created successfully and tokens issued
 *       400:
 *         description: Validation failed or email already exists
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user using credentials
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@restx.food
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Auth tokens issued successfully
 *       401:
 *         description: Incorrect email or password
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retrieve currently logged-in user profile details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile successfully retrieved
 *       401:
 *         description: Unauthenticated
 */
router.get('/me', protect, authController.getMe);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Obtain a new Access Token using Refresh Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: jwt-refresh-token-hash-string
 *     responses:
 *       200:
 *         description: New access token issued successfully
 *       401:
 *         description: Blacklisted or invalid refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Terminate session by blacklisting Refresh Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: jwt-refresh-token-hash-string
 *     responses:
 *       200:
 *         description: Logout successful and token blacklisted
 *       400:
 *         description: Missing token parameters
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: Authorize via Google Single-Sign-On OAuth2
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google authorization page
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Callback routing after Google authorization redirects
router.get('/google/callback', authController.googleCallback);

export default router;
