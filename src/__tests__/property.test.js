const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../app');

const prisma = new PrismaClient();

describe('Property Routes', () => {
  let token;
  let testUser;
  let testProperty;

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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/properties', () => {
    it('should get all properties with pagination', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.properties).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toHaveProperty('total');
      expect(res.body.data.pagination).toHaveProperty('page', 1);
      expect(res.body.data.pagination).toHaveProperty('limit', 10);
    });

    it('should filter properties by search term', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ search: 'Test Property' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].title).toBe('Test Property');
    });

    it('should filter properties by price range', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ minPrice: 50, maxPrice: 150 });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].price).toBe(100);
    });

    it('should filter properties by location', async () => {
      const res = await request(app)
        .get('/api/properties')
        .query({ location: 'Test Location' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].location).toBe('Test Location');
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should get a property by id', async () => {
      const res = await request(app).get(`/api/properties/${testProperty.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testProperty.id);
      expect(res.body.data).toHaveProperty('title', 'Test Property');
      expect(res.body.data).toHaveProperty('description', 'Test Description');
      expect(res.body.data).toHaveProperty('price', 100);
      expect(res.body.data).toHaveProperty('location', 'Test Location');
      expect(res.body.data).toHaveProperty('amenities');
      expect(res.body.data).toHaveProperty('user');
    });

    it('should return 404 for non-existent property', async () => {
      const res = await request(app).get('/api/properties/123e4567-e89b-12d3-a456-426614174000');

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Property not found');
    });
  });

  describe('POST /api/properties', () => {
    it('should create a new property', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Property',
          description: 'New Description',
          price: 200,
          location: 'New Location',
          amenities: ['WiFi', 'Pool', 'Parking']
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title', 'New Property');
      expect(res.body.data).toHaveProperty('description', 'New Description');
      expect(res.body.data).toHaveProperty('price', 200);
      expect(res.body.data).toHaveProperty('location', 'New Location');
      expect(res.body.data).toHaveProperty('amenities');
      expect(res.body.data).toHaveProperty('user');
    });

    it('should not create a property without required fields', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Property'
          // Missing required fields
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('All fields are required');
    });

    it('should not create a property with invalid price', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Property',
          description: 'New Description',
          price: -100, // Invalid price
          location: 'New Location',
          amenities: ['WiFi']
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Price must be greater than 0');
    });

    it('should not create a property without authentication', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({
          title: 'New Property',
          description: 'New Description',
          price: 200,
          location: 'New Location',
          amenities: ['WiFi']
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('PUT /api/properties/:id', () => {
    it('should update a property', async () => {
      const res = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Property',
          description: 'Updated Description',
          price: 300,
          location: 'Updated Location',
          amenities: ['WiFi', 'Pool', 'Gym']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testProperty.id);
      expect(res.body.data).toHaveProperty('title', 'Updated Property');
      expect(res.body.data).toHaveProperty('description', 'Updated Description');
      expect(res.body.data).toHaveProperty('price', 300);
      expect(res.body.data).toHaveProperty('location', 'Updated Location');
      expect(res.body.data).toHaveProperty('amenities');
    });

    it('should not update a non-existent property', async () => {
      const res = await request(app)
        .put('/api/properties/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Property'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Property not found');
    });

    it('should not update a property with invalid price', async () => {
      const res = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          price: -100 // Invalid price
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Price must be greater than 0');
    });

    it('should not update a property without authentication', async () => {
      const res = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .send({
          title: 'Updated Property'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    it('should delete a property', async () => {
      const res = await request(app)
        .delete(`/api/properties/${testProperty.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(204);

      // Verify property is deleted
      const deletedProperty = await prisma.property.findUnique({
        where: { id: testProperty.id }
      });
      expect(deletedProperty).toBeNull();
    });

    it('should not delete a non-existent property', async () => {
      const res = await request(app)
        .delete('/api/properties/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Property not found');
    });

    it('should not delete a property without authentication', async () => {
      const res = await request(app)
        .delete(`/api/properties/${testProperty.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('No token provided');
    });
  });
}); 