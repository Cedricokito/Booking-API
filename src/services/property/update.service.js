const Property = require('../../models/property.model');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../utils/errors');

/**
 * Update a property
 * @param {string} propertyId - The ID of the property to update
 * @param {Object} updateData - The data to update
 * @param {string} userId - The ID of the user making the update
 * @param {string} userRole - The role of the user making the update
 * @returns {Promise<Object>} The updated property
 */
async function updateProperty(propertyId, updateData, userId, userRole) {
  const property = await Property.findById(propertyId);
  
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // Check authorization
  if (property.owner.toString() !== userId && userRole !== 'ADMIN') {
    throw new AuthorizationError('Not authorized to update this property');
  }

  try {
    Object.assign(property, updateData);
    await property.save();
    return property;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new ValidationError(error.message);
    }
    throw error;
  }
}

module.exports = updateProperty; 