const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    status: 'error',
    message: 'Internal server error',
    statusCode: 500
  };

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        error = {
          status: 'error',
          message: 'A unique constraint would be violated on this record',
          statusCode: 400
        };
        break;
      case 'P2025':
        error = {
          status: 'error',
          message: 'Record not found',
          statusCode: 404
        };
        break;
      default:
        error = {
          status: 'error',
          message: 'Database error',
          statusCode: 500
        };
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      status: 'error',
      message: err.message,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      status: 'error',
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      status: 'error',
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Send error response
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message
  });
};

module.exports = errorHandler; 