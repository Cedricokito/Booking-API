# Booking API

Een RESTful API voor een boekingssysteem, gebouwd met Node.js, Express, Prisma en MongoDB.

## Vereisten

- Node.js (v14 of hoger)
- MongoDB (lokaal of MongoDB Atlas)
- npm of yarn

## Installatie

1. Clone de repository:
```bash
git clone https://github.com/Cedricokito/Booking-API.git
cd Booking-API
```

2. Installeer dependencies:
```bash
npm install
```

3. Maak een `.env` bestand aan in de root van het project met de volgende inhoud:
```env
# Database
DATABASE_URL="mongodb://localhost:27017/booking-api"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Email (optioneel)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"

# API Keys (optioneel)
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
```

## Database Setup

1. Zorg ervoor dat MongoDB draait op je systeem of gebruik MongoDB Atlas

2. Synchroniseer de database met Prisma:
```bash
npx prisma db push
```

3. Seed de database met testdata:
```bash
npm run seed
```

## Development Server Starten

Start de development server:
```bash
npm run dev
```

De server draait nu op http://localhost:3000

## Prisma Studio

Om de database te bekijken en te beheren via een GUI:
```bash
npx prisma studio
```
Prisma Studio is beschikbaar op http://localhost:5555

## API Endpoints

### Gebruikers
- `POST /api/users/register` - Registreer een nieuwe gebruiker
- `POST /api/users/login` - Login voor bestaande gebruikers
- `GET /api/users/me` - Haal huidige gebruiker op
- `PUT /api/users/me` - Update huidige gebruiker

### Properties
- `GET /api/properties` - Haal alle properties op
- `POST /api/properties` - Maak een nieuwe property aan
- `GET /api/properties/:id` - Haal een specifieke property op
- `PUT /api/properties/:id` - Update een property
- `DELETE /api/properties/:id` - Verwijder een property

### Bookings
- `GET /api/bookings` - Haal alle bookings op
- `POST /api/bookings` - Maak een nieuwe booking aan
- `GET /api/bookings/:id` - Haal een specifieke booking op
- `PUT /api/bookings/:id` - Update een booking
- `DELETE /api/bookings/:id` - Verwijder een booking

### Reviews
- `GET /api/reviews` - Haal alle reviews op
- `POST /api/reviews` - Maak een nieuwe review aan
- `GET /api/reviews/:id` - Haal een specifieke review op
- `PUT /api/reviews/:id` - Update een review
- `DELETE /api/reviews/:id` - Verwijder een review

## Testing

Run de tests:
```bash
npm test
```

## Contributing

1. Fork de repository
2. Maak een nieuwe branch (`git checkout -b feature/amazing-feature`)
3. Commit je wijzigingen (`git commit -m 'Add some amazing feature'`)
4. Push naar de branch (`git push origin feature/amazing-feature`)
5. Open een Pull Request

## License

Dit project is gelicenseerd onder de MIT License. 