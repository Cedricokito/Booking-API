const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');

const prisma = new PrismaClient();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    // Validate required fields
    if (!username || !name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide username, name, email and password'
      });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        data: null,
        message: 'Please provide a valid email'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        data: null,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        data: null,
        message: 'Email already exists'
      });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        status: 'error',
        data: null,
        message: 'Username already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: { username, name, email, password: hashedPassword },
      select: { id: true, username: true, name: true, email: true }
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.AUTH_SECRET_KEY,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      status: 'success',
      data: { user, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      data: null,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate required fields
    if ((!email && !username) || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email or username and password'
      });
    }

    // Find user by email or username
    let user;
    if (email) {
      // Validate email format
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid email'
        });
      }
      user = await prisma.user.findUnique({
        where: { email }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { username }
      });
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.AUTH_SECRET_KEY,
      { expiresIn: '1d' }
    );

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: req.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 