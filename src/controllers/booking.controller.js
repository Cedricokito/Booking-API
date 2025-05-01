const Booking = require('../models/booking.model');
const Property = require('../models/property.model');
const { ValidationError, AuthorizationError, NotFoundError } = require('../utils/errors');

// Create new booking
exports.createBooking = async (req, res, next) => {
  try {
    const { propertyId, startDate, endDate, guestCount, specialRequests } = req.body;

    if (!propertyId || !startDate || !endDate || !guestCount) {
      throw new ValidationError('Missing required booking information');
    }

    if (new Date(startDate) >= new Date(endDate)) {
      throw new ValidationError('End date must be after start date');
    }

    // Find property
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Check if property is available
    if (property.status !== 'AVAILABLE') {
      throw new ValidationError('Property is not available for booking');
    }

    if (!property.isAvailable(startDate, endDate)) {
      throw new ValidationError('Property is not available for these dates');
    }

    // Create booking
    const booking = new Booking({
      property: propertyId,
      user: req.user.userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      guestCount,
      specialRequests
    });

    // Calculate total price
    await booking.calculateTotalPrice();

    // Save booking
    await booking.save();

    // Update property availability
    property.availability.push({
      startDate: booking.startDate,
      endDate: booking.endDate
    });
    await property.save();

    // Populate booking with property and user details
    await booking.populate([
      { path: 'property', select: 'name location price' },
      { path: 'user', select: 'name email' }
    ]);

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res, next) => {
  try {
    const {
      status,
      sort = 'startDate',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = { user: req.user.userId };
    if (status) {
      query.status = status.toUpperCase();
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('property', 'name location price')
        .populate('user', 'name email'),
      Booking.countDocuments(query)
    ]);

    res.json({
      bookings,
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

// Get booking by ID
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property', 'name location price')
      .populate('user', 'name email');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check if user is authorized to view this booking
    if (booking.user._id.toString() !== req.user.userId && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('Not authorized to view this booking');
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    
    if (!status) {
      throw new ValidationError('Status is required');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Validate status transition
    const validTransitions = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['COMPLETED', 'CANCELLED'],
      'CANCELLED': [],
      'COMPLETED': []
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new ValidationError(`Cannot transition from ${booking.status} to ${status}`);
    }

    // Only admin can update status to CONFIRMED
    if (status === 'CONFIRMED' && req.user.role !== 'ADMIN') {
      throw new AuthorizationError('Not authorized to confirm bookings');
    }

    // Only booking user or admin can cancel
    if (status === 'CANCELLED') {
      if (booking.user.toString() !== req.user.userId && req.user.role !== 'ADMIN') {
        throw new AuthorizationError('Not authorized to cancel this booking');
      }
      if (!cancellationReason) {
        throw new ValidationError('Cancellation reason is required');
      }
      if (!booking.canBeCancelled()) {
        throw new ValidationError('Booking cannot be cancelled at this time');
      }
      booking.cancel(cancellationReason);
    } else {
      booking.status = status;
    }

    await booking.save();
    
    await booking.populate([
      { path: 'property', select: 'name location price' },
      { path: 'user', select: 'name email' }
    ]);
    
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    
    // Only admin can update payment status
    if (req.user.role !== 'ADMIN') {
      throw new AuthorizationError('Not authorized to update payment status');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    booking.paymentStatus = paymentStatus;
    if (paymentStatus === 'PAID' && booking.status === 'PENDING') {
      booking.status = 'CONFIRMED';
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    next(error);
  }
}; 