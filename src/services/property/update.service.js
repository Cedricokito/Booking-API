const Property = require('../../models/property.model');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../utils/errors');

/**
 * Validate update data
 * @param {Object} data - The update data to validate
 * @throws {ValidationError} If validation fails
 */
function validateUpdateData(data) {
  if (data.price !== undefined && data.price < 0) {
    throw new ValidationError('Price cannot be negative');
  }

  if (data.images !== undefined) {
    if (!Array.isArray(data.images)) {
      throw new ValidationError('Images must be an array');
    }
    data.images.forEach(image => {
      if (!image.url) {
        throw new ValidationError('Each image must have a URL');
      }
    });
  }

  if (data.amenities !== undefined && !Array.isArray(data.amenities)) {
    throw new ValidationError('Amenities must be an array');
  }

  if (data.status && !['AVAILABLE', 'MAINTENANCE', 'DELETED'].includes(data.status)) {
    throw new ValidationError('Invalid status value');
  }
}

/**
 * Update a property
 * @param {string} propertyId - The ID of the property to update
 * @param {Object} updateData - The data to update
 * @param {string} userId - The ID of the user making the update
 * @param {string} userRole - The role of the user making the update
 * @returns {Promise<Object>} The updated property
 */
async function updateProperty(propertyId, updateData, userId, userRole) {
  // Find property and check existence
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // Check authorization
  if (property.owner.toString() !== userId && userRole !== 'ADMIN') {
    throw new AuthorizationError('Not authorized to update this property');
  }

  try {
    // Validate update data
    validateUpdateData(updateData);

    // Filter out undefined values
    const filteredData = Object.entries(updateData)
      .reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

    // Apply updates
    Object.assign(property, filteredData);

    // If status is being updated to DELETED, handle related bookings
    if (filteredData.status === 'DELETED') {
      property.availability = [];
    }

    // Save and populate
    await property.save();
    await property.populate('owner', 'name email');
    await property.populate('reviews.user', 'name');

    return property;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError(error.message);
    }
    throw error;
  }
}

module.exports = updateProperty; 