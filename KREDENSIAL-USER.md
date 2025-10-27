# 🔐 Kredensial User untuk Testing

## Test Accounts

```
┌─────────────┬──────────────────┬────────────────┬─────────────────────┐
│    ROLE     │    USERNAME      │    PASSWORD    │       AKSES         │
├─────────────┼──────────────────┼────────────────┼─────────────────────┤
│ SUPERUSER   │ superusermirov   │ superuser123   │ Full Access ✅✅✅  │
│ ADMIN       │ adminmirov       │ admin123       │ Manage Schedules ✅ │
│ UMUM        │ usermirov        │ user123        │ View Only ✅        │
└─────────────┴──────────────────┴────────────────┴─────────────────────┘
```

---

## 1️⃣ SUPERUSER (Full Access)

```
Username: superusermirov
Password: superuser123
```

**Permissions:**
- ✅ View schedules
- ✅ Create schedules
- ✅ Edit schedules
- ✅ Delete schedules
- ✅ All admin functions

---

## 2️⃣ ADMIN (Manage Schedules)

```
Username: adminmirov
Password: admin123
```

**Permissions:**
- ✅ View schedules
- ✅ Create schedules
- ✅ Edit schedules
- ✅ Delete schedules
- ❌ Cannot manage users

---

## 3️⃣ UMUM (View Only)

```
Username: usermirov
Password: user123
```

**Permissions:**
- ✅ View schedules (READ ONLY)
- ❌ Cannot create schedules
- ❌ Cannot edit schedules
- ❌ Cannot delete schedules

---

## 🧪 Quick Test

### Login di Frontend
1. Buka: http://localhost:5173/login
2. Masukkan salah satu kredensial di atas
3. Klik Login

### Login via API (curl)
```bash
# SUPERUSER
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"superusermirov\",\"password\":\"superuser123\"}"

# ADMIN
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"adminmirov\",\"password\":\"admin123\"}"

# UMUM
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"usermirov\",\"password\":\"user123\"}"
```

---

## 📊 RBAC Permission Matrix

| Action | SUPERUSER | ADMIN | UMUM |
|--------|:---------:|:-----:|:----:|
| View Schedules | ✅ | ✅ | ✅ |
| Create Schedule | ✅ | ✅ | ❌ |
| Edit Schedule | ✅ | ✅ | ❌ |
| Delete Schedule | ✅ | ✅ | ❌ |

---

## 💡 Tips

- **Username simple:** Tidak perlu menggunakan format email `@mirov.com`
- **Password user UMUM:** Sudah diperbaiki dari `user12345` menjadi `user123` (7 karakter)
- **Frontend validation:** Sudah dihapus validasi format email dan min 8 chars
- **Backend:** Semua kredensial sudah ter-hash dengan bcrypt di database

---

## 🔄 Re-seed Database

Jika perlu reset database dengan kredensial ini:

```bash
cd server
npx prisma db seed
```
