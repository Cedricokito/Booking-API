# Booking API

A robust REST API for managing property bookings, built with Node.js.

## Features

- User authentication with JWT
- Role-based access control (USER/ADMIN)
- Property management system
- Booking system with date validation and overlap checking
- Review and rating system
- Input validation and error handling
- TypeScript-style documentation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd booking-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Properties
- GET /api/properties - Get all properties
- POST /api/properties - Create a new property (requires authentication)
- GET /api/properties/:id - Get property by ID
- PUT /api/properties/:id - Update property (requires authentication)
- DELETE /api/properties/:id - Delete property (requires authentication)

### Bookings
- POST /api/bookings - Create a new booking
- GET /api/bookings - Get user's bookings
- PUT /api/bookings/:id - Update booking status
- DELETE /api/bookings/:id - Cancel booking

## Error Handling

The API uses custom error classes for different types of errors:
- ValidationError (400)
- AuthenticationError (401)
- AuthorizationError (403)
- NotFoundError (404)
- ConflictError (409)

## Security

- JWT-based authentication
- Password hashing
- Input validation
- Resource ownership verification

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
