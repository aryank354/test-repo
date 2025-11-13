# Boostly - Peer-to-Peer Recognition Platform

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install express sqlite3 cors helmet joi express-rate-limit dotenv morgan
```

### 2. Start the Server
```bash
node src/index.js
```

The server will start on `http://localhost:3000`

---

## 🧪 Testing the API

### 1. Create Test Students

**Student 1 (Alice):**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }'
```

**Student 2 (Bob):**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "bob@example.com"
  }'
```

**Student 3 (Carol):**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carol White",
    "email": "carol@example.com"
  }'
```

### 2. View Student Profile
```bash
# Get Alice's profile (student ID: 1)
curl -X GET http://localhost:3000/api/students/1 \
  -H "X-User-Id: 1"
```

### 3. Send Recognition (Transfer Credits)
```bash
# Alice (ID: 1) sends 20 credits to Bob (ID: 2)
curl -X POST http://localhost:3000/api/recognitions \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "receiver_id": 2,
    "amount": 20,
    "message": "Great job on the project presentation!"
  }'
```

### 4. View All Recognitions
```bash
curl -X GET http://localhost:3000/api/recognitions \
  -H "X-User-Id: 1"
```

### 5. Endorse a Recognition
```bash
# Carol (ID: 3) endorses the recognition (ID: 1)
curl -X POST http://localhost:3000/api/endorsements \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 3" \
  -d '{
    "recognition_id": 1
  }'
```

### 6. Redeem Credits
```bash
# Bob (ID: 2) redeems 10 credits for 50 rupees
curl -X POST http://localhost:3000/api/redemptions \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{
    "credits_redeemed": 10
  }'
```

### 7. View Redemption History
```bash
# Get Bob's redemption history
curl -X GET http://localhost:3000/api/redemptions/student/2 \
  -H "X-User-Id: 2"
```

---

## 🔐 Security Features

### 1. **Database Transactions**
- Recognition transfers use `BEGIN/COMMIT` transactions
- Prevents race conditions and double-spending
- Automatic rollback on errors

### 2. **Authentication Simulation**
- All protected endpoints require `X-User-Id` header
- Example: `-H "X-User-Id: 1"`

### 3. **Rate Limiting**
- 100 requests per 10 minutes per IP
- Configured in `src/index.js`

### 4. **Input Validation**
- All inputs validated using Joi schemas
- Located in `src/validation/` directory

### 5. **Security Headers**
- Helmet.js for secure HTTP headers
- CORS enabled for cross-origin requests

---

## 📊 Key Business Rules

### Balances
- **Sending Balance**: 100 credits (default)
- **Monthly Limit**: 100 credits/month
- **Received Balance**: Starts at 0
- **Redemption Rate**: 1 credit = 5 rupees

### Constraints
- Cannot send recognition to yourself
- Cannot endorse your own recognition
- Cannot endorse the same recognition twice
- Must have sufficient balance to send/redeem

---

## 🗂️ API Endpoints

### Students
- `POST /api/students` - Create student (no auth)
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student profile

### Recognitions
- `POST /api/recognitions` - Send recognition
- `GET /api/recognitions` - Get all recognitions
- `GET /api/recognitions/:id` - Get recognition details

### Endorsements
- `POST /api/endorsements` - Endorse recognition
- `GET /api/endorsements/recognition/:id` - Get endorsements by recognition
- `GET /api/endorsements/student/:id` - Get endorsements by student

### Redemptions
- `POST /api/redemptions` - Redeem credits
- `GET /api/redemptions` - Get all redemptions
- `GET /api/redemptions/:id` - Get redemption details
- `GET /api/redemptions/student/:id` - Get student redemptions

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Flow
1. Create 3 students
2. Alice sends 20 credits to Bob
3. Carol endorses the recognition
4. Bob redeems 10 credits

### Scenario 2: Insufficient Balance
```bash
# Alice tries to send more than her balance
curl -X POST http://localhost:3000/api/recognitions \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "receiver_id": 2,
    "amount": 150,
    "message": "This should fail"
  }'
```

### Scenario 3: Monthly Limit
```bash
# After Alice sends 100 credits total, this should fail
curl -X POST http://localhost:3000/api/recognitions \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "receiver_id": 2,
    "amount": 1,
    "message": "Monthly limit exceeded"
  }'
```

### Scenario 4: Double Endorsement
```bash
# Try to endorse the same recognition twice (should fail)
curl -X POST http://localhost:3000/api/endorsements \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 3" \
  -d '{
    "recognition_id": 1
  }'
```

---

## 🏗️ Project Structure

```
boostly/
├── src/
│   ├── controllers/       # Business logic
│   ├── routes/           # API route definitions
│   ├── validation/       # Joi validation schemas
│   ├── db/              # Database setup and schema
│   ├── middleware/      # Auth middleware
│   └── index.js        # Main server file
├── .env                # Environment variables
├── package.json        # Dependencies
└── boostly.db         # SQLite database (auto-created)
```

---

## 💡 Competition Tips

1. **Transaction Safety**: The recognition transfer is wrapped in a transaction - this is the critical requirement!

2. **Quick Testing**: Use the curl commands above to quickly test all features

3. **Error Handling**: All endpoints have proper error responses with clear messages

4. **Validation**: Input validation is handled by Joi schemas - modify in `src/validation/`

5. **Authentication**: Simply pass `-H "X-User-Id: 1"` to simulate authentication

---

## 🐛 Troubleshooting

### Database locked error
- SQLite is single-writer; this is normal under high concurrency
- Transactions handle this automatically with retries

### Port already in use
- Change `PORT` in `.env` file
- Or stop the other process using port 3000

### Module not found
- Run `npm install` again
- Check that you're in the project root directory

---

## ✅ Ready for Competition!

Your boilerplate includes:
- ✅ Database transactions for recognition transfers
- ✅ Authentication simulation via headers
- ✅ Rate limiting and security headers
- ✅ Input validation with Joi
- ✅ Complete CRUD for all features
- ✅ Proper error handling
- ✅ SQLite with foreign keys enabled
- ✅ Logging with Morgan

Good luck! 🚀