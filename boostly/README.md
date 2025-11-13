# Boostly - Peer-to-Peer Recognition Platform

A Node.js-based application that enables students to recognize their peers, transfer credits, and redeem rewards. Built with Express.js, SQLite, and secure transaction handling.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Sample Requests & Responses](#sample-requests--responses)
- [Business Rules](#business-rules)
- [Architecture & Design Decisions](#architecture--design-decisions)

---

## 🛠 Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js 4.18
- **Database**: SQLite 5.1
- **Validation**: Joi 17.11
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Morgan

---

## 📦 Setup Instructions

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd boostly
```

2. **Install dependencies**:
```bash
npm install express sqlite3 cors helmet joi express-rate-limit dotenv morgan
```

3. **Verify folder structure**:
```
boostly/
├── src/
│   ├── controllers/
│   │   ├── students.controller.js
│   │   ├── recognitions.controller.js
│   │   ├── endorsements.controller.js
│   │   └── redemptions.controller.js
│   ├── routes/
│   │   ├── students.routes.js
│   │   ├── recognitions.routes.js
│   │   ├── endorsements.routes.js
│   │   └── redemptions.routes.js
│   ├── validation/
│   │   ├── students.validation.js
│   │   ├── recognitions.validation.js
│   │   ├── endorsements.validation.js
│   │   └── redemptions.validation.js
│   ├── db/
│   │   ├── database.js
│   │   └── schema.sql
│   ├── middleware/
│   │   └── auth.middleware.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

4. **Environment Configuration** (`.env`):
```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./boostly.db
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🚀 Running the Application

### Start the Server

```bash
node src/index.js
```

**Expected Output:**
```
🚀 Starting Boostly server...
✓ Connected to SQLite database
✓ Foreign keys enabled
✓ Database schema initialized
✓ Server running on port 3000
✓ Health check: http://localhost:3000/health
✓ API base URL: http://localhost:3000/api
================================
```

### Verify Server is Running

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Boostly API is running",
  "timestamp": "2025-11-13T02:48:46.605Z"
}
```

---

## 📡 API Endpoints

### Authentication
All protected endpoints require the `X-User-Id` header to simulate authentication.

**Example:**
```bash
-H "X-User-Id: 1"
```

---

### Students

#### 1. Create Student
- **Endpoint**: `POST /api/students`
- **Description**: Create a new student account
- **Authentication**: None (public endpoint for testing)
- **Request Body**:
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com"
}
```
- **Success Response** (201):
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "received_balance": 0,
    "sending_balance": 100,
    "monthly_sending_limit_used": 0,
    "created_at": "2025-11-13 02:48:50"
  }
}
```

#### 2. Get Student Profile
- **Endpoint**: `GET /api/students/:id`
- **Description**: Get student profile with balances and statistics
- **Authentication**: Required
- **Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "received_balance": 0,
    "sending_balance": 80,
    "monthly_sending_limit_used": 20,
    "remaining_monthly_limit": 80,
    "created_at": "2025-11-13 02:48:50",
    "statistics": {
      "recognitions_sent": 1,
      "total_credits_sent": 20,
      "recognitions_received": 0,
      "total_credits_received": 0,
      "endorsements_given": 0
    }
  }
}
```

#### 3. Get All Students
- **Endpoint**: `GET /api/students`
- **Description**: Get list of all students
- **Authentication**: Required
- **Success Response** (200):
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "received_balance": 0,
      "sending_balance": 80,
      "monthly_sending_limit_used": 20,
      "created_at": "2025-11-13 02:48:50"
    }
  ]
}
```

---

### Recognitions

#### 1. Send Recognition (Transfer Credits)
- **Endpoint**: `POST /api/recognitions`
- **Description**: Send recognition and transfer credits to another student
- **Authentication**: Required
- **Transaction**: Uses database transaction to prevent race conditions
- **Request Body**:
```json
{
  "receiver_id": 2,
  "amount": 20,
  "message": "Great job on the project presentation!"
}
```
- **Success Response** (201):
```json
{
  "success": true,
  "message": "Recognition created successfully",
  "data": {
    "id": 1,
    "sender_id": 1,
    "receiver_id": 2,
    "amount": 20,
    "message": "Great job on the project presentation!",
    "created_at": "2025-11-13 02:49:32",
    "sender_name": "Alice Johnson",
    "receiver_name": "Bob Smith"
  }
}
```
- **Error Response** (400 - Insufficient Balance):
```json
{
  "success": false,
  "error": "Insufficient sending balance. Available: 50 credits"
}
```
- **Error Response** (400 - Monthly Limit):
```json
{
  "success": false,
  "error": "Monthly sending limit exceeded. Remaining: 30 credits"
}
```

#### 2. Get All Recognitions
- **Endpoint**: `GET /api/recognitions`
- **Description**: Get all recognitions with optional filters
- **Authentication**: Required
- **Query Parameters**:
  - `sender_id` (optional): Filter by sender
  - `receiver_id` (optional): Filter by receiver
- **Success Response** (200):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "amount": 20,
      "message": "Great job on the project presentation!",
      "created_at": "2025-11-13 02:49:32",
      "sender_name": "Alice Johnson",
      "receiver_name": "Bob Smith",
      "endorsement_count": 1
    }
  ]
}
```

#### 3. Get Recognition by ID
- **Endpoint**: `GET /api/recognitions/:id`
- **Description**: Get detailed recognition with endorsers
- **Authentication**: Required
- **Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sender_id": 1,
    "receiver_id": 2,
    "amount": 20,
    "message": "Great job on the project presentation!",
    "created_at": "2025-11-13 02:49:32",
    "sender_name": "Alice Johnson",
    "sender_email": "alice@example.com",
    "receiver_name": "Bob Smith",
    "receiver_email": "bob@example.com",
    "endorsement_count": 1,
    "endorsers": [
      {
        "endorsement_id": 1,
        "created_at": "2025-11-13 02:50:30",
        "endorser_id": 3,
        "endorser_name": "Carol White"
      }
    ]
  }
}
```

---

### Endorsements

#### 1. Endorse Recognition
- **Endpoint**: `POST /api/endorsements`
- **Description**: Endorse an existing recognition (like/cheer)
- **Authentication**: Required
- **Request Body**:
```json
{
  "recognition_id": 1
}
```
- **Success Response** (201):
```json
{
  "success": true,
  "message": "Endorsement created successfully",
  "data": {
    "id": 1,
    "recognition_id": 1,
    "endorser_id": 3,
    "created_at": "2025-11-13 02:50:30",
    "endorser_name": "Carol White",
    "recognition_amount": 20,
    "sender_name": "Alice Johnson",
    "receiver_name": "Bob Smith"
  }
}
```
- **Error Response** (400 - Self Endorsement):
```json
{
  "success": false,
  "error": "Cannot endorse your own recognition (as sender or receiver)"
}
```
- **Error Response** (409 - Duplicate):
```json
{
  "success": false,
  "error": "You have already endorsed this recognition"
}
```

#### 2. Get Endorsements by Recognition
- **Endpoint**: `GET /api/endorsements/recognition/:recognition_id`
- **Description**: Get all endorsements for a specific recognition
- **Authentication**: Required
- **Success Response** (200):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "recognition_id": 1,
      "endorser_id": 3,
      "created_at": "2025-11-13 02:50:30",
      "endorser_name": "Carol White",
      "endorser_email": "carol@example.com"
    }
  ]
}
```

#### 3. Get Endorsements by Student
- **Endpoint**: `GET /api/endorsements/student/:student_id`
- **Description**: Get all endorsements given by a student
- **Authentication**: Required
- **Success Response** (200):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "recognition_id": 1,
      "endorser_id": 3,
      "created_at": "2025-11-13 02:50:30",
      "amount": 20,
      "message": "Great job on the project presentation!",
      "sender_name": "Alice Johnson",
      "receiver_name": "Bob Smith"
    }
  ]
}
```

---

### Redemptions

#### 1. Redeem Credits
- **Endpoint**: `POST /api/redemptions`
- **Description**: Convert received credits to rupees (₹5 per credit)
- **Authentication**: Required
- **Transaction**: Uses database transaction to prevent race conditions
- **Request Body**:
```json
{
  "credits_redeemed": 10
}
```
- **Success Response** (201):
```json
{
  "success": true,
  "message": "Redemption successful",
  "data": {
    "id": 1,
    "student_id": 2,
    "credits_redeemed": 10,
    "rupees_value": 50,
    "created_at": "2025-11-13 02:49:39",
    "student_name": "Bob Smith",
    "student_email": "bob@example.com",
    "remaining_balance": 10
  }
}
```
- **Error Response** (400 - Insufficient Balance):
```json
{
  "success": false,
  "error": "Insufficient received balance. Available: 5 credits"
}
```

#### 2. Get All Redemptions
- **Endpoint**: `GET /api/redemptions`
- **Description**: Get all redemptions (admin view)
- **Authentication**: Required
- **Success Response** (200):
```json
{
  "success": true,
  "count": 1,
  "summary": {
    "total_credits_redeemed": 10,
    "total_rupees_value": 50
  },
  "data": [
    {
      "id": 1,
      "student_id": 2,
      "credits_redeemed": 10,
      "rupees_value": 50,
      "created_at": "2025-11-13 02:49:39",
      "student_name": "Bob Smith",
      "student_email": "bob@example.com"
    }
  ]
}
```

#### 3. Get Redemption by ID
- **Endpoint**: `GET /api/redemptions/:id`
- **Description**: Get specific redemption details
- **Authentication**: Required
- **Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": 2,
    "credits_redeemed": 10,
    "rupees_value": 50,
    "created_at": "2025-11-13 02:49:39",
    "student_name": "Bob Smith",
    "student_email": "bob@example.com",
    "current_balance": 10
  }
}
```

#### 4. Get Student Redemptions
- **Endpoint**: `GET /api/redemptions/student/:student_id`
- **Description**: Get all redemptions for a specific student
- **Authentication**: Required
- **Success Response** (200):
```json
{
  "success": true,
  "count": 1,
  "summary": {
    "total_credits_redeemed": 10,
    "total_rupees_value": 50
  },
  "data": [
    {
      "id": 1,
      "student_id": 2,
      "credits_redeemed": 10,
      "rupees_value": 50,
      "created_at": "2025-11-13 02:49:39",
      "student_name": "Bob Smith",
      "student_email": "bob@example.com"
    }
  ]
}
```

---

## 🧪 Sample Requests & Responses

### Complete Flow Example

#### Step 1: Create Students
```bash
# Create Alice
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}'

# Create Bob
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Smith", "email": "bob@example.com"}'

# Create Carol
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Carol White", "email": "carol@example.com"}'
```

#### Step 2: Alice Sends Recognition to Bob
```bash
curl -X POST http://localhost:3000/api/recognitions \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "receiver_id": 2,
    "amount": 20,
    "message": "Great job on the project presentation!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Recognition created successfully",
  "data": {
    "id": 1,
    "sender_id": 1,
    "receiver_id": 2,
    "amount": 20,
    "message": "Great job on the project presentation!",
    "created_at": "2025-11-13 02:49:32",
    "sender_name": "Alice Johnson",
    "receiver_name": "Bob Smith"
  }
}
```

#### Step 3: Carol Endorses the Recognition
```bash
curl -X POST http://localhost:3000/api/endorsements \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 3" \
  -d '{"recognition_id": 1}'
```

**Response:**
```json
{
  "success": true,
  "message": "Endorsement created successfully",
  "data": {
    "id": 1,
    "recognition_id": 1,
    "endorser_id": 3,
    "created_at": "2025-11-13 02:50:30",
    "endorser_name": "Carol White",
    "recognition_amount": 20,
    "sender_name": "Alice Johnson",
    "receiver_name": "Bob Smith"
  }
}
```

#### Step 4: Bob Redeems Credits
```bash
curl -X POST http://localhost:3000/api/redemptions \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{"credits_redeemed": 10}'
```

**Response:**
```json
{
  "success": true,
  "message": "Redemption successful",
  "data": {
    "id": 1,
    "student_id": 2,
    "credits_redeemed": 10,
    "rupees_value": 50,
    "created_at": "2025-11-13 02:49:39",
    "student_name": "Bob Smith",
    "student_email": "bob@example.com",
    "remaining_balance": 10
  }
}
```

#### Step 5: View Bob's Profile
```bash
curl -X GET http://localhost:3000/api/students/2 \
  -H "X-User-Id: 2"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Bob Smith",
    "email": "bob@example.com",
    "received_balance": 10,
    "sending_balance": 100,
    "monthly_sending_limit_used": 0,
    "remaining_monthly_limit": 100,
    "created_at": "2025-11-13 02:48:52",
    "statistics": {
      "recognitions_sent": 0,
      "total_credits_sent": 0,
      "recognitions_received": 1,
      "total_credits_received": 20,
      "endorsements_given": 0
    }
  }
}
```

---

## 📜 Business Rules

### Recognition (Credit Transfer)
- ✅ Each student starts with **100 credits per month**
- ✅ **Monthly sending limit**: 100 credits
- ✅ Cannot send credits to yourself
- ✅ Cannot send more than available balance
- ✅ Cannot exceed monthly sending limit
- ✅ Credits are deducted from sender's `sending_balance`
- ✅ Credits are added to receiver's `received_balance`

### Endorsements
- ✅ Each student can endorse a recognition **only once**
- ✅ Cannot endorse your own recognition (as sender or receiver)
- ✅ Endorsements are just a count (no credit impact)
- ✅ UNIQUE constraint enforced at database level

### Redemptions
- ✅ Conversion rate: **₹5 per credit**
- ✅ Credits are **permanently deducted** from `received_balance`
- ✅ Can only redeem credits from `received_balance`
- ✅ Cannot redeem more than available balance

---

## 🏗 Architecture & Design Decisions

### Database Schema

#### Students Table
```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    received_balance INTEGER DEFAULT 0,      -- Credits received from others
    sending_balance INTEGER DEFAULT 100,      -- Credits available to send
    monthly_sending_limit_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Recognitions Table
```sql
CREATE TABLE recognitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES students(id),
    FOREIGN KEY (receiver_id) REFERENCES students(id),
    CHECK (amount > 0),
    CHECK (sender_id != receiver_id)
);
```

#### Endorsements Table
```sql
CREATE TABLE endorsements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recognition_id INTEGER NOT NULL,
    endorser_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recognition_id) REFERENCES recognitions(id),
    FOREIGN KEY (endorser_id) REFERENCES students(id),
    UNIQUE(recognition_id, endorser_id)  -- Prevent double endorsement
);
```

#### Redemptions Table
```sql
CREATE TABLE redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    credits_redeemed INTEGER NOT NULL,
    rupees_value INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    CHECK (credits_redeemed > 0),
    CHECK (rupees_value > 0)
);
```

### Transaction Safety (Critical Feature)

**Recognition Transfer** uses database transactions to prevent race conditions:

```javascript
const result = await executeTransaction(async () => {
    // 1. Lock and validate sender balance
    const sender = await db.get('SELECT * FROM students WHERE id = ?', [senderId]);
    
    // 2. Validate business rules
    if (sender.sending_balance < amount) throw new Error('Insufficient balance');
    
    // 3. Update sender balance
    await db.run('UPDATE students SET sending_balance = sending_balance - ? WHERE id = ?', 
                 [amount, senderId]);
    
    // 4. Update receiver balance
    await db.run('UPDATE students SET received_balance = received_balance + ? WHERE id = ?', 
                 [amount, receiverId]);
    
    // 5. Create recognition record
    const recognitionId = await db.run('INSERT INTO recognitions ...');
    
    return recognitionId;
});
// Automatic COMMIT if successful, ROLLBACK if any error
```

**Why Transactions Matter:**
- Prevents partial updates (e.g., credits deducted but not added)
- Handles concurrent requests safely
- Ensures data consistency
- Automatic rollback on errors

**Redemption** also uses transactions for the same reasons.

### Security Features

1. **Authentication Middleware**
   - Simulated via `X-User-Id` header
   - All protected endpoints validate user ID
   - Easy to replace with JWT in production

2. **Rate Limiting**
   - 100 requests per 10 minutes per IP
   - Prevents abuse and DDoS

3. **Input Validation**
   - Joi schemas for all inputs
   - Type checking, range validation
   - Sanitized error messages

4. **Security Headers**
   - Helmet.js for XSS, clickjacking protection
   - CORS enabled for cross-origin requests

5. **Database Security**
   - Foreign key constraints enabled
   - CHECK constraints for business rules
   - UNIQUE constraints for data integrity

### Project Structure

```
src/
├── controllers/      # Business logic (CRUD operations)
├── routes/          # API route definitions
├── validation/      # Joi validation schemas
├── db/             # Database connection and schema
├── middleware/     # Authentication and other middleware
└── index.js        # Main application entry point
```

**Design Pattern**: MVC (Model-View-Controller)
- **Models**: Database schema in `db/schema.sql`
- **Controllers**: Business logic in `controllers/`
- **Routes**: API endpoints in `routes/`
- **Validation**: Input validation in `validation/`

### Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, business rule violations)
- `401` - Unauthorized (missing/invalid authentication)
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

---

## 🔒 Security Considerations

1. **No Hardcoded Secrets**: All configuration in `.env`
2. **SQL Injection Prevention**: Parameterized queries throughout
3. **Input Validation**: Joi schemas validate all inputs
4. **Rate Limiting**: Prevents API abuse
5. **Foreign Keys**: Referential integrity enforced
6. **Transactions**: Prevent race conditions and data corruption

---

## 🧪 Testing Guide

See `test-cases/test-cases.txt` for detailed testing instructions for each feature.

---

## 📝 Notes

- **Database**: SQLite file (`boostly.db`) is auto-created on first run
- **Authentication**: Currently simulated with `X-User-Id` header for testing
- **Monthly Reset**: Not yet implemented (Step-up Challenge #1)
- **Leaderboard**: Not yet implemented (Step-up Challenge #2)

---

## 🤝 Contributing

This is a coding challenge submission. For production use, consider:
- Implementing JWT authentication
- Adding comprehensive test suite
- Implementing monthly credit reset
- Adding leaderboard feature
- Using PostgreSQL/MySQL for production
- Adding API documentation (Swagger/OpenAPI)
- Implementing logging and monitoring

---

## 📄 License

This project is submitted as part of a coding challenge.

---

**Built with ❤️ for Boostly Coding Challenge**