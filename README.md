# Property Booking API

A robust REST API for managing property bookings, built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Property management (CRUD operations)
- Booking system
- Review system
- Role-based access control
- Input validation
- Error handling
- Test coverage

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

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

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/booking-api
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT=100
NODE_ENV=development
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Run tests:
```bash
npm test
```

## API Documentation

### Authentication

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile (authenticated)
- PUT `/api/auth/profile` - Update user profile (authenticated)

### Properties

- GET `/api/properties` - List all properties (public)
- GET `/api/properties/:id` - Get property details (public)
- POST `/api/properties` - Create new property (authenticated)
- PUT `/api/properties/:id` - Update property (authenticated, owner only)
- DELETE `/api/properties/:id` - Delete property (authenticated, owner only)
- GET `/api/properties/:id/reviews` - Get property reviews (public)
- POST `/api/properties/:id/reviews` - Add property review (authenticated)

### Bookings

- POST `/api/bookings` - Create new booking (authenticated)
- GET `/api/bookings` - List user's bookings (authenticated)
- GET `/api/bookings/:id` - Get booking details (authenticated)
- PUT `/api/bookings/:id/status` - Update booking status (authenticated)

## Error Handling

The API uses custom error classes for different types of errors:
- ValidationError (400)
- AuthenticationError (401)
- AuthorizationError (403)
- NotFoundError (404)

## Testing

The project uses Jest for testing. Tests are located in the `tests` directory.

To run tests:
```bash
npm test
```

To run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
booking-api/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── tests/
│   ├── integration/
│   └── utils/
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 