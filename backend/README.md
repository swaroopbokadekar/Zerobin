Backend setup
1. Copy .env.example to .env and fill values (MONGO_URI, JWT_SECRET, SMTP_*).
2. Install Node dependencies:
   cd backend
   npm install
3. Run server:
   npm run dev
Notes:
- For SMTP with Gmail, create an App Password and use SMTP_USER as your email and SMTP_PASS as the app password.
- For local MongoDB, run MongoDB and use mongodb://localhost:27017/zerobin
