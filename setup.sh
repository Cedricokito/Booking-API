#!/bin/bash

# Kleuren voor output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Booking API Setup Script${NC}"
echo "----------------------------------------"

# 1. Stop eventuele processen op poort 3000
echo -e "${GREEN}1. Stoppen van processen op poort 3000...${NC}"
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# 2. Installeer dependencies
echo -e "${GREEN}2. Installeren van dependencies...${NC}"
npm install

# 3. Maak .env bestand aan
echo -e "${GREEN}3. Aanmaken van .env bestand...${NC}"
cat > .env << EOL
DATABASE_URL="file:./dev.db"
AUTH_SECRET_KEY="booking-api-super-secret-key"
PORT=3000
EOL

# 4. Database setup
echo -e "${GREEN}4. Database setup...${NC}"
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Start de server
echo -e "${GREEN}5. Server starten...${NC}"
echo -e "${BLUE}De server wordt gestart in development mode.${NC}"
echo -e "${BLUE}Test accounts:${NC}"
echo -e "${BLUE}- Test User: test@example.com / password123${NC}"
echo -e "${BLUE}- Property Owner: owner@example.com / password123${NC}"
echo "----------------------------------------"
echo -e "${GREEN}🎉 Setup voltooid! De server wordt nu gestart...${NC}"
echo -e "${BLUE}Druk op Ctrl+C om de server te stoppen${NC}"
echo "----------------------------------------"

# Start de server
npm run dev 