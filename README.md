# Property Booking API

A robust REST API for managing property bookings, built with Node.js, Express, and MongoDB.

## Features

- 🏠 Property management
- 📅 Booking system
- ⭐ Review system
- 🔐 Authentication & Authorization
- 📊 Rate limiting
- 💾 Caching
- 📚 API Documentation

## Technical Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Swagger/OpenAPI Documentation
- Jest for Testing

## Performance Features

- Memory caching for frequently accessed routes
- Rate limiting with MongoDB store
- Database connection pooling
- Proper error handling
- Request validation

## Security Features

- JWT authentication
- Rate limiting
- Helmet security headers
- CORS configuration
- Input validation
- Error sanitization

## Getting Started

### Prerequisites

- Node.js >= 14
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/booking-api.git
cd booking-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment files:
```bash
# .env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/booking-api
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h
RATE_LIMIT=100
CORS_ORIGIN=*

# .env.test
NODE_ENV=test
PORT=3001
MONGODB_TEST_URI=mongodb://localhost:27017/booking-api-test
JWT_SECRET=test-jwt-secret
JWT_EXPIRES_IN=1h
```

### Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## API Documentation

The API documentation is available at `/api-docs` when running the server. It provides:
- Detailed endpoint descriptions
- Request/response examples
- Authentication information
- Schema definitions

## Main Endpoints

### Properties
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create a property
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Bookings
- `POST /api/bookings` - Create a booking
- `GET /api/bookings` - Get user's bookings
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Reviews
- `POST /api/reviews` - Create a review
- `GET /api/properties/:id/reviews` - Get property reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

## Error Handling

The API uses a centralized error handling mechanism with proper error codes and messages:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests
- 500: Internal Server Error

## Caching Strategy

The API implements intelligent caching:
- Property listings: 5 minutes
- Property reviews: 1 minute
- User-specific data: No cache
- Cache invalidation on updates

## Rate Limiting

Different limits for different operations:
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per hour
- Property operations: 50 per hour
- Booking operations: 30 per hour
- Reviews: 10 per day

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 