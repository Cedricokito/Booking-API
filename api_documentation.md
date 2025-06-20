# Booking API Documentation

This document provides a summary of all the available endpoints in the Booking API.

## Authentication

### `POST /auth/register`

Registers a new user.

**Request Body:**

```json
{
  "username": "testuser",
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### `POST /auth/login`

Logs in a user.

**Request Body:**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### `GET /auth/me`

Retrieves the currently logged-in user's information. Requires authentication.

---

## Users

All user routes require authentication.

### `GET /users/:id`

Retrieves user information by ID.

### `PUT /users/:id`

Updates user information (name, email).

**Request Body:**

```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

### `PUT /users/:id/password`

Updates the user's password.

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

### `DELETE /users/:id`

Deletes a user.

### `POST /users`

Creates a new user.

**Request Body:**

```json
{
    "username": "janedoe",
    "password": "password123",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phonenumber": "1234567890",
    "pictureURL": "http://example.com/profile.jpg"
}
```

---

## Properties

### `GET /properties`

Retrieves a list of properties with pagination and filtering.

**Query Parameters:**

*   `page`: Page number (default: 1)
*   `limit`: Number of items per page (default: 10)
*   `search`: Search term for title and description
*   `minPrice`: Minimum price per night
*   `maxPrice`: Maximum price per night
*   `location`: Filter by location

### `GET /properties/:id`

Retrieves a single property by its ID.

### `GET /properties/:id/reviews`

Retrieves all reviews for a specific property.

### `POST /properties`

Creates a new property. Requires authentication.

**Request Body:**

```json
{
  "title": "Beautiful Villa",
  "description": "A beautiful villa with a sea view.",
  "pricePerNight": 250.50,
  "location": "Miami, FL",
  "amenities": ["Pool", "WiFi"]
}
```

### `PUT /properties/:id`

Updates a property. Requires authentication.

### `DELETE /properties/:id`

Deletes a property. Requires authentication.

---

## Bookings

All booking routes require authentication.

### `POST /bookings`

Creates a new booking.

**Request Body:**

```json
{
  "propertyId": "property-uuid",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-05T00:00:00.000Z"
}
```

### `GET /bookings`

Retrieves all bookings for the current user.

**Query Parameters:**

*   `status`: Filter by booking status (e.g., `PENDING`, `CONFIRMED`)

### `GET /bookings/:id`

Retrieves a specific booking by its ID.

### `PUT /bookings/:id/status`

Updates the status of a booking.

**Request Body:**

```json
{
  "status": "CONFIRMED"
}
```

### `DELETE /bookings/:id`

Deletes a booking.

---

## Reviews

### `GET /reviews`

Retrieves all reviews.

**Query Parameters:**

*   `propertyId`: Filter by property ID
*   `rating`: Filter by rating

### `GET /reviews/:id`

Retrieves a single review by its ID.

### `POST /reviews`

Creates a new review for a property. Requires authentication.

**Request Body:**

```json
{
  "propertyId": "property-uuid",
  "bookingId": "booking-uuid",
  "rating": 5,
  "comment": "Amazing place!"
}
```

### `PUT /reviews/:id`

Updates a review. Requires authentication.

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Very good place!"
}
```

### `DELETE /reviews/:id`

Deletes a review. Requires authentication. 