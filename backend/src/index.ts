import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { getPrisma, disconnectDatabase } from './config/database';
import { getRedis, disconnectRedis } from './config/redis';
import { AIAdapterRegistry } from './adapters/registry';

const app: Application = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Import routes
import authRoutes from './routes/auth.routes';
import chatroomRoutes from './routes/chatroom.routes';

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'AI Chatroom API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      chatrooms: '/api/chatrooms',
      sessions: '/api/sessions',
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/chatrooms', chatroomRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Initialize server
const startServer = async () => {
  try {
    // Initialize database connection
    const prisma = getPrisma();
    await prisma.$connect();
    console.log('✓ Database connected');

    // Initialize Redis connection (optional in development)
    const redis = getRedis();
    if (redis) {
      try {
        await redis.connect();
        await redis.ping();
        console.log('✓ Redis connected');
      } catch (error) {
        console.warn('⚠ Redis not available (optional in development)');
      }
    } else {
      console.warn('⚠ Redis not configured (optional in development)');
    }

    // Initialize AI adapters
    AIAdapterRegistry.initialize();
    console.log('✓ AI adapters initialized');

    // Start server
    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   AI Chatroom Server                       ║
║   Sequential Speaking Mode                 ║
╠════════════════════════════════════════════╣
║   Environment: ${config.nodeEnv.padEnd(28)}║
║   Port: ${String(config.port).padEnd(35)}║
║   Frontend: ${config.frontendUrl.padEnd(28)}║
╚════════════════════════════════════════════╝
      `);
      console.log(`Server running at http://localhost:${config.port}`);
      console.log(`API available at http://localhost:${config.port}/api`);
      console.log(`Health check at http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down gracefully...');
  try {
    await disconnectDatabase();
    await disconnectRedis();
    console.log('✓ Connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();
