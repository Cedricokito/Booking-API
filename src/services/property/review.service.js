const Property = require('../../models/property.model');
const Booking = require('../../models/booking.model');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../utils/errors');

/**
 * Validate review data
 * @param {Object} data - The review data to validate
 * @throws {ValidationError} If validation fails
 */
function validateReviewData(data) {
  if (!data.rating) {
    throw new ValidationError('Rating is required');
  }

  if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
    throw new ValidationError('Rating must be a number between 1 and 5');
  }

  if (!data.comment || data.comment.trim().length < 5) {
    throw new ValidationError('Review comment must be at least 5 characters long');
  }
}

/**
 * Check if user has completed a booking for the property
 * @param {string} propertyId - The property ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether the user has a completed booking
 */
async function hasCompletedBooking(propertyId, userId) {
  const booking = await Booking.findOne({
    property: propertyId,
    user: userId,
    status: 'COMPLETED'
  });
  return !!booking;
}

/**
 * Add a review to a property
 * @param {string} propertyId - The ID of the property
 * @param {Object} reviewData - The review data
 * @param {string} userId - The ID of the user creating the review
 * @returns {Promise<Object>} The updated property
 */
async function addReview(propertyId, reviewData, userId) {
  // Find property
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // Check if property is available for review
  if (property.status === 'DELETED') {
    throw new ValidationError('Cannot review a deleted property');
  }

  // Check if user has completed a booking
  const hasBooked = await hasCompletedBooking(propertyId, userId);
  if (!hasBooked) {
    throw new AuthorizationError('You can only review properties you have stayed at');
  }

  // Check if user has already reviewed
  const hasReviewed = property.reviews.some(review => 
    review.user.toString() === userId
  );

  if (hasReviewed) {
    throw new ValidationError('You have already reviewed this property');
  }

  try {
    // Validate review data
    validateReviewData(reviewData);

    // Add review
    property.reviews.push({
      user: userId,
      rating: reviewData.rating,
      comment: reviewData.comment.trim()
    });

    // Update property rating
    property.calculateAverageRating();
    await property.save();
    
    // Populate user details
    await property.populate('reviews.user', 'name');
    
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
    .populate('reviews.user', 'name')
    .select('reviews rating');
  
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  return {
    rating: property.rating,
    reviews: property.reviews
  };
}

module.exports = {
  addReview,
  getReviews
}; 