# 🔐 Kredensial User untuk Testing

## Test Accounts (8 Users Total)

### 🔹 SUPERUSER (3 users)
```
┌──────────────┬─────────────┬─────────────────────┐
│    NAME      │  USERNAME   │     PASSWORD        │
├──────────────┼─────────────┼─────────────────────┤
│ Taufan       │ usertaufan  │ taufan123           │
│ Hans         │ userhans    │ hans123             │
│ Jelly        │ userjelly   │ jelly123            │
└──────────────┴─────────────┴─────────────────────┘
```

### 🔹 ADMIN (4 users)
```
┌──────────────┬─────────────────┬─────────────────┐
│    NAME      │    USERNAME     │    PASSWORD     │
├──────────────┼─────────────────┼─────────────────┤
│ Agung        │ adminagung      │ agung123        │
│ Amin         │ adminamin       │ amin123         │
│ Syaiful      │ adminsyaiful    │ syaiful123      │
│ Dea          │ admindea        │ dea123          │
└──────────────┴─────────────────┴─────────────────┘
```

### 🔹 UMUM (1 user)
```
┌──────────────┬─────────────┬─────────────────────┐
│    NAME      │  USERNAME   │     PASSWORD        │
├──────────────┼─────────────┼─────────────────────┤
│ Alfi         │ umumalfi    │ alfi123             │
└──────────────┴─────────────┴─────────────────────┘
```

---

## 1️⃣ SUPERUSER (Full Access)

**Contoh Login:**
```
Username: usertaufan
Password: taufan123
```

**Permissions:**
- ✅ View schedules
- ✅ Create schedules
- ✅ Edit schedules
- ✅ Delete schedules
- ✅ All admin functions
- ✅ View history

**Display di Sidebar:**
- Nama: "Taufan"
- Role: "Superuser"

---

## 2️⃣ ADMIN (Manage Schedules)

**Contoh Login:**
```
Username: adminagung
Password: agung123
```

**Permissions:**
- ✅ View schedules
- ✅ Create schedules
- ✅ Edit schedules
- ✅ Delete schedules
- ✅ View history
- ❌ Cannot update user roles

**Display di Sidebar:**
- Nama: "Agung"
- Role: "Administrator"

---

## 3️⃣ UMUM (View Only)

**Contoh Login:**
```
Username: umumalfi
Password: alfi123
```

**Permissions:**
- ✅ View schedules (READ ONLY)
- ❌ Cannot create schedules
- ❌ Cannot edit schedules
- ❌ Cannot delete schedules
- ❌ Cannot view history

**Display di Sidebar:**
- Nama: "Alfi"
- Role: "Pengguna Umum"

---

## 🧪 Quick Test

### Login di Frontend
1. Buka: http://localhost:5173
2. Pilih salah satu kredensial di atas
3. Masukkan username dan password
4. Klik Login
5. Di sidebar kiri, akan muncul nama user (contoh: "Taufan") dan role nya

### Login via API (curl)
```bash
# SUPERUSER - Taufan
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"usertaufan\",\"password\":\"taufan123\"}"

# ADMIN - Agung
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"adminagung\",\"password\":\"agung123\"}"

# UMUM - Alfi
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"umumalfi\",\"password\":\"alfi123\"}"
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

- **Format Username:** `user{nama}` untuk SUPERUSER, `admin{nama}` untuk ADMIN, `umum{nama}` untuk UMUM
- **Display Nama:** Di sidebar akan muncul nama saja (contoh: "Taufan", bukan "usertaufan")
- **Frontend validation:** Username tidak perlu format email
- **Backend:** Semua password sudah ter-hash dengan bcrypt di database
- **Total Users:** 8 users (3 SUPERUSER + 4 ADMIN + 1 UMUM)

---

## 🔄 Re-seed Database

Jika perlu reset database dengan 8 user baru ini:

```bash
cd server
npm run prisma:seed
```

**PERHATIAN:** Command ini akan menghapus semua data lama dan membuat 8 user baru!
