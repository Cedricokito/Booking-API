class CustomError extends Error {
  constructor(message) {
    super(message);
    this.isOperational = true;
  }
}

class ValidationError extends CustomError {
  constructor(message) {
    super(message);
    this.status = 'error';
    this.statusCode = 400;
  }
}

class AuthenticationError extends CustomError {
  constructor(message) {
    super(message);
    this.status = 'error';
    this.statusCode = 401;
  }
}

class AuthorizationError extends CustomError {
  constructor(message) {
    super(message);
    this.status = 'error';
    this.statusCode = 403;
  }
}

class NotFoundError extends CustomError {
  constructor(message) {
    super(message);
    this.status = 'error';
    this.statusCode = 404;
  }
}

module.exports = {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
}; 