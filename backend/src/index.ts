import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupRoutes } from './routes/index.js';
import { setupSwagger } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { initDatabase } from './db/connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow Netlify domains
const allowedOrigins = [
  'http://localhost:3000',
  'https://tehnogrupp.netlify.app',
  'https://*.netlify.app', // Allow all Netlify subdomains
  process.env.NETLIFY_SITE_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check Netlify subdomain pattern
    if (origin.includes('.netlify.app')) {
      return callback(null, true);
    }
    
    // Development mode - allow all
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, log but allow for now (можно ужесточить позже)
    logger.warn(`CORS request from unknown origin: ${origin}`);
    callback(null, true); // Temporarily allow all origins for debugging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Routes (must be before 404 handler)
try {
  setupRoutes(app);
  logger.info('Routes setup completed');
} catch (error) {
  logger.error('Failed to setup routes:', error);
  throw error;
}

try {
  setupSwagger(app);
  logger.info('Swagger setup completed');
} catch (error) {
  logger.error('Failed to setup Swagger:', error);
  // Don't throw, Swagger is optional
}

// Log available routes on startup (for debugging)
logger.info('Available API endpoints:', {
  auth: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/me'],
  health: ['GET /api/health'],
  docs: ['GET /api-docs']
});

// 404 handler for undefined routes (must be after all routes)
app.use((req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      statusCode: 404,
      availableRoutes: [
        'GET /api/health',
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/auth/me',
        'GET /api/tenders',
        'GET /api-docs'
      ]
    }
  });
});

// Error handler
app.use(errorHandler);

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    logger.info('Database initialized');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Only start server if not in Netlify Functions environment
if (process.env.NETLIFY !== 'true' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  start();
}

export { app };
