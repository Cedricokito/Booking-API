const request = require('supertest');
const app = require('../../src/app');
const { connectDatabase, clearDatabase, closeDatabase, createTestUserAndToken } = require('../utils/testSetup');

describe('Booking Tests', () => {
  let authToken;
  let propertyId;
  
  const testProperty = {
    title: 'Test Property',
    description: 'A beautiful test property',
    price: 100,
    location: 'Test Location'
  };

  const testBooking = {
    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endDate: new Date(Date.now() + 172800000).toISOString(),  // Day after tomorrow
    guestCount: 2
  };

  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    const { token } = await createTestUserAndToken();
    authToken = token;

    // Create a test property
    const propertyRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testProperty);

    propertyId = propertyRes.body.id;
    testBooking.propertyId = propertyId;
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testBooking);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('property');
      expect(res.body).toHaveProperty('startDate');
      expect(res.body).toHaveProperty('endDate');
      expect(res.body).toHaveProperty('status', 'PENDING');
    });

    it('should not create booking without authentication', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send(testBooking);

      expect(res.status).toBe(401);
    });

    it('should not create booking with invalid dates', async () => {
      const invalidBooking = {
        ...testBooking,
        startDate: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBooking);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/bookings', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testBooking);
    });

    it('should get user bookings', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
    });

    it('should filter bookings by status', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .query({ status: 'PENDING' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('PENDING');
    });
  });

  describe('PUT /api/bookings/:id/status', () => {
    let bookingId;

    beforeEach(async () => {
      const bookingRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testBooking);

      bookingId = bookingRes.body.id;
    });

    it('should update booking status', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'CANCELLED');
    });
  });
}); 