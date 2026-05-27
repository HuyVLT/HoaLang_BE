import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import passport from 'passport';
import dotenv from 'dotenv';

dotenv.config();

import { connectCoreDB } from './config/coreDatabase';
import { closeAllTenantConnections } from './config/tenantConnection';
import './config/passport';
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/product/product.routes';
import { resolveTenant, requireTenantDb } from './middleware/tenant.middleware';
import { errorHandler } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';
import { sendResponse } from './utils/response';

const app = express();
const PORT = process.env.PORT ?? 5000;

// ── Security & utility middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Tenant-context Morgan format ──────────────────────────────────────────────
// Logs: [tenant: bat-trang] GET /api/v1/products 200 12ms
morgan.token('tenant', (req: express.Request) => {
  const tenantReq = req as express.Request & { tenant?: { slug: string } };
  return tenantReq.tenant?.slug ?? 'global';
});

app.use(
  morgan(':method :url :status :response-time ms — [tenant: :tenant]')
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendResponse(
      res,
      429,
      false,
      null,
      'Too many requests from this IP address. Please try again in 15 minutes.'
    );
  },
});
app.use('/api', limiter);

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Swagger docs ──────────────────────────────────────────────────────────────
setupSwagger(app);

// ── Core (non-tenant) routes ──────────────────────────────────────────────────
// Auth operates globally against hoalang_core — NO tenant middleware here
app.use('/api/v1/auth', authRoutes);

// ── Tenant-scoped routes ──────────────────────────────────────────────────────
app.use('/api/v1/products', resolveTenant, requireTenantDb, productRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res): void => {
  sendResponse(res, 404, false, null, `Route ${req.originalUrl} not found.`);
});

// ── Centralized error handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const bootExpressApp = async (): Promise<void> => {
  // Connect to the shared core database first
  await connectCoreDB();
  console.log('[App] hoalang_core database ready.');

  const server = app.listen(PORT, () => {
    console.log(`[App] Server running → http://localhost:${PORT}`);
    console.log(`[App] Swagger docs  → http://localhost:${PORT}/api/docs`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[App] ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await closeAllTenantConnections();
      console.log('[App] All tenant connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

bootExpressApp().catch((err) => {
  console.error('[App] Fatal crash on bootstrap:', err);
  process.exit(1);
});
