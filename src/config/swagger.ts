import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const PORT = process.env.PORT || 5000;

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HoaLang Traditional Craft Villages Platform API',
      version: '1.0.0',
      description: 'API Documentation for HoaLang - Traditional Vietnamese Craft Villages platform with Multi-tenant capabilities. Administrative credentials: admin@restx.food / Admin@123',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './dist/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger documentation registered at: http://localhost:${PORT}/api/docs`);
};

export default setupSwagger;
