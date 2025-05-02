const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Property Booking API',
      version: '1.0.0',
      description: 'API for managing property bookings and reviews',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'API Support',
        url: 'https://your-support-url.com',
        email: 'support@your-domain.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.your-domain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Property: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              example: 'Luxury Beach Villa',
            },
            description: {
              type: 'string',
              example: 'Beautiful villa with ocean view',
            },
            price: {
              type: 'number',
              example: 200,
            },
            location: {
              type: 'string',
              example: 'Miami Beach, FL',
            },
            owner: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            property: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            user: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
            },
            totalPrice: {
              type: 'number',
              example: 600,
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'cancelled', 'completed'],
              example: 'pending',
            },
          },
        },
        Review: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            property: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            user: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              example: 5,
            },
            comment: {
              type: 'string',
              example: 'Great property and excellent service!',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 