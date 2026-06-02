# Milestone 2 Quick Start Guide

## Quick Setup (5 minutes)

### 1. Environment Setup
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://user:pass@host.neon.tech/nexus_db?sslmode=require"
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
BCRYPT_ROUNDS=10
```

### 2. Install & Generate
```bash
npm install
npm run prisma:generate
```

### 3. Run Migrations
```bash
npm run prisma:migrate -- --name init
```

### 4. Start Server
```bash
npm run dev
```

## Postman Testing Collection

### 1. Register Investor
```
POST http://localhost:5000/api/v1/auth/register

{
  "email": "investor@test.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Investor",
  "role": "INVESTOR"
}
```

### 2. Register Entrepreneur
```
POST http://localhost:5000/api/v1/auth/register

{
  "email": "entrepreneur@test.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Entrepreneur",
  "role": "ENTREPRENEUR"
}
```

### 3. Login
```
POST http://localhost:5000/api/v1/auth/login

{
  "email": "investor@test.com",
  "password": "SecurePass123!"
}

# Save the token from response!
```

### 4. Get Profile (with token)
```
GET http://localhost:5000/api/v1/auth/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

### 5. Update Profile
```
PUT http://localhost:5000/api/v1/auth/profile
Authorization: Bearer YOUR_TOKEN_HERE

{
  "bio": "Early-stage tech investor",
  "profileImage": "https://example.com/avatar.jpg",
  "preferences": {
    "emailNotifications": true,
    "theme": "dark"
  },
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/johninvestor"
  }
}
```

### 6. Get Current User
```
GET http://localhost:5000/api/v1/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

## Test Flow

1. Register → Get token
2. Login → Get new token
3. Use token → Get profile
4. Update profile → Verify changes
5. Test validation errors → Invalid email/password
6. Test protected routes → Without token (should fail)

## Expected Responses

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Password must be at least 8 characters"
}
```