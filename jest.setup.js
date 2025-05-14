require('dotenv').config();

console.log('Current working directory:', process.cwd());
console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in .env file');
}

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set'); 