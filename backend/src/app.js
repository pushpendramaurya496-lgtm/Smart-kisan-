const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { swaggerUi, swaggerDocument } = require('./config/swagger');

// Custom Swagger UI options matching reference image layout
const swaggerUiOptions = {
  customSiteTitle: 'Kisan Sathi | Chakki Smart AI API Docs',
  customCss: `
    .swagger-ui .topbar { background-color: #1b1b1b; padding: 10px 0; }
    .swagger-ui .topbar .topbar-wrapper a span { font-weight: 700; color: #fff; font-size: 20px; }
    .swagger-ui .info { margin: 25px 0 15px 0; }
    .swagger-ui .info .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 800; font-size: 34px; color: #14233B; }
    .swagger-ui .info .title small.version-stamp { background-color: #7d899b; border-radius: 12px; padding: 2px 8px; font-size: 13px; margin-left: 8px; }
    .swagger-ui .info .title small.oas-version { background-color: #89bf04; border-radius: 12px; padding: 2px 8px; font-size: 13px; margin-left: 6px; }
    .swagger-ui .scheme-container { background: #fafafa; padding: 15px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; }
    .swagger-ui .servers-title { font-weight: 700; color: #3b4151; }
    .swagger-ui .btn.authorize { color: #28a66f; border-color: #28a66f; font-weight: 700; border-radius: 6px; padding: 6px 20px; }
    .swagger-ui .btn.authorize svg { fill: #28a66f; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61affe; border-radius: 4px; font-weight: 700; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90; border-radius: 4px; font-weight: 700; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #fca130; border-radius: 4px; font-weight: 700; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e; border-radius: 4px; font-weight: 700; }
    .swagger-ui .opblock-tag { font-size: 22px; font-weight: 700; color: #14233B; border-bottom: 1px solid #e2e8f0; padding: 16px 0 10px 0; }
    .swagger-ui .opblock-tag small { font-size: 14px; font-weight: 400; color: #64748b; margin-left: 14px; }
    .swagger-ui .opblock .opblock-summary-path { font-weight: 600; font-size: 15px; }
    .swagger-ui .opblock .opblock-summary-description { font-size: 13.5px; color: #64748b; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    tryItOutEnabled: true,
  },
};

const app = express();

// 1. Global Security & Utility Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows Swagger UI to load inline assets smoothly
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 2. Swagger Interactive API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUiOptions));

// 3. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chakki Smart AI Backend Server is healthy and running!',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
  });
});

// 4. API Routes Mounting Point
const apiRoutes = require('./routes');
app.use('/api/v1', apiRoutes);

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Chakki Smart AI API v1. Visit /api-docs for Swagger documentation.',
  });
});

// 5. 404 Route Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route Not Found`,
  });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error('[Error Handler]:', err.message);
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
