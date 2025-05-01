const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../utils/errors');
const User = require('../models/user.model');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      req.user = {
        userId: user._id,
        role: user.role
      };
      next();
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  } catch (error) {
    next(error);
  }
};

exports.requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthenticationError('Not authorized to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}; 