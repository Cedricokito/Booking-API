const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { execSync } = require('child_process');

let token;
let testUser;
let testProperty;
let testBooking;
let testReview;

describe('Review Routes', () => {
  beforeEach(async () => {
    // Register test user via API with unique email
    const uniqueEmail = `testuser_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
    const uniqueUsername = `testuser_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: uniqueUsername,
        name: 'Test User',
        email: uniqueEmail,
        password: 'password123'
      });
    
    if (registerRes.statusCode !== 201 || !registerRes.body.data) {
      console.error('Registration failed:', {
        statusCode: registerRes.statusCode,
        body: registerRes.body,
        text: registerRes.text
      });
      throw new Error('User registration failed: ' + JSON.stringify({
        statusCode: registerRes.statusCode,
        body: registerRes.body
      }));
    }
    
    expect(registerRes.body.data).toBeDefined();
    token = registerRes.body.data.token;
    testUser = registerRes.body.data.user;

    // Create test property via API
    const propertyRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Property',
        description: 'Test Description',
        pricePerNight: 100,
        location: 'Test Location',
        amenities: ['WiFi', 'Pool']
      });
    expect(propertyRes.body.data).toBeDefined();
    testProperty = propertyRes.body.data;

    // Gebruik dynamische toekomstige datums
    const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // morgen
    const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // over 3 dagen

    // Create test booking via API
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propertyId: testProperty.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    if (!bookingRes.body.data || !bookingRes.body.data.id) {
      throw new Error('Testbooking aanmaken mislukt: ' + JSON.stringify(bookingRes.body));
    }
    testBooking = bookingRes.body.data;

    // Update booking status to completed
    const statusRes = await request(app)
      .put(`/api/bookings/${testBooking.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'COMPLETED' });
    
    if (statusRes.statusCode !== 200 || !statusRes.body.data || statusRes.body.data.status !== 'COMPLETED') {
      console.error('Booking status update failed:', {
        statusCode: statusRes.statusCode,
        body: statusRes.body,
        bookingId: testBooking.id,
        token: token ? 'Present' : 'Missing'
      });
      throw new Error('Booking status update mislukt: ' + JSON.stringify({
        statusCode: statusRes.statusCode,
        body: statusRes.body
      }));
    }

    // Don't create test review in beforeEach - let individual tests create reviews as needed
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 4,
          comment: 'Good experience'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testProperty.id);
      expect(res.body.data).toHaveProperty('userId', testUser.id);
      expect(res.body.data).toHaveProperty('rating', 4);
      expect(res.body.data).toHaveProperty('comment', 'Good experience');
    });

    it('should not create a review without required fields', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should not create a review with invalid rating', async () => {
      // Create a new booking and set it to completed
      const startDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const bookingRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      expect(bookingRes.body.data).toBeDefined();

      const statusRes = await request(app)
        .put(`/api/bookings/${bookingRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' });
      expect(statusRes.body.data.status).toBe('COMPLETED');

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: bookingRes.body.data.id,
          rating: 6,
          comment: 'Invalid rating'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should not create a review for non-existent property', async () => {
      // Create a new booking and set it to completed
      const startDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const bookingRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      expect(bookingRes.body.data).toBeDefined();

      const statusRes = await request(app)
        .put(`/api/bookings/${bookingRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' });
      expect(statusRes.body.data.status).toBe('COMPLETED');

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: 'non-existent-id',
          bookingId: bookingRes.body.data.id,
          rating: 5,
          comment: 'Non-existent property'
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
          comment: 'Non-existent booking'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Booking not found');
    });

    it('should not create a review for non-completed booking', async () => {
      // Create a new booking (pending)
      const startDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const newBookingRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      expect(newBookingRes.body.data).toBeDefined();

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: newBookingRes.body.data.id,
          rating: 5,
          comment: 'Pending booking'
        });
      expect([400, 403]).toContain(res.statusCode);
      expect(res.body.status).toBe('error');
      expect([
        'Cannot review a booking that is not completed',
        'Booking is not completed'
      ]).toContain(res.body.message);
    });

    it('should not create a review without authentication', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({
          propertyId: testProperty.id,
          bookingId: 'some-id',
          rating: 5,
          comment: 'Unauthorized review'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/reviews', () => {
    it('should get all reviews for a property', async () => {
      // Create a review first
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });
      expect(reviewRes.body.data).toBeDefined();

      const res = await request(app)
        .get('/api/reviews')
        .query({ propertyId: testProperty.id });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]).toHaveProperty('id', reviewRes.body.data.id);
    });

    it('should filter reviews by rating', async () => {
      // Create a review first
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });
      expect(reviewRes.body.data).toBeDefined();

      const res = await request(app)
        .get('/api/reviews')
        .query({ propertyId: testProperty.id, rating: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]).toHaveProperty('rating', 5);
    });

    it('should return empty array for non-existent property', async () => {
      const res = await request(app)
        .get('/api/reviews')
        .query({ propertyId: 'non-existent-id' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should get a review by id', async () => {
      // Create a new booking and set it to completed
      const startDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const bookingRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      expect(bookingRes.body.data).toBeDefined();

      const statusRes = await request(app)
        .put(`/api/bookings/${bookingRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' });
      expect(statusRes.body.data.status).toBe('COMPLETED');

      // Create a review
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: bookingRes.body.data.id,
          rating: 5,
          comment: 'Great stay!'
        });
      expect(reviewRes.body.data).toBeDefined();

      const res = await request(app)
        .get(`/api/reviews/${reviewRes.body.data.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', reviewRes.body.data.id);
      expect(res.body.data).toHaveProperty('rating', 5);
      expect(res.body.data).toHaveProperty('comment', 'Great stay!');
    });

    it('should not get a non-existent review', async () => {
      const res = await request(app)
        .get('/api/reviews/non-existent-id');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Review not found');
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update a review', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      // Create a review to update
      const reviewToUpdate = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 4,
          comment: 'Initial review'
        });
      expect(reviewToUpdate.statusCode).toBe(201);

      const res = await request(app)
        .put(`/api/reviews/${reviewToUpdate.body.data.id}`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          rating: 4,
          comment: 'Updated review'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', reviewToUpdate.body.data.id);
      expect(res.body.data).toHaveProperty('rating', 4);
      expect(res.body.data).toHaveProperty('comment', 'Updated review');
    });

    it('should not update a non-existent review', async () => {
      const res = await request(app)
        .put('/api/reviews/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 4 });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Review not found');
    });

    it('should not update a review with invalid rating', async () => {
      // Create a review first
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });
      expect(reviewRes.body.data).toBeDefined();

      const res = await request(app)
        .put(`/api/reviews/${reviewRes.body.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 6 });
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should not update a review without authentication', async () => {
      // Create a review first
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });
      expect(reviewRes.body.data).toBeDefined();

      const res = await request(app)
        .put(`/api/reviews/${reviewRes.body.data.id}`)
        .send({ rating: 4 });
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should not update another user\'s review', async () => {
      // Create a review first
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });
      expect(reviewRes.body.data).toBeDefined();

      // Maak een andere gebruiker aan met unieke e-mail
      const anotherEmail = `another_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          name: 'Another User',
          email: anotherEmail,
          password: 'password123'
        });
      expect(anotherUserRes.body.data).toBeDefined();
      const anotherToken = anotherUserRes.body.data.token;
      const res = await request(app)
        .put(`/api/reviews/${reviewRes.body.data.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ rating: 4 });
      expect([403, 401]).toContain(res.statusCode);
      expect(res.body.status).toBe('error');
      expect([
        'Not authorized to update this review',
        'Forbidden'
      ]).toContain(res.body.message);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      // Create a review to delete
      const reviewToDelete = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 3,
          comment: 'To be deleted'
        });
      expect(reviewToDelete.statusCode).toBe(201);

      const res = await request(app)
        .delete(`/api/reviews/${reviewToDelete.body.data.id}`)
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.statusCode).toBe(204);
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
      // Create a review first
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });
      expect(reviewRes.body.data).toBeDefined();

      const res = await request(app)
        .delete(`/api/reviews/${reviewRes.body.data.id}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should not delete another user\'s review', async () => {
      // Create a review first
      const reviewRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          bookingId: testBooking.id,
          rating: 5,
          comment: 'Great stay!'
        });
      expect(reviewRes.body.data).toBeDefined();

      // Maak een andere gebruiker aan met unieke e-mail
      const anotherEmail = `another_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
      const anotherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          name: 'Another User',
          email: anotherEmail,
          password: 'password123'
        });
      expect(anotherUserRes.body.data).toBeDefined();
      const anotherToken = anotherUserRes.body.data.token;
      const res = await request(app)
        .delete(`/api/reviews/${reviewRes.body.data.id}`)
        .set('Authorization', `Bearer ${anotherToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Not authorized to delete this review');
    });
  });
}); 