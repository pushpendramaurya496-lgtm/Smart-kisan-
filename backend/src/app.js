const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Chakki Smart AI API Docs',
}));

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
