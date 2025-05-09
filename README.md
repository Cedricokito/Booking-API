# Property Booking API

Een RESTful API voor het beheren van accommodatie boekingen, gebouwd met Node.js, Express, en MongoDB.

## Features

* Gebruikers authenticatie en autorisatie
* Accommodatie beheer
* Boekingssysteem
* Reviewsysteem
* MongoDB Atlas integratie
* Prisma ORM

## Technische Stack

* Node.js
* Express.js
* MongoDB met Prisma
* JWT Authenticatie
* Jest voor Testing

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

3. Maak een `.env` bestand aan met de volgende inhoud:
```
DATABASE_URL="mongodb+srv://booking_admin:booking123@cluster0.ppp2iuk.mongodb.net/booking-api?retryWrites=true&w=majority&appName=Cluster0"
JWT_SECRET="jouw_jwt_secret"
```

4. Genereer de Prisma client:
```bash
npx prisma generate
```

5. Start de development server:
```bash
npm run dev
```

## API Endpoints

### Authenticatie
* `POST /api/auth/register` - Registreer een nieuwe gebruiker
* `POST /api/auth/login` - Login een gebruiker

### Properties
* `GET /api/properties` - Haal alle properties op
* `GET /api/properties/:id` - Haal een specifieke property op
* `POST /api/properties` - Maak een nieuwe property aan
* `PUT /api/properties/:id` - Update een property
* `DELETE /api/properties/:id` - Verwijder een property

### Bookings
* `GET /api/bookings` - Haal alle boekingen op
* `GET /api/bookings/:id` - Haal een specifieke boeking op
* `POST /api/bookings` - Maak een nieuwe boeking aan
* `PUT /api/bookings/:id` - Update een boeking
* `DELETE /api/bookings/:id` - Verwijder een boeking

### Reviews
* `GET /api/reviews` - Haal alle reviews op
* `POST /api/reviews` - Maak een nieuwe review aan
* `PUT /api/reviews/:id` - Update een review
* `DELETE /api/reviews/:id` - Verwijder een review

## Database Schema

### User
```prisma
model User {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  email     String    @unique
  name      String?
  password  String
  role      String    @default("USER")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  bookings  Booking[]
  reviews   Review[]
  properties Property[]
}
```

### Property
```prisma
model Property {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  description String
  price       Float
  location    String
  ownerId     String    @db.ObjectId
  owner       User      @relation(fields: [ownerId], references: [id])
  bookings    Booking[]
  reviews     Review[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Booking
```prisma
model Booking {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  startDate  DateTime
  endDate    DateTime
  userId     String   @db.ObjectId
  user       User     @relation(fields: [userId], references: [id])
  propertyId String   @db.ObjectId
  property   Property @relation(fields: [propertyId], references: [id])
  status     String   @default("PENDING")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Review
```prisma
model Review {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  rating     Int
  comment    String
  userId     String   @db.ObjectId
  user       User     @relation(fields: [userId], references: [id])
  propertyId String   @db.ObjectId
  property   Property @relation(fields: [propertyId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Testing

Run de tests met:
```bash
npm test
```

## Veiligheid

* JWT authenticatie voor alle beschermde routes
* Wachtwoord hashing met bcrypt
* Rate limiting voor API endpoints
* Input validatie
* Error handling middleware

## Ontwikkeling

1. Start de development server:
```bash
npm run dev
```

2. Open Prisma Studio om de database te bekijken:
```bash
npx prisma studio
```

## Licentie

Dit project is gelicenseerd onder de MIT License. 