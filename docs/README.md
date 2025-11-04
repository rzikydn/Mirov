# Documentation

This folder contains all project documentation, API references, and guides.

## Files

### API Documentation
- **API.http** - REST Client file with all API endpoint examples
- **TEST-API.md** - API testing guide and instructions

### User & Database
- **KREDENSIAL-USER.md** - Default user credentials for testing
- **update-roles.sql** - SQL script to update user roles directly

### Troubleshooting
- **TROUBLESHOOTING.md** - Common issues and solutions

## Quick Reference

### Default Users (from KREDENSIAL-USER.md)

| Role       | Email           | Password      |
|------------|-----------------|---------------|
| SUPERUSER  | superusermirov  | superuser123  |
| ADMIN      | adminmirov      | admin123      |
| UMUM       | usermirov       | user123       |

### Testing API (API.http)

Use REST Client extension in VS Code to test endpoints directly:

1. Install REST Client extension
2. Open `API.http`
3. Click "Send Request" above each request
4. View responses inline

### Common Issues

See TROUBLESHOOTING.md for:
- Database connection errors
- Authentication failures
- CORS issues
- Rate limiting problems
