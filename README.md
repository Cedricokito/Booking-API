# Booking API

A RESTful API for managing property bookings and reviews.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd booking-api
```

2. Install dependencies:
```bash
npm install
```

3. Environment Setup:
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Update the `.env` file with your configuration:
     - Set your MongoDB connection string
     - Generate a secure JWT secret
     - Configure email settings if needed

4. Database Setup:
   - Make sure MongoDB is running
   - The database will be created automatically on first run

5. Run Database Migrations:
```bash
npx prisma migrate dev
```

6. Seed the Database (Optional):
```bash
npm run seed
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

## Testing

Run tests:
```bash
npm test
```

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/api-docs.json

## Environment Variables

The following environment variables are required:

### Required Variables
- `MONGODB_URI`: MongoDB connection string
- `DATABASE_URL`: Prisma database URL
- `PORT`: Server port number
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: JWT token expiration time

### Optional Variables
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP user email
- `SMTP_PASS`: SMTP password
- `API_URL`: Base URL for the API
- `API_VERSION`: API version
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `LOG_LEVEL`: Logging level

## Project Structure

```
booking-api/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── tests/              # Test files
├── prisma/             # Prisma schema and migrations
├── .env                # Environment variables
├── .env.example        # Example environment variables
└── package.json        # Project dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 