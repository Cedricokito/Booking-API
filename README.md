# Booking API

Een RESTful API voor een property booking systeem, gebouwd met Node.js, Express, en MongoDB (via Prisma ORM).

## Quick Start

### 1. Repository Clonen
```bash
git clone https://github.com/Cedricokito/Booking-API.git
cd Booking-API
```

### 2. Dependencies Installeren
```bash
npm install
```

### 3. Start de API
```bash
# Maak het start script uitvoerbaar
chmod +x start.sh

# Start de API (dit doet alles automatisch)
./start.sh
```

De start.sh script zal:
1. Eventuele processen op poort 3000 stoppen
2. Het .env bestand aanmaken
3. De database setup en seeden
4. De server starten

## Test Accounts
Na het starten zijn deze accounts beschikbaar:
- **Test User**: test@example.com / password123
- **Property Owner**: owner@example.com / password123

## API Endpoints

### Authentication
```
POST /api/auth/register - Gebruiker registreren
POST /api/auth/login - Gebruiker inloggen
GET /api/auth/me - Huidige gebruiker ophalen
```

### Properties
```
GET /api/properties - Alle properties ophalen
GET /api/properties/:id - Property details ophalen
POST /api/properties - Property aanmaken (OWNER only)
```

### Bookings
```
GET /api/bookings - Bookings ophalen
POST /api/bookings - Booking aanmaken
PATCH /api/bookings/:id - Booking status updaten
```

### Reviews
```
POST /api/reviews - Review aanmaken
GET /api/properties/:propertyId/reviews - Reviews ophalen
```

## Testing
Run de tests met:
```bash
npm test
```

## Technische Stack
- **Backend**: Node.js & Express
- **Database**: MongoDB
- **ORM**: Prisma
- **Authentication**: JWT
- **Testing**: Jest & Supertest
- **Development**: Nodemon

## Contact
Voor vragen of ondersteuning, neem contact op via GitHub: [Cedricokito](https://github.com/Cedricokito) 