import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingdb';
const client = new MongoClient(uri);

async function seed() {
  try {
    await client.connect();
    const db = client.db();
    const properties = db.collection('properties');

    // Voorbeeld data
    const sampleProperties = [
      {
        name: 'Beach House',
        location: 'Zandvoort',
        price: 120,
        description: 'Mooi huis aan het strand',
      },
      {
        name: 'City Apartment',
        location: 'Amsterdam',
        price: 90,
        description: 'Centraal gelegen appartement',
      },
    ];

    // Eerst alles leegmaken (optioneel)
    await properties.deleteMany({});
    // Voeg de voorbeelddata toe
    await properties.insertMany(sampleProperties);

    console.log('Database succesvol gevuld met voorbeelddata!');
  } catch (err) {
    console.error('Fout bij seeden:', err);
  } finally {
    await client.close();
  }
}

seed(); 