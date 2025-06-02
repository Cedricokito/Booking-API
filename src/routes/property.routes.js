const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

// Public routes
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      location
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }
    if (minPrice) where.price = { gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
    if (location) where.location = { contains: location };

    // Get properties with pagination
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        }
      }),
      prisma.property.count({ where })
    ]);

    // Calculate average rating for each property
    const propertiesWithRating = properties.map(property => {
      const avgRating = property.reviews.length > 0
        ? property.reviews.reduce((acc, review) => acc + review.rating, 0) / property.reviews.length
        : 0;
      
      return {
        ...property,
        averageRating: avgRating,
        reviewCount: property.reviews.length
      };
    });

    res.json({
      status: 'success',
      data: {
        properties: propertiesWithRating,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Calculate average rating
    const averageRating = property.reviews.length > 0
      ? property.reviews.reduce((acc, review) => acc + review.rating, 0) / property.reviews.length
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        ...property,
        averageRating,
        reviewCount: property.reviews.length
      }
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    const reviews = await prisma.review.findMany({
      where: { propertyId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Protected routes
router.use(protect);

router.post('/', async (req, res) => {
  try {
    const { title, description, price, location, amenities } = req.body;
    
    if (!title || !description || !price || !location) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Price must be greater than 0'
      });
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        location,
        amenities: JSON.stringify(amenities || []),
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: property
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id }
    });

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    if (property.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this property'
      });
    }

    const { title, description, price, location, amenities } = req.body;
    
    if (price && price <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Price must be greater than 0'
      });
    }

    const updatedProperty = await prisma.property.update({
      where: { id: req.params.id },
      data: {
        title: title || property.title,
        description: description || property.description,
        price: price ? parseFloat(price) : property.price,
        location: location || property.location,
        amenities: amenities ? JSON.stringify(amenities) : property.amenities
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id }
    });

    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    if (property.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this property'
      });
    }

    // Check if property has any active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        propertyId: req.params.id,
        status: 'CONFIRMED',
        endDate: { gt: new Date() }
      }
    });

    if (activeBookings) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete property with active bookings'
      });
    }

    await prisma.property.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 