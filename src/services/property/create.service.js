const Property = require('../../models/property.model');
const { ValidationError } = require('../../utils/errors');

/**
 * Create a new property
 * @param {Object} propertyData - The property data
 * @param {string} userId - The ID of the user creating the property
 * @returns {Promise<Object>} The created property
 */
async function createProperty(propertyData, userId) {
  try {
    const property = new Property({
      ...propertyData,
      owner: userId,
      rating: 0,
      reviews: []
    });

    await property.save();
    return property;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError(error.message);
    }
    throw error;
  }
}

module.exports = createProperty; 