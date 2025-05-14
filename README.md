# Booking API

Een RESTful API voor het boeken van vakantiehuizen en appartementen.

## Technologieën

- Node.js
- Express
- Prisma (ORM)
- MongoDB
- JWT voor authenticatie

## Installatie

1. Clone de repository:
```bash
git clone [repository-url]
cd Booking-API
```

2. Installeer dependencies:
```bash
npm install
```

3. Maak een `.env` bestand aan in de root van het project met de volgende variabelen:
```
DATABASE_URL="mongodb+srv://[username]:[password]@[cluster-url]/[database-name]"
JWT_SECRET="your-super-secret-jwt-key"
```

4. Genereer de Prisma client:
```bash
npx prisma generate
```

5. Voer de database migraties uit:
```bash
npx prisma migrate dev
```

6. Seed de database met testdata:
```bash
npx prisma db seed
```

## Starten van de applicatie

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authenticatie
- POST `/api/auth/register` - Registreer een nieuwe gebruiker
- POST `/api/auth/login` - Login met bestaande gebruiker
- GET `/api/auth/me` - Haal huidige gebruiker op

### Properties
- GET `/api/properties` - Haal alle properties op
- GET `/api/properties/:id` - Haal specifieke property op
- POST `/api/properties` - Maak nieuwe property aan
- PUT `/api/properties/:id` - Update property
- DELETE `/api/properties/:id` - Verwijder property

### Bookings
- GET `/api/bookings` - Haal alle boekingen op
- POST `/api/bookings` - Maak nieuwe boeking aan
- PUT `/api/bookings/:id/status` - Update boeking status

### Reviews
- GET `/api/properties/:id/reviews` - Haal reviews van property op
- POST `/api/reviews` - Maak nieuwe review aan
- PUT `/api/reviews/:id` - Update review

## Testen

Run de tests:
```bash
npm test
```

## Database beheren

Open Prisma Studio om de database te bekijken en te beheren:
```bash
npx prisma studio
```

## Test Gebruikers

Na het seeden van de database zijn de volgende test gebruikers beschikbaar:

1. Test User
   - Email: test@example.com
   - Password: password123

2. Property Owner
   - Email: owner@example.com
   - Password: password123 