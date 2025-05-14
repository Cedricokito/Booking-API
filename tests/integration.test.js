const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/app');

const prisma = new PrismaClient();

let authToken;
let testUserId;
let testPropertyId;
let testBookingId;
let testReviewId;

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testProperty = {
  title: 'Test Property',
  description: 'A test property',
  price: 100,
  location: 'Test Location'
};

// Setup before tests
beforeAll(async () => {
  // Clean up database
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
});

// Cleanup after tests
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth Flow', () => {
  test('1. Register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    
    authToken = res.body.token;
    testUserId = res.body.user.id;
  });

  test('2. Login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('3. Get current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', testUser.email);
  });
});

describe('Property Flow', () => {
  test('1. Create new property', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testProperty);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('title', testProperty.title);
    
    testPropertyId = res.body.id;
  });

  test('2. Get all properties', async () => {
    const res = await request(app)
      .get('/api/properties');
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.properties)).toBeTruthy();
    expect(res.body.pagination).toBeTruthy();
  });

  test('3. Get property by id', async () => {
    const res = await request(app)
      .get(`/api/properties/${testPropertyId}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', testPropertyId);
    expect(res.body).toHaveProperty('averageRating');
  });

  test('4. Search properties', async () => {
    const res = await request(app)
      .get('/api/properties')
      .query({
        search: 'Test',
        minPrice: 50,
        maxPrice: 150,
        location: 'Location'
      });
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.properties)).toBeTruthy();
  });
});

describe('Booking Flow', () => {
  test('1. Create new booking', async () => {
    const booking = {
      propertyId: testPropertyId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(booking);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('propertyId', testPropertyId);
    
    testBookingId = res.body.id;
  });

  test('2. Get user bookings', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('3. Update booking status', async () => {
    const res = await request(app)
      .put(`/api/bookings/${testBookingId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'CONFIRMED' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'CONFIRMED');
  });
});

describe('Review Flow', () => {
  test('1. Create new review', async () => {
    const review = {
      propertyId: testPropertyId,
      rating: 5,
      comment: 'Great property!'
    };

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send(review);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('rating', 5);
    
    testReviewId = res.body.id;
  });

  test('2. Get property reviews', async () => {
    const res = await request(app)
      .get(`/api/properties/${testPropertyId}/reviews`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('3. Update review', async () => {
    const res = await request(app)
      .put(`/api/reviews/${testReviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        rating: 4,
        comment: 'Updated review'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('rating', 4);
  });
});

describe('Error Handling', () => {
  test('1. Invalid property creation', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});
    
    expect(res.statusCode).toBe(400);
  });

  test('2. Invalid booking dates', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        propertyId: testPropertyId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      });
    
    expect(res.statusCode).toBe(400);
  });

  test('3. Invalid review rating', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        propertyId: testPropertyId,
        rating: 6,
        comment: 'Invalid rating'
      });
    
    expect(res.statusCode).toBe(400);
  });
}); 