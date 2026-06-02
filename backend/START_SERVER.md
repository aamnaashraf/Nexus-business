# 🚀 Quick Start Guide - Nexus Backend

## Start Backend Server

```bash
cd "E:/nexus project/backend"
npm run dev
```

**Expected Output:**
```
✅ Database connected successfully
🚀 Server running on port 5002
📍 Environment: development
🔗 API: http://localhost:5002/api/v1
💚 Health check: http://localhost:5002/api/v1/health
```

---

## If Port 5002 is Already in Use

### Option 1: Kill the Process (Windows)
```bash
# Find the process
netstat -ano | findstr :5002

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Option 2: Change Port
Edit `backend/.env`:
```
PORT=5003
```

---

## Test Backend is Running

```bash
curl http://localhost:5002/api/v1/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Nexus API is running",
  "timestamp": "2026-05-22T...",
  "environment": "development"
}
```

---

## Start Frontend

```bash
cd "E:/nexus project/Nexus"
npm run dev
```

**Expected:** Frontend starts on available port (check console)

---

## Common Issues

### Port Already in Use
- Kill the process using the port
- Or change PORT in `.env`

### Database Connection Failed
- Check DATABASE_URL in `.env`
- Verify Neon DB is accessible

### Module Not Found
```bash
npm install
```

---

## Quick Test Commands

```bash
# Health check
curl http://localhost:5002/api/v1/health

# Register user
curl -X POST http://localhost:5002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nexus.com","password":"TestPass123","firstName":"Test","lastName":"User","role":"ENTREPRENEUR"}'

# Login
curl -X POST http://localhost:5002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nexus.com","password":"TestPass123"}'
```

---

**Your backend is ready to run! 🎉**
