import { Router } from 'express';
import passport from 'passport';
import { authController } from './auth.controller';
import { protect } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.dto';
import { upload } from '../../middleware/upload.middleware';

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - fullName
 *               - password
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: guest@gmail.com
 *               fullName:
 *                 type: string
 *                 example: Nguyen Van A
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Guest@123
 *               phone:
 *                 type: string
 *                 example: 0987654321
 *               avatar:
 *                 type: string
 *                 format: binary
 *               role:
 *                 type: string
 *                 enum: [USER, VILLAGE_OWNER, ADMIN]
 *                 example: USER
 *               locale:
 *                 type: string
 *                 example: vi
 *     responses:
 *       201:
 *         description: User profile created successfully and activation email sent
 *       400:
 *         description: Validation failed or email already exists
 */
router.post(
  '/register',
  upload.single('avatar'),
  validateRequest(registerSchema),
  authController.register
);

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
 *                 example: admin@hoalang.vn
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
 * /auth/verify-account:
 *   get:
 *     summary: Activate user account via email token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Account activation token
 *     responses:
 *       200:
 *         description: Account successfully activated
 *       400:
 *         description: Invalid or expired activation token
 */
router.get('/verify-account', authController.verifyAccount);

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
router.get('/google', (req, res, next) => {
  const isMobile = req.query.device === 'mobile' || /mobile/i.test(req.headers['user-agent'] || '');
  const state = isMobile ? 'mobile' : 'desktop';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: state,
  })(req, res, next);
});

// Callback routing after Google authorization redirects
router.get('/google/callback', authController.googleCallback);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: guest@gmail.com
 *     responses:
 *       200:
 *         description: Reset email sent successfully
 *       404:
 *         description: Email not found
 */
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using verification token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: jwt-verification-token-string
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPass@123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset token
 */
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

export default router;

