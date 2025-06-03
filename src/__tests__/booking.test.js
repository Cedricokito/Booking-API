const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../app');

const prisma = new PrismaClient();

describe('Booking Routes', () => {
  let token;
  let testUser;
  let testProperty;
  let testBooking;

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
        status: 'PENDING',
        userId: testUser.id,
        propertyId: testProperty.id
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: futureStart,
          endDate: futureEnd
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('startDate');
      expect(res.body.data).toHaveProperty('endDate');
      expect(res.body.data).toHaveProperty('status', 'PENDING');
      expect(res.body.data).toHaveProperty('property');
    });

    it('should not create a booking without required fields', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id
          // Missing dates
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Please provide propertyId, startDate and endDate');
    });

    it('should not create a booking with invalid dates', async () => {
      const futureStart = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: futureStart, // End date before start date
          endDate: futureEnd
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('End date must be after start date');
    });

    it('should not create a booking with past dates', async () => {
      const pastStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const pastEnd = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: testProperty.id,
          startDate: pastStart, // Past date
          endDate: pastEnd
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Start date must be in the future');
    });

    it('should not create a booking for non-existent property', async () => {
      const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: '123e4567-e89b-12d3-a456-426614174000',
          startDate: futureStart,
          endDate: futureEnd
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Property not found');
    });

    it('should not create a booking without authentication', async () => {
      const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/bookings')
        .send({
          propertyId: testProperty.id,
          startDate: futureStart,
          endDate: futureEnd
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('GET /api/bookings', () => {
    it('should get all bookings for user', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('id', testBooking.id);
    });

    it('should filter bookings by status', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .query({ status: 'PENDING' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('status', 'PENDING');
    });

    it('should not get bookings without authentication', async () => {
      const res = await request(app).get('/api/bookings');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should get a booking by id', async () => {
      const res = await request(app)
        .get(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testBooking.id);
      expect(res.body.data).toHaveProperty('startDate');
      expect(res.body.data).toHaveProperty('endDate');
      expect(res.body.data).toHaveProperty('status', 'PENDING');
      expect(res.body.data).toHaveProperty('property');
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
      const res = await request(app).get(`/api/bookings/${testBooking.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('PUT /api/bookings/:id/status', () => {
    it('should update booking status', async () => {
      const res = await request(app)
        .put(`/api/bookings/${testBooking.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testBooking.id);
      expect(res.body.data).toHaveProperty('status', 'CONFIRMED');
    });

    it('should not update a non-existent booking', async () => {
      const res = await request(app)
        .put('/api/bookings/non-existent-id/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

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
      expect(res.body.message).toBe('Please provide status');
    });

    it('should not update a booking without authentication', async () => {
      const res = await request(app)
        .put(`/api/bookings/${testBooking.id}/status`)
        .send({ status: 'CONFIRMED' });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('should cancel a booking', async () => {
      const res = await request(app)
        .delete(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(204);

      // Verify booking is cancelled
      const cancelledBooking = await prisma.booking.findUnique({
        where: { id: testBooking.id }
      });
      expect(cancelledBooking.status).toBe('CANCELLED');
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
      // Update booking to completed
      await prisma.booking.update({
        where: { id: testBooking.id },
        data: { status: 'COMPLETED' }
      });

      const res = await request(app)
        .delete(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Cannot cancel a completed booking');
    });

    it('should not cancel a booking without authentication', async () => {
      const res = await request(app).delete(`/api/bookings/${testBooking.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });
}); 