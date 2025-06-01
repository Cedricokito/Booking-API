# Booking API

A RESTful API for property booking built with Node.js, Express, and Prisma.

## Features

- User authentication with JWT
- Property management (CRUD operations)
- Booking system
- Review system
- Rate limiting
- Error handling
- Input validation
- Security best practices

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0.0
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/booking-api.git
cd booking-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration.

5. Set up the database:
```bash
npx prisma migrate dev
```

6. Seed the database (optional):
```bash
npx prisma db seed
```

## Development

Start the development server:
```bash
npm run dev
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate test coverage:
```bash
npm run test:coverage
```

## Linting and Formatting

Lint code:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run format
```

## API Documentation

### Authentication

#### Register
- **POST** `/api/auth/register`
- Body: `{ "name": "string", "email": "string", "password": "string" }`

#### Login
- **POST** `/api/auth/login`
- Body: `{ "email": "string", "password": "string" }`

#### Get Current User
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`

### Properties

#### List Properties
- **GET** `/api/properties`
- Query Parameters:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `search`
  - `minPrice`
  - `maxPrice`
  - `location`

#### Get Property
- **GET** `/api/properties/:id`

#### Create Property
- **POST** `/api/properties`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "title": "string", "description": "string", "price": number, "location": "string", "amenities": string[] }`

#### Update Property
- **PUT** `/api/properties/:id`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "title": "string", "description": "string", "price": number, "location": "string", "amenities": string[] }`

#### Delete Property
- **DELETE** `/api/properties/:id`
- Headers: `Authorization: Bearer <token>`

### Bookings

#### Create Booking
- **POST** `/api/bookings`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "propertyId": "string", "startDate": "string", "endDate": "string" }`

#### List User Bookings
- **GET** `/api/bookings`
- Headers: `Authorization: Bearer <token>`
- Query Parameters:
  - `status`

#### Get Booking
- **GET** `/api/bookings/:id`
- Headers: `Authorization: Bearer <token>`

#### Update Booking Status
- **PUT** `/api/bookings/:id/status`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "status": "string" }`

#### Cancel Booking
- **DELETE** `/api/bookings/:id`
- Headers: `Authorization: Bearer <token>`

### Reviews

#### Create Review
- **POST** `/api/reviews`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "propertyId": "string", "rating": number, "comment": "string" }`

#### List Property Reviews
- **GET** `/api/reviews/property/:propertyId`
- Query Parameters:
  - `page` (default: 1)
  - `limit` (default: 10)

#### Update Review
- **PUT** `/api/reviews/:id`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "rating": number, "comment": "string" }`

#### Delete Review
- **DELETE** `/api/reviews/:id`
- Headers: `Authorization: Bearer <token>`

## Error Handling

The API uses a consistent error response format:

```json
{
  "status": "error",
  "message": "Error message"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS enabled
- Helmet security headers
- Input validation
- SQL injection prevention with Prisma

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 