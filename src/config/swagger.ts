import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const PORT = process.env.PORT ?? 5000;

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HoaLang Multi-Tenant SaaS API',
      version: '2.0.0',
      description: `
## HoaLang — Vietnamese Traditional Craft Villages Platform

### Multi-Tenant Architecture

This API uses a **Database-per-Tenant** multi-tenant model.

#### Tenant Resolution
Every tenant-scoped endpoint requires one of the following:

| Method | Header / Source | Example |
|--------|----------------|---------|
| **Header (dev/test)** | \`x-tenant-slug\` | \`bat-trang\` |
| **Domain (production)** | \`Host\` header | \`battrang.hoalang.vn\` |

#### Available Tenants (default seeds)
| Slug | Domain | DB Name |
|------|--------|---------|
| \`bat-trang\` | battrang.hoalang.vn | tenant_battrang |
| \`van-phuc\` | vanphuc.hoalang.vn | tenant_vanphuc |
| \`non-nuoc\` | nonnuoc.hoalang.vn | tenant_nonnuoc |

#### Request Lifecycle
\`\`\`
Request
  → Rate Limiter
  → [resolveTenant] — reads x-tenant-slug or Host header
      → Looks up tenant in hoalang_core.tenants
      → Gets (or creates) Mongoose Connection for tenant DB
      → Attaches req.tenant + req.tenantDb
  → [protect] — validates JWT from hoalang_core.users
  → [requireTenantRole] — checks UserTenantRole in hoalang_core
  → Controller — uses req.tenantDb to get tenant-specific models
\`\`\`

#### Authentication
Use Bearer JWT obtained from \`POST /api/v1/auth/login\`.
      `,
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Local development server',
      },
      {
        url: 'https://api.hoalang.vn/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Access Token from POST /auth/login',
        },
      },
      parameters: {
        TenantSlugHeader: {
          in: 'header',
          name: 'x-tenant-slug',
          required: false,
          schema: { type: 'string', example: 'bat-trang' },
          description:
            'Tenant slug for dev/testing. In production, resolved via Host domain.',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts', './dist/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(
    `[Swagger] Documentation available at: http://localhost:${PORT}/api/docs`
  );
};

export default setupSwagger;
