const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { ValidationError, AuthenticationError } = require('../utils/errors');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.AUTH_SECRET_KEY || 'test-secret', { expiresIn: '24h' });
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Create user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Update basic info
    if (name) user.name = name;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        throw new ValidationError('Email already in use');
      }
      user.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        throw new AuthenticationError('Current password is incorrect');
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}; 