Zerobin — Full Project (backend + frontend-static + frontend-react)

Folders:
- backend: Node.js + Express API
- frontend-static: Tailwind static HTML pages (index, register, login, dashboard)
- frontend-react: React (Vite) starter with Tailwind CDN and Leaflet CDN

Quick start:

1) Backend
   cd backend
   cp .env.example .env
   # edit .env with your MongoDB and SMTP
   npm install
   npm run dev

2) Static frontend
   Serve with http-server (recommended):
     npm install -g http-server
     http-server ../frontend-static -p 8080
   Open http://localhost:8080

3) React frontend
   cd frontend-react
   npm install
   npm run dev
   Open the dev URL printed by Vite

Use MongoDB Compass to connect to your MONGO_URI to inspect collections.
