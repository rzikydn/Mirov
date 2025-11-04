# 🔧 Troubleshooting - White Screen / Dashboard Tidak Muncul

## Masalah: Setelah Login Dashboard Putih / Tidak Muncul

### ✅ Yang Sudah Diperbaiki:

1. **Route mismatch fixed** - Logout redirect dari `/login` → `/auth`
2. **Added `/login` route alias** - Untuk backward compatibility
3. **Added debug logging** - Console log untuk tracking auth flow
4. **Created Debug Dashboard** - Tool untuk debugging auth state

---

## 🧪 Cara Debug Issue

### Step 1: Buka Debug Dashboard

1. Login dengan salah satu user:
   - `superusermirov` / `superuser123`
   - `adminmirov` / `admin123`
   - `usermirov` / `user123`

2. Setelah login, ubah URL di browser menjadi:
   ```
   http://localhost:5173/debug
   ```

3. Anda akan melihat debug info lengkap:
   - ✅ Auth Context State (user, token, isAuthenticated)
   - ✅ LocalStorage State (user, token)
   - ✅ RBAC Functions Test (canManageSchedules, hasRole)

---

### Step 2: Check Browser Console (F12)

Buka DevTools Console dan cari log berikut:

**Saat Login:**
```
✅ Login successful, user data: { id: ..., name: ..., role: ... }
✅ Token saved: Yes
✅ Navigating to /dashboard in 800ms...
🚀 Redirecting to /dashboard now
```

**Saat Dashboard Load:**
```
🔍 Dashboard - Checking auth: { token: true, storedUser: "..." }
✅ User loaded: { id: ..., name: ..., role: ... }
```

---

### Step 3: Check Kemungkinan Masalah

#### ❌ Masalah 1: Token Tidak Tersimpan
**Symptoms:**
- Console log: `❌ No token/user, redirecting to /auth`
- Redirect loop ke `/auth`

**Solution:**
```javascript
// Buka Console (F12) dan check:
localStorage.getItem('token')
localStorage.getItem('user')

// Jika null, coba login ulang
```

#### ❌ Masalah 2: User Object Error
**Symptoms:**
- Console log: `❌ Error parsing user: ...`
- White screen

**Solution:**
```javascript
// Buka Console (F12):
localStorage.clear()
// Lalu login ulang
```

#### ❌ Masalah 3: Component Crash
**Symptoms:**
- White screen tanpa error log
- React error boundary triggered

**Solution:**
1. Check Console untuk React error
2. Gunakan Debug Dashboard (`/debug`) untuk isolate masalah
3. Check apakah ada import error di `DashboardPage.tsx`

#### ❌ Masalah 4: CSS/Tailwind Issue
**Symptoms:**
- Dashboard render tapi tidak terlihat (background putih)
- Element exists di DOM Inspector tapi tidak visible

**Solution:**
1. Check di DevTools Elements tab
2. Pastikan Tailwind CSS ter-load
3. Check `index.css` import di `main.tsx`

---

## 🔍 Debug Commands (Browser Console)

### Check Auth State:
```javascript
// Check localStorage
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user')));

// Check current route
console.log('Current path:', window.location.pathname);

// Clear auth (if needed)
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### Manual Navigation:
```javascript
// Navigate to debug dashboard
window.location.href = '/debug';

// Navigate to dashboard
window.location.href = '/dashboard';

// Navigate to login
window.location.href = '/auth';
```

---

## 🎯 Quick Fixes

### Fix 1: Clear Cache & Reload
```
1. Buka DevTools (F12)
2. Klik kanan pada Reload button
3. Pilih "Empty Cache and Hard Reload"
```

### Fix 2: Clear LocalStorage
```javascript
// Buka Console (F12)
localStorage.clear();
// Lalu refresh dan login ulang
```

### Fix 3: Check Backend Running
```bash
# Pastikan backend running di port 5000
curl http://localhost:5000/health

# Expected response:
{"status":"OK","message":"Server is running"}
```

### Fix 4: Restart Frontend Dev Server
```bash
# Stop frontend (Ctrl+C)
# Then restart
npm run dev
```

---

## 📊 Expected Flow

### Successful Login Flow:
```
1. User enters credentials
   ↓
2. POST /api/auth/login → Backend
   ↓
3. Receive { user: {...}, token: "..." }
   ↓
4. Save to localStorage
   ↓
5. Navigate to /dashboard (after 800ms)
   ↓
6. Dashboard checks localStorage
   ↓
7. User authenticated ✅
   ↓
8. Dashboard renders with Sidebar, Header, Notes/Table
```

---

## 🆘 Still Having Issues?

### Step 1: Use Debug Dashboard
```
http://localhost:5173/debug
```
Lihat apakah:
- ✅ isAuthenticated: true
- ✅ user: {...}
- ✅ token: exists

### Step 2: Check Console Errors
Buka Console (F12) dan screenshot error yang muncul

### Step 3: Check Network Tab
1. Buka DevTools → Network tab
2. Login
3. Check response dari `/api/auth/login`
4. Pastikan status 200 dan response benar

### Step 4: Verify Routes
```javascript
// Buka Console (F12)
// Check available routes
console.log(window.location);
```

---

## 🔄 Reset Everything

Jika masih bermasalah, reset semua:

```bash
# 1. Stop semua services
Ctrl+C (frontend)
Ctrl+C (backend)

# 2. Clear browser
# Buka Console (F12)
localStorage.clear();
sessionStorage.clear();

# 3. Restart backend
cd server
npm run dev

# 4. Restart frontend (terminal baru)
npm run dev

# 5. Login ulang dengan kredensial fresh
```

---

## ✅ Verification Checklist

Setelah fix, verify:

- [ ] Login berhasil tanpa error
- [ ] Console log menunjukkan user data
- [ ] Token tersimpan di localStorage
- [ ] Navigate ke `/dashboard` berhasil
- [ ] Sidebar muncul di kiri
- [ ] Header muncul di atas
- [ ] Team Notes atau Database Table terlihat
- [ ] Tidak ada error di Console
- [ ] Logout berfungsi dan redirect ke `/auth`

---

## 💡 Tips

1. **Selalu check Console** - 90% masalah terlihat di console
2. **Use Debug Dashboard** - Untuk quick diagnosis
3. **Clear cache** - Jika ada perubahan code
4. **Check backend** - Pastikan API running
5. **Check credentials** - Username dan password benar

---

## 📞 Debug Info Template

Jika masih bermasalah, collect info ini:

```
Browser: (Chrome/Firefox/etc)
Console Errors: (screenshot)
Network Tab: (screenshot /api/auth/login response)
LocalStorage: (paste localStorage.getItem('user'))
Current Route: (paste window.location.pathname)
Backend Status: (paste curl http://localhost:5000/health)
```
