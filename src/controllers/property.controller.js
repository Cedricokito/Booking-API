const Property = require('../models/property.model');
const createProperty = require('../services/property/create.service');
const updateProperty = require('../services/property/update.service');
const { addReview, getReviews } = require('../services/property/review.service');
const { ValidationError, AuthorizationError, NotFoundError } = require('../utils/errors');

// Create new property
exports.createProperty = async (req, res, next) => {
  try {
    const property = await createProperty(req.body, req.user.userId);
    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
};

// Get all properties with filters
exports.getProperties = async (req, res, next) => {
  try {
    const {
      minPrice,
      maxPrice,
      location,
      startDate,
      endDate,
      amenities,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Apply filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (location) {
      query.location = new RegExp(location, 'i');
    }

    if (amenities) {
      query.amenities = { $all: amenities.split(',') };
    }

    // Handle date availability
    if (startDate && endDate) {
      query.status = 'AVAILABLE';
      query['availability.startDate'] = { $lte: new Date(startDate) };
      query['availability.endDate'] = { $gte: new Date(endDate) };
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('owner', 'name email'),
      Property.countDocuments(query)
    ]);

    res.json({
      properties,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get property by ID
exports.getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('reviews.user', 'name');

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    res.json(property);
  } catch (error) {
    next(error);
  }
};

// Update property
exports.updateProperty = async (req, res, next) => {
  try {
    const property = await updateProperty(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );
    res.json(property);
  } catch (error) {
    next(error);
  }
};

// Delete property
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Check ownership
    if (property.owner.toString() !== req.user.userId && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('Not authorized to delete this property');
    }

    property.status = 'DELETED';
    await property.save();

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add review to property
exports.addReview = async (req, res, next) => {
  try {
    const property = await addReview(
      req.params.id,
      req.body,
      req.user.userId
    );
    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
};

// Get property reviews
exports.getPropertyReviews = async (req, res, next) => {
  try {
    const reviews = await getReviews(req.params.id);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
}; 