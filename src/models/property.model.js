const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true,
    minlength: [3, 'Property name must be at least 3 characters long']
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long']
  },
  location: {
    type: String,
    required: [true, 'Property location is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Property price is required'],
    min: [0, 'Price cannot be negative']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    caption: String
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Review rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [5, 'Review comment must be at least 5 characters long']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  availability: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(endDate) {
          return endDate > this.startDate;
        },
        message: 'End date must be after start date'
      }
    }
  }],
  status: {
    type: String,
    enum: {
      values: ['AVAILABLE', 'MAINTENANCE', 'DELETED'],
      message: '{VALUE} is not a valid status'
    },
    default: 'AVAILABLE'
  }
}, {
  timestamps: true
});

// Calculate average rating when a review is added
propertySchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    return;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating = Math.round((sum / this.reviews.length) * 10) / 10;
};

// Check if property is available for given dates
propertySchema.methods.isAvailable = function(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if dates are valid
  if (start >= end) {
    return false;
  }

  // Check if dates are in the past
  if (start < new Date()) {
    return false;
  }

  // Check against existing bookings
  return !this.availability.some(period => {
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    return (start < periodEnd && end > periodStart);
  });
};

// Add indexes for better query performance
propertySchema.index({ location: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ 'availability.startDate': 1, 'availability.endDate': 1 });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property; 