const app = require('./app');
const { connectDB, closeDB } = require('./config/database');

const port = process.env.PORT || 3000;
let server;

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to database
connectDB(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close server (stop accepting new connections)
    if (server) {
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            console.error('Error closing server:', err);
            resolve();
          } else {
            console.log('Server closed successfully');
            resolve();
          }
        });
      });
    }

    // Close database connection
    await closeDB();
    console.log('Database connection closed');

    // Exit process
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  gracefulShutdown('unhandled rejection');
});

module.exports = app; 