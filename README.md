# Booking API

A RESTful API for property booking built with Node.js, Express, and Prisma ORM.

## Features

- User authentication and authorization
- Property management (CRUD operations)
- Booking system
- Review system
- Input validation
- Error handling
- Rate limiting
- Security best practices

## Tech Stack

- Node.js
- Express.js
- Prisma ORM
- SQLite Database
- JWT for authentication
- Jest for testing

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- SQLite (included with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd booking-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Start the server:
```bash
npm start
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Database

This project uses SQLite as its database, which is:
- Lightweight and serverless
- Perfect for development and testing
- Zero configuration required
- File-based (data is stored in `prisma/dev.db`)

The database schema is defined in `prisma/schema.prisma` and includes:
- Users
- Properties
- Bookings
- Reviews

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Properties
- GET /api/properties - Get all properties
- GET /api/properties/:id - Get property by ID
- POST /api/properties - Create new property
- PUT /api/properties/:id - Update property
- DELETE /api/properties/:id - Delete property

### Bookings
- GET /api/bookings - Get all bookings
- GET /api/bookings/:id - Get booking by ID
- POST /api/bookings - Create new booking
- PUT /api/bookings/:id - Update booking
- DELETE /api/bookings/:id - Delete booking

### Reviews
- GET /api/properties/:id/reviews - Get property reviews
- POST /api/properties/:id/reviews - Create review
- PUT /api/reviews/:id - Update review
- DELETE /api/reviews/:id - Delete review

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Error Handling

The API uses a centralized error handling system that:
- Provides consistent error responses
- Includes appropriate HTTP status codes
- Returns user-friendly error messages
- Logs errors for debugging

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS enabled
- Helmet for security headers

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License. 