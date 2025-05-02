const request = require('supertest');
const app = require('../../src/app');
const {
  createTestUser,
  generateTestToken,
  createTestProperty,
  createTestBooking,
  generateTestData
} = require('../helpers');

describe('Review API Integration Tests', () => {
  let testUser;
  let testProperty;
  let testBooking;
  let authToken;
  let propertyOwner;

  beforeEach(async () => {
    // Create property owner and property
    propertyOwner = await createTestUser({ email: generateTestData('email') });
    testProperty = await createTestProperty({}, propertyOwner);

    // Create test user and booking
    testUser = await createTestUser({ email: generateTestData('email') });
    authToken = generateTestToken(testUser);
    testBooking = await createTestBooking(
      { status: 'completed' },
      testUser,
      testProperty
    );
  });

  describe('POST /api/reviews', () => {
    it('should create a review when user has completed booking', async () => {
      const reviewData = {
        propertyId: testProperty._id,
        rating: 5,
        comment: 'Excellent property, great experience!'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.property.toString()).toBe(testProperty._id.toString());
      expect(response.body.user.toString()).toBe(testUser._id.toString());
      expect(response.body.rating).toBe(5);
    });

    it('should not allow review without completed booking', async () => {
      // Create new user without booking
      const newUser = await createTestUser({ email: generateTestData('email') });
      const newUserToken = generateTestToken(newUser);

      const reviewData = {
        propertyId: testProperty._id,
        rating: 5,
        comment: 'Great property!'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(reviewData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate rating range', async () => {
      const reviewData = {
        propertyId: testProperty._id,
        rating: 6, // Invalid rating > 5
        comment: 'Invalid rating test'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should not allow multiple reviews for same property by same user', async () => {
      // Create first review
      const reviewData = {
        propertyId: testProperty._id,
        rating: 5,
        comment: 'First review'
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      // Try to create second review
      const secondReview = {
        propertyId: testProperty._id,
        rating: 4,
        comment: 'Second review attempt'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondReview);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/properties/:id/reviews', () => {
    beforeEach(async () => {
      // Create multiple reviews from different users
      const users = await Promise.all([
        createTestUser({ email: generateTestData('email') }),
        createTestUser({ email: generateTestData('email') }),
        createTestUser({ email: generateTestData('email') })
      ]);

      // Create completed bookings for each user
      const bookings = await Promise.all(
        users.map(user => 
          createTestBooking({ status: 'completed' }, user, testProperty)
        )
      );

      // Create reviews
      await Promise.all(
        users.map((user, index) => {
          const token = generateTestToken(user);
          return request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({
              propertyId: testProperty._id,
              rating: 4 + (index % 2),
              comment: `Review ${index + 1}`
            });
        })
      );
    });

    it('should return all reviews for a property', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/reviews`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
      response.body.forEach(review => {
        expect(review.property.toString()).toBe(testProperty._id.toString());
        expect(review).toHaveProperty('rating');
        expect(review).toHaveProperty('comment');
        expect(review).toHaveProperty('user');
      });
    });

    it('should return reviews with pagination', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/reviews`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.reviews.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('currentPage');
    });

    it('should return average rating for property', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/reviews/summary`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body.averageRating).toBeGreaterThanOrEqual(1);
      expect(response.body.averageRating).toBeLessThanOrEqual(5);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    let testReview;

    beforeEach(async () => {
      // Create a review
      const reviewResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty._id,
          rating: 4,
          comment: 'Initial review'
        });

      testReview = reviewResponse.body;
    });

    it('should update review when user is the author', async () => {
      const updateData = {
        rating: 5,
        comment: 'Updated review comment'
      };

      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(5);
      expect(response.body.comment).toBe('Updated review comment');
    });

    it('should not allow update by non-author', async () => {
      const otherUser = await createTestUser({ email: generateTestData('email') });
      const otherUserToken = generateTestToken(otherUser);

      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ rating: 1, comment: 'Attempted update' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    let testReview;

    beforeEach(async () => {
      // Create a review
      const reviewResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty._id,
          rating: 4,
          comment: 'Review to be deleted'
        });

      testReview = reviewResponse.body;
    });

    it('should delete review when user is the author', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify review is deleted
      const getResponse = await request(app)
        .get(`/api/properties/${testProperty._id}/reviews`);
      
      const deletedReview = getResponse.body.find(
        review => review._id === testReview._id
      );
      expect(deletedReview).toBeUndefined();
    });

    it('should not allow deletion by non-author', async () => {
      const otherUser = await createTestUser({ email: generateTestData('email') });
      const otherUserToken = generateTestToken(otherUser);

      const response = await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });
}); 