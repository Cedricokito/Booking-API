const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { execSync } = require('child_process');

let token;
let testUser;
let anotherToken;
let anotherUser;

describe('User Routes', () => {
  beforeEach(async () => {
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    execSync('npx prisma db seed', { stdio: 'inherit' });
    // Clean up database
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();

    // Register test user via API
    const uniqueEmail = `testuser_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        name: 'Test User',
        email: uniqueEmail,
        password: 'password123'
      });
    if (!registerRes.body.data || !registerRes.body.data.token) {
      throw new Error('Testgebruiker registratie mislukt: ' + JSON.stringify(registerRes.body));
    }
    token = registerRes.body.data.token;
    testUser = registerRes.body.data.user;

    // Register another user for authorization tests
    const anotherEmail = `another_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
    const anotherUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'anotheruser',
        name: 'Another User',
        email: anotherEmail,
        password: 'password123'
      });
    if (!anotherUserRes.body.data || !anotherUserRes.body.data.token) {
      throw new Error('Tweede testgebruiker registratie mislukt: ' + JSON.stringify(anotherUserRes.body));
    }
    anotherToken = anotherUserRes.body.data.token;
    anotherUser = anotherUserRes.body.data.user;
  });

  describe('GET /api/users/:id', () => {
    it('should get a user by id', async () => {
      const res = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testUser.id);
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should not get a non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User not found');
    });

    it('should not get a user without authentication', async () => {
      const res = await request(app)
        .get(`/api/users/${testUser.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const updates = {
        name: 'Updated User',
        email: `updated_${Date.now()}@example.com`
      };

      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testUser.id);
      expect(res.body.data).toHaveProperty('name', updates.name);
      expect(res.body.data).toHaveProperty('email', updates.email);
    });

    it('should not update a non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated User' });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User not found');
    });

    it('should not update a user with invalid email', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ email: 'invalid-email' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(['Invalid email format', 'Please provide a valid email']).toContain(res.body.message);
    });

    it('should not update a user with existing email', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ email: anotherUser.email });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(['Email already exists', 'Email is already taken']).toContain(res.body.message);
    });

    it('should not update a user without authentication', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .send({ name: 'Updated User' });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should not update another user', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/users/${anotherUser.id}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ name: 'Updated User' });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(['Not authorized to update this user', 'Forbidden']).toContain(res.body.message);
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should update user password', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(['Password updated successfully', 'Password changed successfully']).toContain(res.body.message);
    });

    it('should not update password for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/non-existent-id/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User not found');
    });

    it('should not update password without current password', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect([
        'Current password is required',
        'Please provide current password and new password'
      ]).toContain(res.body.message);
    });

    it('should not update password with incorrect current password', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect([
        'Current password is incorrect',
        'Invalid current password'
      ]).toContain(res.body.message);
    });

    it('should not update password with short new password', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'short'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect([
        'Password must be at least 8 characters long',
        'New password must be at least 6 characters long'
      ]).toContain(res.body.message);
    });

    it('should not update password without authentication', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should not update another user\'s password', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/users/${anotherUser.id}/password`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect([
        'Not authorized to update this user',
        'Forbidden'
      ]).toContain(res.body.message);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${freshToken}`);

      expect([200, 204]).toContain(res.statusCode);
    });

    it('should not delete a non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User not found');
    });

    it('should not delete a user without authentication', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUser.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should not delete another user', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .delete(`/api/users/${anotherUser.id}`)
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect([
        'Not authorized to delete this user',
        'Forbidden'
      ]).toContain(res.body.message);
    });
  });
}); 