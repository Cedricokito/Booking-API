const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../app');

const prisma = new PrismaClient();

describe('User Routes', () => {
  let token;
  let testUser;

  beforeEach(async () => {
    // Clean up database
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();

    // Maak unieke testgebruiker aan
    const uniqueEmail = `testuser_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: uniqueEmail,
        password: 'password123'
      });

    token = registerRes.body.data.token;
    testUser = registerRes.body.data.user;
  });

  afterAll(async () => {
    await prisma.$disconnect();
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
      expect(res.body.data).toHaveProperty('email', testUser.email);
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
      const res = await request(app).get(`/api/users/${testUser.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated User',
          email: 'updated@example.com'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testUser.id);
      expect(res.body.data).toHaveProperty('name', 'Updated User');
      expect(res.body.data).toHaveProperty('email', 'updated@example.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should not update a non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated User',
          email: 'updated@example.com'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User not found');
    });

    it('should not update a user with invalid email', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated User',
          email: 'invalid-email'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Please provide a valid email');
    });

    it('should not update a user with existing email', async () => {
      // Create another user
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated User',
          email: 'another@example.com' // Email already exists
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Email already exists');
    });

    it('should not update a user without authentication', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .send({
          name: 'Updated User',
          email: 'updated@example.com'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });

    it('should not update another user', async () => {
      // Create another user
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

      const anotherUser = anotherUserRes.body.data.user;

      const res = await request(app)
        .put(`/api/users/${anotherUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated User',
          email: 'updated@example.com'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Not authorized to update this user');
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should update user password', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Password updated successfully');
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
      expect(res.body.message).toBe('Please provide current password and new password');
    });

    it('should not update password with incorrect current password', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Current password is incorrect');
    });

    it('should not update password with short new password', async () => {
      const res = await request(app)
        .put(`/api/users/${testUser.id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: '123' // Too short
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('New password must be at least 6 characters long');
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
      expect(res.body.message).toBe('No token provided');
    });

    it('should not update another user\'s password', async () => {
      // Create another user
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

      const anotherUser = anotherUserRes.body.data.user;

      const res = await request(app)
        .put(`/api/users/${anotherUser.id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Not authorized to update this user');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(204);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(deletedUser).toBeNull();
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
      const res = await request(app).delete(`/api/users/${testUser.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });

    it('should not delete another user', async () => {
      // Create another user
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

      const anotherUser = anotherUserRes.body.data.user;

      const res = await request(app)
        .delete(`/api/users/${anotherUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Not authorized to delete this user');
    });
  });
}); 