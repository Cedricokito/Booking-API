const request = require('supertest');
const app = require('../../src/app');
const {
  createTestUser,
  generateTestToken,
  createTestProperty,
  createTestBooking,
  generateTestData
} = require('../helpers');

describe('Booking API Integration Tests', () => {
  let testUser;
  let testProperty;
  let authToken;
  let propertyOwner;

  beforeEach(async () => {
    // Create property owner and property
    propertyOwner = await createTestUser({ email: generateTestData('email') });
    testProperty = await createTestProperty({}, propertyOwner);

    // Create test user and generate token
    testUser = await createTestUser({ email: generateTestData('email') });
    authToken = generateTestToken(testUser);
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking when authenticated and dates are available', async () => {
      const bookingData = {
        propertyId: testProperty._id,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from tomorrow
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.property.toString()).toBe(testProperty._id.toString());
      expect(response.body.user.toString()).toBe(testUser._id.toString());
      expect(response.body.status).toBe('pending');
    });

    it('should return 400 when dates are invalid', async () => {
      const bookingData = {
        propertyId: testProperty._id,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 when dates are already booked', async () => {
      // Create an existing booking
      const existingBooking = {
        propertyId: testProperty._id,
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      };

      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(existingBooking);

      // Try to book overlapping dates
      const overlappingBooking = {
        propertyId: testProperty._id,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(overlappingBooking);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/bookings', () => {
    beforeEach(async () => {
      // Create some test bookings
      await Promise.all([
        createTestBooking({}, testUser, testProperty),
        createTestBooking({}, testUser, testProperty),
        createTestBooking({}, testUser, testProperty)
      ]);
    });

    it('should return user\'s bookings when authenticated', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
      response.body.forEach(booking => {
        expect(booking.user.toString()).toBe(testUser._id.toString());
      });
    });

    it('should return property owner\'s bookings when authenticated', async () => {
      const ownerToken = generateTestToken(propertyOwner);
      
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(booking => {
        expect(booking.property.owner.toString()).toBe(propertyOwner._id.toString());
      });
    });
  });

  describe('PUT /api/bookings/:id', () => {
    let testBooking;

    beforeEach(async () => {
      testBooking = await createTestBooking({}, testUser, testProperty);
    });

    it('should update booking status when property owner is authenticated', async () => {
      const ownerToken = generateTestToken(propertyOwner);
      
      const response = await request(app)
        .put(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('confirmed');
    });

    it('should not allow status update by non-owner', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    let testBooking;

    beforeEach(async () => {
      testBooking = await createTestBooking({}, testUser, testProperty);
    });

    it('should cancel booking when user is the booker', async () => {
      const response = await request(app)
        .delete(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('cancelled');
    });

    it('should not allow cancellation by non-booker', async () => {
      const otherUser = await createTestUser({ email: generateTestData('email') });
      const otherUserToken = generateTestToken(otherUser);

      const response = await request(app)
        .delete(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });

    it('should not allow cancellation of confirmed bookings after 24 hours', async () => {
      // First confirm the booking as owner
      const ownerToken = generateTestToken(propertyOwner);
      await request(app)
        .put(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'confirmed' });

      // Update booking timestamp to be older than 24 hours
      await testBooking.updateOne({
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .delete(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 