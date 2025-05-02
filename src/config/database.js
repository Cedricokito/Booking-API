const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.uri = null;
    this.connectionPromise = null;
    this.isConnecting = false;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.connectionTimeout = 10000; // 10 seconds
    this.boundEventHandlers = {
      error: null,
      disconnected: null
    };
  }

  async connect(uri, options = {}) {
    try {
      // If already connected to the same URI, return existing connection
      if (this.connection && this.uri === uri && mongoose.connection.readyState === 1) {
        return this.connection;
      }

      // If already trying to connect, wait for that connection
      if (this.isConnecting && this.connectionPromise) {
        return this.connectionPromise;
      }

      // If connected to a different URI or connection is broken, disconnect first
      if (mongoose.connection.readyState !== 0) {
        await this.disconnect();
      }

      this.isConnecting = true;
      this.uri = uri;

      // Create connection promise with timeout
      this.connectionPromise = this._connectWithRetry(uri, options);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.connectionTimeout);
      });

      // Race between connection and timeout
      this.connection = await Promise.race([
        this.connectionPromise,
        timeoutPromise
      ]);

      // Set up event handlers (removing old ones first)
      this._setupEventHandlers();

      return this.connection;
    } catch (error) {
      this._cleanup();
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async _connectWithRetry(uri, options, retryCount = 0) {
    try {
      return await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        ...options
      });
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(`Retrying connection attempt ${retryCount + 1}/${this.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this._connectWithRetry(uri, options, retryCount + 1);
      }
      throw error;
    }
  }

  _setupEventHandlers() {
    // Remove existing handlers if they exist
    this._removeEventHandlers();

    // Create new handlers
    this.boundEventHandlers.error = (error) => {
      console.error('MongoDB connection error:', error);
    };

    this.boundEventHandlers.disconnected = () => {
      console.log('MongoDB disconnected');
      this._cleanup();
    };

    // Attach new handlers
    mongoose.connection.on('error', this.boundEventHandlers.error);
    mongoose.connection.on('disconnected', this.boundEventHandlers.disconnected);
  }

  _removeEventHandlers() {
    if (this.boundEventHandlers.error) {
      mongoose.connection.off('error', this.boundEventHandlers.error);
    }
    if (this.boundEventHandlers.disconnected) {
      mongoose.connection.off('disconnected', this.boundEventHandlers.disconnected);
    }
  }

  _cleanup() {
    this.connection = null;
    this.uri = null;
    this.connectionPromise = null;
    this._removeEventHandlers();
  }

  async disconnect() {
    try {
      this._removeEventHandlers();
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      this._cleanup();
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async clear() {
    try {
      if (!this.connection || mongoose.connection.readyState !== 1) {
        throw new Error('Not connected to database');
      }

      const collections = mongoose.connection.collections;
      await Promise.all(
        Object.values(collections).map(async (collection) => {
          try {
            await collection.deleteMany({});
          } catch (error) {
            console.error(`Error clearing collection ${collection.collectionName}:`, error);
            throw error;
          }
        })
      );
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }

  getConnectionState() {
    return {
      readyState: mongoose.connection.readyState,
      uri: this.uri,
      isConnecting: this.isConnecting
    };
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

// Export singleton methods
module.exports = {
  connectDB: (uri, options = {}) => databaseManager.connect(uri, options),
  closeDB: () => databaseManager.disconnect(),
  clearDB: () => databaseManager.clear(),
  getConnectionState: () => databaseManager.getConnectionState()
}; 