import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

// On Vercel the HTTP layer is handled by the platform.
// Prisma connects lazily on first query, so no explicit listen() needed.
if (!process.env.VERCEL) {
  const startServer = async (): Promise<void> => {
    try {
      await connectDatabase();
      console.log('Database connected successfully');

      const server = app.listen(env.PORT, () => {
        console.log(`🚀 Server running on port ${env.PORT}`);
        console.log(`📍 Environment: ${env.NODE_ENV}`);
      });

      const gracefulShutdown = async (signal: string) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        server.close(async () => {
          console.log('HTTP server closed');
          await disconnectDatabase();
          console.log('Database connection closed');
          process.exit(0);
        });
        setTimeout(() => {
          console.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

// Exported for Vercel serverless runtime
export default app;
