const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let token;
let testUser;
let testProperty;

describe('Property Routes', () => {
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

    // Create test property via API
    const propertyRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Property',
        description: 'Test Description',
        pricePerNight: 100,
        location: 'Test Location',
        amenities: []
      });
    if (!propertyRes.body.data || !propertyRes.body.data.id) {
      throw new Error('Testproperty aanmaken mislukt: ' + JSON.stringify(propertyRes.body));
    }
    testProperty = propertyRes.body.data;
  });

  describe('GET /api/properties', () => {
    it('should get all properties with pagination', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.properties)).toBeTruthy();
      expect(res.body.data.properties.length).toBe(1);
      expect(res.body.data.properties[0].title).toBe('Test Property');
    });

    it('should filter properties by search term', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ search: 'Test' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.properties)).toBeTruthy();
      expect(res.body.data.properties.length).toBe(1);
      expect(res.body.data.properties[0].title).toBe('Test Property');
    });

    it('should filter properties by price range', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ minPrice: 50, maxPrice: 150 });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.properties)).toBeTruthy();
      expect(res.body.data.properties.length).toBe(1);
      expect(res.body.data.properties[0].pricePerNight).toBe(100);
    });

    it('should filter properties by location', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ location: 'Test Location' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.properties)).toBeTruthy();
      expect(res.body.data.properties.length).toBe(1);
      expect(res.body.data.properties[0].location).toBe('Test Location');
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should get a property by id', async () => {
      const res = await request(app)
        .get(`/api/properties/${testProperty.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testProperty.id);
      expect(res.body.data).toHaveProperty('title', 'Test Property');
    });

    it('should return 404 for non-existent property', async () => {
      const res = await request(app)
        .get('/api/properties/non-existent-id');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Property not found');
    });
  });

  describe('POST /api/properties', () => {
    it('should create a new property', async () => {
      const newProperty = {
        title: 'New Property',
        description: 'New Description',
        pricePerNight: 200,
        location: 'New Location',
        amenities: ['Parking', 'Garden']
      };

      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send(newProperty);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('title', newProperty.title);
      expect(res.body.data).toHaveProperty('pricePerNight', newProperty.pricePerNight);
      expect(res.body.data).toHaveProperty('hostId');
    });

    it('should not create a property without required fields', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should not create a property with invalid price', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Invalid Property',
          description: 'Invalid Description',
          pricePerNight: -100,
          location: 'Invalid Location'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should not create a property without authentication', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({
          title: 'Unauthorized Property',
          description: 'Unauthorized Description',
          pricePerNight: 100,
          location: 'Unauthorized Location'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('PUT /api/properties/:id', () => {
    it('should update a property', async () => {
      const updates = {
        title: 'Updated Property',
        pricePerNight: 150
      };

      const res = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('title', updates.title);
      expect(res.body.data).toHaveProperty('pricePerNight', 150);
    });

    it('should not update a non-existent property', async () => {
      const res = await request(app)
        .put('/api/properties/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Property' });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
    });

    it('should not update a property with invalid price', async () => {
      const res = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ pricePerNight: -100 });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should not update a property without authentication', async () => {
      const res = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .send({ title: 'Unauthorized Update' });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    it('should delete a property', async () => {
      const res = await request(app)
        .delete(`/api/properties/${testProperty.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 204]).toContain(res.statusCode);
      if (res.body && res.body.status) {
        expect(res.body.status).toBe('success');
        expect([
          'Property deleted successfully',
          'Property deleted'
        ]).toContain(res.body.message);
      }
      // Verify property is deleted
      const getRes = await request(app)
        .get(`/api/properties/${testProperty.id}`);
      expect([404, 400]).toContain(getRes.statusCode);
    });

    it('should not delete a non-existent property', async () => {
      const res = await request(app)
        .delete('/api/properties/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
    });

    it('should not delete a property without authentication', async () => {
      const res = await request(app)
        .delete(`/api/properties/${testProperty.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });
}); 