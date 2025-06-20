const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../app');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

let token;
let user;

describe('Auth Routes', () => {
  beforeEach(async () => {
    // Register test user via API
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        name: 'Test User',
        email: uniqueEmail,
        password: 'password123'
      });

    token = registerRes.body.data.token;
    user = registerRes.body.data.user;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const unique = Date.now();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `testuser_${unique}`,
          name: 'Test User',
          email: `test_${unique}@example.com`,
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user).toHaveProperty('name', 'Test User');
      expect(res.body.data.user).toHaveProperty('email', `test_${unique}@example.com`);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should not register a user without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User'
          // Missing username, email and password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Please provide username, name, email and password');
    });

    it('should not register a user with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Please provide a valid email');
    });

    it('should not register a user with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          password: '123' // Too short
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should not register a user with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser1',
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          name: 'Another User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let unique, email, username;
    beforeEach(async () => {
      unique = Date.now();
      email = `test_${unique}@example.com`;
      username = `testuser_${unique}`;
      await request(app)
        .post('/api/auth/register')
        .send({
          username,
          name: 'Test User',
          email,
          password: 'password123'
        });
    });

    it('should login a user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user).toHaveProperty('name', 'Test User');
      expect(res.body.data.user).toHaveProperty('email', email);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should not login a user without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Please provide email or username and password');
    });

    it('should not login a user with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Please provide a valid email');
    });

    it('should not login a user with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should not login a user with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let token, unique, email, username;

    beforeEach(async () => {
      unique = Date.now();
      email = `test_${unique}@example.com`;
      username = `testuser_${unique}`;
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          name: 'Test User',
          email,
          password: 'password123'
        });

      token = registerRes.body.data.token;
    });

    it('should get current user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).toHaveProperty('email', email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should not get current user without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });

    it('should not get current user with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid token');
    });
  });
}); 