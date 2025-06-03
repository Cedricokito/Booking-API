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
  // Registreer testgebruiker als deze nog niet bestaat
  try {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);
  } catch (e) {
    // negeer fout als gebruiker al bestaat
  }
  // Login met testgebruiker
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: testUser.email,
      password: testUser.password
    });
  authToken = loginRes.body.data ? loginRes.body.data.token : loginRes.body.token;
  testUserId = loginRes.body.data ? loginRes.body.data.user.id : (loginRes.body.user ? loginRes.body.user.id : undefined);
  // Get first property for testing
  const properties = await prisma.property.findMany({
    take: 1
  });
  if (properties.length > 0) {
    testPropertyId = properties[0].id;
  }
});

// Cleanup after tests
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth Flow', () => {
  test('1. Login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data || res.body).toHaveProperty('token');
  });

  test('2. Get current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect((res.body.data || res.body)).toHaveProperty('email', testUser.email);
  });
});

describe('Property Flow', () => {
  test('1. Get all properties', async () => {
    const res = await request(app)
      .get('/api/properties');
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data ? res.body.data.properties : res.body.properties)).toBeTruthy();
    expect((res.body.data ? res.body.data.pagination : res.body.pagination)).toBeTruthy();
  });

  test('2. Get property by id', async () => {
    if (!testPropertyId) {
      console.log('Skipping test: No test property available');
      return;
    }

    const res = await request(app)
      .get(`/api/properties/${testPropertyId}`);
    
    expect(res.statusCode).toBe(200);
    expect((res.body.data || res.body)).toHaveProperty('id', testPropertyId);
    expect((res.body.data || res.body)).toHaveProperty('averageRating');
  });

  test('3. Search properties', async () => {
    const res = await request(app)
      .get('/api/properties')
      .query({
        search: 'Beach',
        minPrice: 50,
        maxPrice: 250,
        location: 'Amsterdam'
      });
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data ? res.body.data.properties : res.body.properties)).toBeTruthy();
  });
});

describe('Booking Flow', () => {
  test('1. Create new booking', async () => {
    if (!testPropertyId) {
      console.log('Skipping test: No test property available');
      return;
    }

    const booking = {
      propertyId: testPropertyId,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(booking);
    
    expect(res.statusCode).toBe(201);
    expect((res.body.data || res.body)).toHaveProperty('propertyId', testPropertyId);
    
    testBookingId = (res.body.data || res.body).id;
  });

  test('2. Get user bookings', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBeTruthy();
  });
});

describe('Review Flow', () => {
  test('1. Get property reviews', async () => {
    if (!testPropertyId) {
      console.log('Skipping test: No test property available');
      return;
    }

    const res = await request(app)
      .get(`/api/properties/${testPropertyId}/reviews`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBeTruthy();
  });
});

describe('Error Handling', () => {
  test('1. Invalid booking dates', async () => {
    if (!testPropertyId) {
      console.log('Skipping test: No test property available');
      return;
    }

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
}); 