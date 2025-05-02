const request = require('supertest');
const app = require('../../src/app');
const {
  createTestUser,
  generateTestToken,
  createTestProperty,
  generateTestData
} = require('../helpers');

describe('Property API Integration Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user and generate token
    testUser = await createTestUser();
    authToken = generateTestToken(testUser);
  });

  describe('POST /api/properties', () => {
    it('should create a new property when authenticated', async () => {
      const propertyData = {
        title: generateTestData('propertyTitle'),
        description: 'Test property description',
        price: 150,
        location: 'Test Location'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(propertyData.title);
      expect(response.body.owner).toBe(testUser._id.toString());
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send({
          title: generateTestData('propertyTitle'),
          description: 'Test property description',
          price: 150,
          location: 'Test Location'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/properties', () => {
    beforeEach(async () => {
      // Create some test properties
      await Promise.all([
        createTestProperty({}, testUser),
        createTestProperty({}, testUser),
        createTestProperty({}, testUser)
      ]);
    });

    it('should return all properties', async () => {
      const response = await request(app)
        .get('/api/properties');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter properties by price range', async () => {
      await createTestProperty({ price: 200 }, testUser);
      await createTestProperty({ price: 300 }, testUser);

      const response = await request(app)
        .get('/api/properties')
        .query({ minPrice: 250, maxPrice: 350 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(property => {
        expect(property.price).toBeGreaterThanOrEqual(250);
        expect(property.price).toBeLessThanOrEqual(350);
      });
    });
  });

  describe('GET /api/properties/:id', () => {
    let testProperty;

    beforeEach(async () => {
      testProperty = await createTestProperty({}, testUser);
    });

    it('should return a specific property by ID', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(testProperty._id.toString());
      expect(response.body.title).toBe(testProperty.title);
    });

    it('should return 404 for non-existent property', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/properties/${nonExistentId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/properties/:id', () => {
    let testProperty;

    beforeEach(async () => {
      testProperty = await createTestProperty({}, testUser);
    });

    it('should update property when owner is authenticated', async () => {
      const updateData = {
        title: generateTestData('propertyTitle'),
        price: 200
      };

      const response = await request(app)
        .put(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.price).toBe(updateData.price);
    });

    it('should return 403 when non-owner tries to update', async () => {
      const otherUser = await createTestUser({ email: generateTestData('email') });
      const otherUserToken = generateTestToken(otherUser);

      const response = await request(app)
        .put(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(403);
    });
  });
}); 