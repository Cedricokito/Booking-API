#!/bin/bash

# Kleuren voor output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Booking API Start Script${NC}"
echo "----------------------------------------"

# 1. Stop eventuele processen op poort 3000
echo -e "${GREEN}1. Stoppen van processen op poort 3000...${NC}"
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# 2. Maak .env bestand aan als het niet bestaat
if [ ! -f .env ]; then
    echo -e "${GREEN}2. Aanmaken van .env bestand...${NC}"
    cat > .env << EOL
DATABASE_URL="file:./prod.db"
AUTH_SECRET_KEY="booking-api-super-secret-key"
PORT=3000
EOL
fi

# 3. Database setup en seeden
echo -e "${GREEN}3. Database setup en seeden...${NC}"
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Start de server
echo -e "${GREEN}4. Server starten...${NC}"
echo -e "${BLUE}Test accounts:${NC}"
echo -e "${BLUE}- Test User: test@example.com / password123${NC}"
echo -e "${BLUE}- Property Owner: owner@example.com / password123${NC}"
echo "----------------------------------------"
echo -e "${GREEN}🎉 Setup voltooid! De server wordt nu gestart...${NC}"
echo -e "${BLUE}Druk op Ctrl+C om de server te stoppen${NC}"
echo "----------------------------------------"

# Start de server
npm run dev 