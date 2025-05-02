const Property = require('../../models/property.model');
const { ValidationError } = require('../../utils/errors');

/**
 * Validate property data
 * @param {Object} data - The property data to validate
 * @throws {ValidationError} If validation fails
 */
function validatePropertyData(data) {
  const requiredFields = ['name', 'description', 'price', 'location'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }

  if (data.price && data.price < 0) {
    throw new ValidationError('Price cannot be negative');
  }

  if (data.images) {
    if (!Array.isArray(data.images)) {
      throw new ValidationError('Images must be an array');
    }
    
    data.images.forEach(image => {
      if (!image.url) {
        throw new ValidationError('Each image must have a URL');
      }
    });
  }

  if (data.amenities && !Array.isArray(data.amenities)) {
    throw new ValidationError('Amenities must be an array');
  }
}

/**
 * Create a new property
 * @param {Object} propertyData - The property data
 * @param {string} userId - The ID of the user creating the property
 * @returns {Promise<Object>} The created property
 */
async function createProperty(propertyData, userId) {
  try {
    // Validate input data
    validatePropertyData(propertyData);

    // Prepare property data
    const property = new Property({
      ...propertyData,
      owner: userId,
      rating: 0,
      reviews: [],
      status: 'AVAILABLE',
      availability: []
    });

    // Save property
    await property.save();

    // Populate owner details
    await property.populate('owner', 'name email');
    
    return property;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError(error.message);
    }
    throw error;
  }
}

module.exports = createProperty; 