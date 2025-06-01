const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../app');

const prisma = new PrismaClient();

describe('Review Routes', () => {
  let token;
  let testUser;
  let testProperty;
  let testBooking;
  let testReview;

  beforeEach(async () => {
    // Clean up database
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    token = registerRes.body.data.token;
    testUser = registerRes.body.data.user;

    // Create test property
    testProperty = await prisma.property.create({
      data: {
        title: 'Test Property',
        description: 'Test Description',
        price: 100,
        location: 'Test Location',
        amenities: JSON.stringify(['WiFi', 'Pool']),
        userId: testUser.id
      }
    });

    // Create test booking
    testBooking = await prisma.booking.create({
      data: {
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-05'),
        status: 'COMPLETED',
        userId: testUser.id,
        propertyId: testProperty.id
      }
    });

    // Create test review
    testReview = await prisma.review.create({
      data: {
        rating: 4,
        comment: 'Great stay!',
        userId: testUser.id,
        propertyId: testProperty.id,
        bookingId: testBooking.id
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Excellent experience!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('rating', 5);
      expect(res.body.data).toHaveProperty('comment', 'Excellent experience!');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('property');
    });

    it('should not create a review without required fields', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id
          // Missing rating and comment
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Please provide propertyId, bookingId, rating and comment');
    });

    it('should not create a review with invalid rating', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 6, // Invalid rating
          comment: 'Great stay!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should not create a review for non-existent property', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: 'non-existent-id',
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Property not found');
    });

    it('should not create a review for non-existent booking', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: 'non-existent-id',
          rating: 5,
          comment: 'Great stay!'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Booking not found');
    });

    it('should not create a review for non-completed booking', async () => {
      // Update booking to pending
      await prisma.booking.update({
        where: { id: testBooking.id },
        data: { status: 'PENDING' }
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Cannot review a booking that is not completed');
    });

    it('should not create a review without authentication', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('GET /api/reviews', () => {
    it('should get all reviews for a property', async () => {
      const res = await request(app)
        .get('/api/reviews')
        .query({ propertyId: testProperty.id });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('id', testReview.id);
    });

    it('should filter reviews by rating', async () => {
      const res = await request(app)
        .get('/api/reviews')
        .query({ propertyId: testProperty.id, rating: 4 });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('rating', 4);
    });

    it('should return empty array for non-existent property', async () => {
      const res = await request(app)
        .get('/api/reviews')
        .query({ propertyId: 'non-existent-id' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should get a review by id', async () => {
      const res = await request(app).get(`/api/reviews/${testReview.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testReview.id);
      expect(res.body.data).toHaveProperty('rating', 4);
      expect(res.body.data).toHaveProperty('comment', 'Great stay!');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('property');
    });

    it('should not get a non-existent review', async () => {
      const res = await request(app).get('/api/reviews/non-existent-id');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Review not found');
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update a review', async () => {
      const res = await request(app)
        .put(`/api/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Updated review'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testReview.id);
      expect(res.body.data).toHaveProperty('rating', 5);
      expect(res.body.data).toHaveProperty('comment', 'Updated review');
    });

    it('should not update a non-existent review', async () => {
      const res = await request(app)
        .put('/api/reviews/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: 'Updated review'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Review not found');
    });

    it('should not update a review with invalid rating', async () => {
      const res = await request(app)
        .put(`/api/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 6, // Invalid rating
          comment: 'Updated review'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should not update a review without authentication', async () => {
      const res = await request(app)
        .put(`/api/reviews/${testReview.id}`)
        .send({
          rating: 5,
          comment: 'Updated review'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });

    it('should not update another user\'s review', async () => {
      // Create another user
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

      const anotherToken = anotherUserRes.body.data.token;

      const res = await request(app)
        .put(`/api/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          rating: 5,
          comment: 'Updated review'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Not authorized to update this review');
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(204);

      // Verify review is deleted
      const deletedReview = await prisma.review.findUnique({
        where: { id: testReview.id }
      });
      expect(deletedReview).toBeNull();
    });

    it('should not delete a non-existent review', async () => {
      const res = await request(app)
        .delete('/api/reviews/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Review not found');
    });

    it('should not delete a review without authentication', async () => {
      const res = await request(app).delete(`/api/reviews/${testReview.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });

    it('should not delete another user\'s review', async () => {
      // Create another user
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123'
        });

      const anotherToken = anotherUserRes.body.data.token;

      const res = await request(app)
        .delete(`/api/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Not authorized to delete this review');
    });
  });
}); 