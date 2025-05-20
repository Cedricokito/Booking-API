# Booking API - Test Instructies voor Docenten

Een RESTful API voor het boeken van vakantiehuizen, gemaakt met Node.js, Express, Prisma en MongoDB.

## Test Database Setup

Deze repository gebruikt een speciaal test account voor MongoDB Atlas:
- Username: `BookingAPI2024`
- Password: `BookingAPI2024`
- Database: `bookingdb`

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

3. Maak een `.env` bestand aan in de root van het project met:
```
DATABASE_URL="mongodb+srv://BookingAPI2024:BookingAPI2024@cluster0.ppp2iuk.mongodb.net/bookingdb?retryWrites=true&w=majority&appName=Cluster0"
JWT_SECRET="booking-api-super-secret-key"
PORT=3000
```

4. Genereer de Prisma client:
```bash
npx prisma generate
```

5. Push het schema naar de database:
```bash
npx prisma db push
```

6. Seed de database:
```bash
npx prisma db seed
```

7. Start de server:
```bash
npm run dev
```

Je zou deze output moeten zien:
```
Server is running on http://localhost:3000
```

## API Endpoints

### Authenticatie
- `POST /api/auth/login` - Login gebruiker
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```

### Properties
- `GET /api/properties` - Haal alle properties op
- `GET /api/properties/:id` - Haal een specifieke property op
- `POST /api/properties` - Maak een nieuwe property aan
- `PUT /api/properties/:id` - Update een property
- `DELETE /api/properties/:id` - Verwijder een property

### Bookings
- `GET /api/bookings` - Haal alle bookings op
- `GET /api/bookings/:id` - Haal een specifieke booking op
- `POST /api/bookings` - Maak een nieuwe booking aan
- `PUT /api/bookings/:id` - Update een booking
- `DELETE /api/bookings/:id` - Verwijder een booking

### Reviews
- `GET /api/reviews` - Haal alle reviews op
- `GET /api/reviews/:id` - Haal een specifieke review op
- `POST /api/reviews` - Maak een nieuwe review aan
- `PUT /api/reviews/:id` - Update een review
- `DELETE /api/reviews/:id` - Verwijder een review

## Test Accounts

Na het seeden van de database zijn deze accounts beschikbaar:

1. Test User:
   - Email: test@example.com
   - Password: password123
   - Role: USER

2. Property Owner:
   - Email: owner@example.com
   - Password: password123
   - Role: OWNER

## API Testen

### 1. Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email": "test@example.com", "password": "password123"}'
```

### 2. Properties Bekijken
```bash
curl http://localhost:3000/api/properties
```

### 3. Bookings Bekijken (vervang <JWT_TOKEN> met de token van de login)
```bash
curl http://localhost:3000/api/bookings -H "Authorization: Bearer <JWT_TOKEN>"
```

## Troubleshooting

### Poort 3000 in gebruik
Voor macOS/Linux:
```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

Voor Windows:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connectie Problemen
1. Controleer of de DATABASE_URL correct is in het .env bestand
2. Controleer of MongoDB Atlas bereikbaar is
3. Controleer of je IP adres is toegestaan in MongoDB Atlas Network Access

## Contact
Voor vragen of problemen:
- GitHub: [Cedricokito](https://github.com/Cedricokito) 