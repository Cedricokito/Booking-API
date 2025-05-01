const Property = require('../../models/property.model');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Add a review to a property
 * @param {string} propertyId - The ID of the property
 * @param {Object} reviewData - The review data
 * @param {string} userId - The ID of the user creating the review
 * @returns {Promise<Object>} The updated property
 */
async function addReview(propertyId, reviewData, userId) {
  const property = await Property.findById(propertyId);
  
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // Check if user has already reviewed
  const hasReviewed = property.reviews.some(review => 
    review.user.toString() === userId
  );

  if (hasReviewed) {
    throw new ValidationError('You have already reviewed this property');
  }

  try {
    property.reviews.push({
      user: userId,
      rating: reviewData.rating,
      comment: reviewData.comment
    });

    property.calculateAverageRating();
    await property.save();
    
    return property;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError(error.message);
    }
    throw error;
  }
}

/**
 * Get reviews for a property
 * @param {string} propertyId - The ID of the property
 * @returns {Promise<Array>} The property reviews
 */
async function getReviews(propertyId) {
  const property = await Property.findById(propertyId)
    .populate('reviews.user', 'name');
  
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  return property.reviews;
}

module.exports = {
  addReview,
  getReviews
}; 