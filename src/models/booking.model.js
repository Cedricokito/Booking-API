const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'REFUNDED'],
    default: 'PENDING'
  },
  specialRequests: {
    type: String,
    trim: true
  },
  guestCount: {
    type: Number,
    required: true,
    min: 1
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  checkInTime: {
    type: String,
    default: '15:00'
  },
  checkOutTime: {
    type: String,
    default: '11:00'
  }
}, {
  timestamps: true
});

// Calculate total price based on duration and property price
bookingSchema.methods.calculateTotalPrice = async function() {
  await this.populate('property');
  const duration = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  this.totalPrice = this.property.price * duration;
};

// Check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  if (this.status === 'CANCELLED' || this.status === 'COMPLETED') {
    return false;
  }
  
  const now = new Date();
  const startDate = new Date(this.startDate);
  const daysDifference = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
  
  return daysDifference >= 2; // Can cancel if at least 2 days before check-in
};

// Cancel booking
bookingSchema.methods.cancel = function(reason) {
  if (!this.canBeCancelled()) {
    throw new Error('Booking cannot be cancelled');
  }
  
  this.status = 'CANCELLED';
  this.cancellationReason = reason;
  if (this.paymentStatus === 'PAID') {
    this.paymentStatus = 'REFUNDED';
  }
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 