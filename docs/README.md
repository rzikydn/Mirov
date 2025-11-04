# Documentation

This folder contains all project documentation, API references, and guides for the Mirov Internal Management System.

## Files Overview

### 📋 User Management
- **[KREDENSIAL-USER.md](KREDENSIAL-USER.md)** - Complete list of 8 default users with credentials, permissions, and display names

### 🔌 API Documentation
- **[API.http](API.http)** - REST Client file with all API endpoint examples (use with VS Code REST Client extension)
- **[TEST-API.md](TEST-API.md)** - Comprehensive API testing guide with curl examples

### 🛠️ Database & Setup
- **[update-roles.sql](update-roles.sql)** - SQL script to manually update user roles in database

### 🐛 Troubleshooting
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues, solutions, and debugging tips

## Quick Reference

### 1. Default Users (8 Total)

#### SUPERUSER (3 users)
| Name    | Username     | Password    |
|---------|--------------|-------------|
| Taufan  | usertaufan   | taufan123   |
| Hans    | userhans     | hans123     |
| Jelly   | userjelly    | jelly123    |

#### ADMIN (4 users)
| Name    | Username       | Password     |
|---------|----------------|--------------|
| Agung   | adminagung     | agung123     |
| Amin    | adminamin      | amin123      |
| Syaiful | adminsyaiful   | syaiful123   |
| Dea     | admindea       | dea123       |

#### UMUM (1 user)
| Name | Username   | Password |
|------|------------|----------|
| Alfi | umumalfi   | alfi123  |

See [KREDENSIAL-USER.md](KREDENSIAL-USER.md) for complete details.

### 2. Testing API

#### Option A: VS Code REST Client (Recommended)
1. Install [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
2. Open [API.http](API.http)
3. Click "Send Request" above each request
4. View responses inline

#### Option B: curl Commands
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usertaufan","password":"taufan123"}'

# Get schedules (with token)
curl http://localhost:5000/api/schedules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

See [TEST-API.md](TEST-API.md) for complete API documentation.

### 3. Permissions Matrix

| Feature | SUPERUSER | ADMIN | UMUM |
|---------|:---------:|:-----:|:----:|
| View Schedules | ✅ | ✅ | ✅ |
| Create Schedule | ✅ | ✅ | ❌ |
| Edit Schedule | ✅ | ✅ | ❌ |
| Delete Schedule | ✅ | ✅ | ❌ |
| View History | ✅ | ✅ | ❌ |
| Delete History | ✅ | ✅ | ❌ |
| Update Roles | ✅ | ❌ | ❌ |

### 4. Common Issues

Quick fixes for common problems:

#### "No token provided"
- Make sure you're logged in
- Check Authorization header format: `Bearer <token>`

#### "Too many requests"
- Wait 15 minutes or restart server
- Rate limit: 20 login attempts per 15 minutes

#### Database connection error
- Check PostgreSQL is running
- Verify DATABASE_URL in server/.env

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

## Security Notes

### Rate Limiting
- **Auth endpoints**: 20 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per IP
- Designed for office environment with shared IP address

### Password Security
- All passwords hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 7 days
- Strong JWT secret (64-char hex) required in production

### HTTPS Required in Production
- Always use HTTPS in production
- Update CLIENT_URL and API_URL accordingly
- Enable HSTS headers (already configured)

## Additional Resources

### Backend Documentation
- [server/README.md](../server/README.md) - Backend API structure & development guide
- [server/src/README.md](../server/src/README.md) - Source code documentation

### Frontend Documentation
- [src/README.md](../src/README.md) - Frontend component structure

### Main Documentation
- [README.md](../README.md) - Main project documentation

## Need Help?

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) first
2. Search existing issues in repository
3. Contact IT team or create new issue

---

Last updated: 2025-11-04
