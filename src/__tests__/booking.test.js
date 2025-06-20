const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let token;
let testUser;
let testProperty;
let testBooking;

describe('Booking Routes', () => {
  beforeEach(async () => {
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

    // Create test property
    const propertyRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Property',
        description: 'A beautiful test property',
        pricePerNight: 100,
        location: 'Test Location',
        amenities: []
      });
    if (!propertyRes.body.data || !propertyRes.body.data.id) {
      throw new Error('Testproperty aanmaken mislukt: ' + JSON.stringify(propertyRes.body));
    }
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
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 15);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({
          propertyId: testProperty.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testProperty.id);
      expect(res.body.data).toHaveProperty('userId', testUser.id);
      expect(['pending', 'PENDING']).toContain(res.body.data.status);
    });

    it('should not create a booking without required fields', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should not create a booking with invalid dates', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: new Date('2024-05-05').toISOString(), // End date before start date
          endDate: new Date('2024-05-01').toISOString()
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('End date must be after start date');
    });

    it('should not create a booking with past dates', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: new Date('2023-01-01').toISOString(),
          endDate: new Date('2023-01-05').toISOString()
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Start date must be in the future');
    });

    it('should not create a booking for non-existent property', async () => {
      const startDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: 'non-existent-id',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      expect([400, 404]).toContain(res.statusCode);
      expect(res.body.status).toBe('error');
      expect([
        'Property not found',
        'Invalid property'
      ]).toContain(res.body.message);
    });

    it('should not create a booking without authentication', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          propertyId: testProperty.id,
          startDate: new Date('2024-05-01').toISOString(),
          endDate: new Date('2024-05-05').toISOString()
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/bookings', () => {
    it('should get all bookings for user', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]).toHaveProperty('id', testBooking.id);
    });

    it('should filter bookings by status', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBe(1);
      expect(['pending', 'PENDING']).toContain(res.body.data[0].status);
    });

    it('should not get bookings without authentication', async () => {
      const res = await request(app)
        .get('/api/bookings');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should get a booking by id', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .get(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${freshToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testBooking.id);
      expect(res.body.data).toHaveProperty('propertyId', testProperty.id);
      expect(res.body.data).toHaveProperty('userId', testUser.id);
    });

    it('should not get a non-existent booking', async () => {
      const res = await request(app)
        .get('/api/bookings/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Booking not found');
    });

    it('should not get a booking without authentication', async () => {
      const res = await request(app)
        .get(`/api/bookings/${testBooking.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('PUT /api/bookings/:id/status', () => {
    it('should update booking status', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .put(`/api/bookings/${testBooking.id}/status`)
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ status: 'CONFIRMED' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(['confirmed', 'CONFIRMED']).toContain(res.body.data.status);
    });

    it('should not update a non-existent booking', async () => {
      const res = await request(app)
        .put('/api/bookings/non-existent-id/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'confirmed' });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Booking not found');
    });

    it('should not update a booking without status', async () => {
      const res = await request(app)
        .put(`/api/bookings/${testBooking.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should not update a booking without authentication', async () => {
      const res = await request(app)
        .put(`/api/bookings/${testBooking.id}/status`)
        .send({ status: 'confirmed' });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('should cancel a booking', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });
      const freshToken = loginRes.body.data.token;

      const res = await request(app)
        .delete(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${freshToken}`);
      expect([200, 204]).toContain(res.statusCode);
      if (res.body && res.body.status) {
        expect(res.body.status).toBe('success');
        expect([
          'Booking cancelled successfully',
          'Booking cancelled'
        ]).toContain(res.body.message);
      }
    });

    it('should not cancel a non-existent booking', async () => {
      const res = await request(app)
        .delete('/api/bookings/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Booking not found');
    });

    it('should not cancel a completed booking', async () => {
      // First update booking to completed
      await request(app)
        .put(`/api/bookings/${testBooking.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'completed' });

      // Try to cancel completed booking
      const res = await request(app)
        .delete(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Cannot cancel a completed booking');
    });

    it('should not cancel a booking without authentication', async () => {
      const res = await request(app)
        .delete(`/api/bookings/${testBooking.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });
}); 