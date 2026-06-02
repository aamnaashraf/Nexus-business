# Nexus Backend API

Backend API for Nexus - Investor & Entrepreneur Collaboration Platform

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon DB)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Environment**: dotenv
- **CORS**: cors middleware
- **Validation**: express-validator

## Folder Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Prisma client & connection
│   │   └── env.ts        # Environment variables
│   ├── controllers/      # Request handlers
│   │   └── auth.controller.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication & authorization
│   │   ├── errorHandler.ts # Centralized error handling
│   │   └── validator.ts  # Request validation middleware
│   ├── routes/           # API routes
│   │   ├── index.ts      # Main router
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   ├── services/         # Business logic
│   │   └── auth.service.ts
│   ├── utils/            # Utility functions
│   │   └── token.ts      # JWT token utilities
│   ├── app.ts            # Express app setup
│   └── index.ts          # Server entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seed file
├── .env                  # Environment variables (DO NOT COMMIT)
├── .env.example          # Environment template
├── .gitignore
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## Installation

### Prerequisites

- Node.js (v20.19+ or v22+)
- PostgreSQL database (Neon DB recommended)
- npm or yarn

### Steps

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your actual values:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `JWT_SECRET`: A strong secret key for JWT tokens
   - `CORS_ORIGIN`: Your frontend URL (default: http://localhost:3000)

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
Server will start on `http://localhost:5000` with hot-reload enabled.

### Production Build
```bash
npm run build
npm start
```

### Other Commands
```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Push schema changes without migration
npm run prisma:push

# Type checking
npm run lint

# Clean build directory
npm run clean
```

## API Endpoints

### Health Check
- **GET** `/api/v1/health` - Check API status

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| GET | `/api/v1/auth/profile` | Get user profile | Yes |
| PUT | `/api/v1/auth/profile` | Update user profile | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### User Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/users/me` | Get current user profile | Yes |

## API Testing Examples

### Register - Investor
```bash
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "email": "investor@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Investor",
  "role": "INVESTOR"
}
```

### Register - Entrepreneur
```bash
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "email": "entrepreneur@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Entrepreneur",
  "role": "ENTREPRENEUR"
}
```

### Login
```bash
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "investor@example.com",
  "password": "SecurePass123!"
}

# Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "investor@example.com",
      "firstName": "John",
      "lastName": "Investor",
      "role": "INVESTOR"
    },
    "token": "jwt-token-here"
  }
}
```

### Get Profile (Protected)
```bash
GET http://localhost:5000/api/v1/auth/profile
Authorization: Bearer <your-jwt-token>

# Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "investor@example.com",
    "firstName": "John",
    "lastName": "Investor",
    "role": "INVESTOR",
    "profileImage": null,
    "bio": null,
    "verified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "startupHistories": [],
    "investmentHistories": [],
    "preferences": null,
    "socialLinks": null,
    "entrepreneurProfile": null,
    "investorProfile": { ... }
  }
}
```

### Update Profile (Protected)
```bash
PUT http://localhost:5000/api/v1/auth/profile
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "bio": "Experienced tech investor",
  "profileImage": "https://example.com/image.jpg",
  "preferences": {
    "emailNotifications": true,
    "theme": "dark"
  },
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/johndoe"
  }
}
```

## Middleware Explanation

### 1. `authenticate` (auth.ts)
- Extracts JWT from Authorization header
- Verifies token signature and expiration
- Attaches decoded user to `req.user`
- Returns 401 if token is missing/invalid

### 2. `authorize(...roles)` (auth.ts)
- Factory function returning middleware
- Checks if user role is in allowed roles
- Returns 403 if unauthorized
- Usage: `authorize('INVESTOR')`, `authorize('ENTREPRENEUR', 'ADMIN')`

### 3. `validateRegister`, `validateLogin`, `validateProfileUpdate` (validator.ts)
- Input validation using express-validator
- Returns 400 with detailed error messages
- Password: min 8 chars, requires uppercase, lowercase, number
- Email: valid email format, normalized

### 4. `errorHandler` (errorHandler.ts)
- Catches all errors thrown in routes/controllers
- Returns appropriate HTTP status codes
- Hides internal errors in production

## Database Schema

The Prisma schema includes:

- **User**: Core user model with role-based access (Entrepreneur/Investor/Admin)
- **EntrepreneurProfile**: Extended profile for entrepreneurs
- **InvestorProfile**: Extended profile for investors
- **StartupHistory**: User's startup experiences
- **InvestmentHistory**: User's investment records
- **UserPreferences**: Notification and UI preferences
- **SocialLinks**: LinkedIn, Twitter, website links
- **Meeting**: Meeting scheduling and management (future)
- **Document**: Document storage and sharing (future)
- **Payment**: Payment transactions (future)
- **Message**: Messaging system (future)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `BCRYPT_ROUNDS` | Bcrypt hashing rounds | `10` |

## Security Best Practices

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT-based authentication with expiration
- ✅ Role-based authorization
- ✅ CORS protection
- ✅ Environment variable validation
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Password excluded from API responses
- ✅ HTTP-only error messages in production

## Future Scalability

The architecture supports easy extension for:
- **Meetings**: Video call scheduling
- **Documents**: File storage and sharing
- **Payments**: Stripe/Stripe Connect integration
- **Messaging**: Real-time chat with WebSockets
- **Notifications**: Push/email notifications
- **Search**: Elasticsearch integration