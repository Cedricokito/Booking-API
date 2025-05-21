# Booking API

Een RESTful API voor het boeken van vakantiehuizen, gemaakt met Node.js, Express en Prisma.

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

3. Start de server:
   ```bash
   npm run dev
   ```

## Database

De API gebruikt SQLite als database. Je hoeft geen extra database te installeren. De database wordt automatisch aangemaakt in de `prisma` map.

## Seeden van de database

Om de database te vullen met testdata, voer je het volgende commando uit:

```bash
npx prisma db seed
```

## Testaccounts

- **Test User:**  
  Email: `test@example.com`  
  Wachtwoord: `password123`

- **Property Owner:**  
  Email: `owner@example.com`  
  Wachtwoord: `password123`

## API testen

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email": "test@example.com", "password": "password123"}'
```

**Properties ophalen:**
```bash
curl http://localhost:3000/api/properties
```

**Bookings ophalen (vervang `<JWT_TOKEN>` door de token uit de login):**
```bash
curl http://localhost:3000/api/bookings -H "Authorization: Bearer <JWT_TOKEN>"
```

## Prisma Studio

Om de database visueel te beheren, start je Prisma Studio:

```bash
npx prisma studio
```

Open dan [http://localhost:5555](http://localhost:5555) in je browser.

## Licentie

MIT 