# API Testing Guide - RBAC System

Backend server running di: **http://localhost:5000**

## Test Accounts

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| superuser@mirov.com | superuser123 | SUPERUSER | Full access - semua operasi |
| admin@mirov.com | admin123 | ADMIN | Manage schedules - add, edit, delete jadwal |
| user@mirov.com | user12345 | UMUM | View only - hanya bisa lihat |

---

## 1. Test Login (Semua Role)

### Login sebagai SUPERUSER
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"superuser@mirov.com\",\"password\":\"superuser123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "superuser@mirov.com",
      "role": "SUPERUSER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login sebagai ADMIN
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@mirov.com\",\"password\":\"admin123\"}"
```

### Login sebagai UMUM
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@mirov.com\",\"password\":\"user12345\"}"
```

---

## 2. Test View Schedules (Semua Role Bisa)

Copy token dari response login, lalu:

```bash
curl -X GET http://localhost:5000/api/schedules ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

✅ **SUPERUSER** - SUCCESS (200)
✅ **ADMIN** - SUCCESS (200)
✅ **UMUM** - SUCCESS (200)

---

## 3. Test Create Schedule (Hanya ADMIN & SUPERUSER)

### Test dengan ADMIN Token - SUCCESS ✅
```bash
curl -X POST http://localhost:5000/api/schedules ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer ADMIN_TOKEN" ^
  -d "{\"title\":\"New Meeting\",\"description\":\"Test meeting\",\"startDate\":\"2025-01-25T10:00:00\",\"endDate\":\"2025-01-25T11:00:00\",\"location\":\"Room B\",\"status\":\"planned\"}"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "schedule": {
      "id": 4,
      "title": "New Meeting",
      ...
    }
  }
}
```

### Test dengan UMUM Token - FORBIDDEN ❌
```bash
curl -X POST http://localhost:5000/api/schedules ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer UMUM_TOKEN" ^
  -d "{\"title\":\"New Meeting\",\"startDate\":\"2025-01-25T10:00:00\",\"endDate\":\"2025-01-25T11:00:00\"}"
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Forbidden - You do not have permission to access this resource",
  "requiredRole": ["ADMIN", "SUPERUSER"],
  "yourRole": "UMUM"
}
```

---

## 4. Test Update Schedule (Hanya ADMIN & SUPERUSER)

### Test dengan ADMIN Token - SUCCESS ✅
```bash
curl -X PUT http://localhost:5000/api/schedules/1 ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer ADMIN_TOKEN" ^
  -d "{\"title\":\"Updated Meeting Title\",\"status\":\"completed\"}"
```

✅ **ADMIN** - SUCCESS (200)
✅ **SUPERUSER** - SUCCESS (200)
❌ **UMUM** - FORBIDDEN (403)

---

## 5. Test Delete Schedule (Hanya ADMIN & SUPERUSER)

### Test dengan UMUM Token - FORBIDDEN ❌
```bash
curl -X DELETE http://localhost:5000/api/schedules/1 ^
  -H "Authorization: Bearer UMUM_TOKEN"
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Forbidden - You do not have permission to access this resource",
  "requiredRole": ["ADMIN", "SUPERUSER"],
  "yourRole": "UMUM"
}
```

### Test dengan ADMIN Token - SUCCESS ✅
```bash
curl -X DELETE http://localhost:5000/api/schedules/1 ^
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

---

## RBAC Summary

| Endpoint | Method | SUPERUSER | ADMIN | UMUM |
|----------|--------|-----------|-------|------|
| `/api/auth/login` | POST | ✅ | ✅ | ✅ |
| `/api/auth/profile` | GET | ✅ | ✅ | ✅ |
| `/api/schedules` | GET | ✅ | ✅ | ✅ |
| `/api/schedules/:id` | GET | ✅ | ✅ | ✅ |
| `/api/schedules` | POST | ✅ | ✅ | ❌ |
| `/api/schedules/:id` | PUT | ✅ | ✅ | ❌ |
| `/api/schedules/:id` | DELETE | ✅ | ✅ | ❌ |

---

## Test via Frontend

1. **Start Frontend** (jika belum running):
   ```bash
   npm run dev
   ```

2. **Open Browser**: http://localhost:5173

3. **Login dengan berbagai role**:
   - Login sebagai `admin@mirov.com` / `admin123`
   - Coba add/edit/delete jadwal → Harusnya bisa ✅

   - Logout, login sebagai `user@mirov.com` / `user12345`
   - Coba add/edit/delete jadwal → Harusnya tidak bisa (UI hidden atau error 403) ❌
   - Tapi tetap bisa view jadwal ✅

4. **Check Role di Browser Console**:
   ```javascript
   // Buka DevTools Console (F12)
   JSON.parse(localStorage.getItem('user'))
   // Output: { id: 3, name: "Regular User", email: "user@mirov.com", role: "UMUM" }
   ```

---

## Troubleshooting

### Error: "No token provided"
Pastikan header `Authorization: Bearer <token>` sudah benar.

### Error: "Invalid or expired token"
Token expired (7 hari). Login ulang untuk mendapatkan token baru.

### Error: "Cannot connect to database"
Pastikan PostgreSQL service running dan database `mirov_db` exists.

### Frontend tidak konek ke backend
1. Check backend running: http://localhost:5000/health
2. Check VITE_API_URL di `.env`: `VITE_API_URL=http://localhost:5000`
3. Restart frontend: `npm run dev`

---

## Next Steps

- [ ] Implement role-based UI rendering di frontend
- [ ] Add schedule management component
- [ ] Add role badge di user profile
- [ ] Add permission checking sebelum show button add/edit/delete
