const request = require('supertest');
const app = require('../../src/app');
const { connectDatabase, clearDatabase, closeDatabase, createTestUserAndToken } = require('../utils/testSetup');

describe('Property Tests', () => {
  let authToken;
  const testProperty = {
    title: 'Test Property',
    description: 'A beautiful test property',
    price: 100,
    location: 'Test Location',
    amenities: ['wifi', 'parking']
  };

  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    const { token } = await createTestUserAndToken();
    authToken = token;
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/properties', () => {
    it('should create a new property', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProperty);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('title', testProperty.title);
      expect(res.body.data).toHaveProperty('price', testProperty.price);
      expect(res.body.data).toHaveProperty('userId');
    });

    it('should not create property without authentication', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send(testProperty);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/properties', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProperty);
    });

    it('should get all properties', async () => {
      const res = await request(app)
        .get('/api/properties');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.properties)).toBeTruthy();
      expect(res.body.data.properties.length).toBe(1);
    });

    it('should filter properties by price range', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ minPrice: 50, maxPrice: 150 });

      expect(res.status).toBe(200);
      expect(res.body.data.properties.length).toBe(1);
    });
  });

  describe('GET /api/properties/:id', () => {
    let propertyId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProperty);

      propertyId = res.body.id;
    });

    it('should get property by id', async () => {
      const res = await request(app)
        .get(`/api/properties/${propertyId}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('title', testProperty.title);
    });

    it('should return 404 for non-existent property', async () => {
      const res = await request(app)
        .get('/api/properties/123e4567-e89b-12d3-a456-426614174000');

      expect(res.status).toBe(404);
    });
  });
}); 