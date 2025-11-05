@echo off
REM Force Update Railway Production Users
REM This script sets the public DATABASE_URL and runs the FORCE update script

echo ========================================
echo Railway Production FORCE Update Script
echo ========================================
echo.
echo This will update users in Railway production database!
echo.

set "DATABASE_URL=postgresql://postgres:NkwysbhcnccGWUerJtFjORHpmLGjCuKY@ballast.proxy.rlwy.net:49112/railway"

echo DATABASE_URL set to Railway public proxy
echo Connection: ballast.proxy.rlwy.net:49112
echo.
echo Running FORCE update script...
echo.

npx ts-node scripts/force-update-railway-users.ts

echo.
echo ========================================
echo Script completed!
echo ========================================
echo.
echo Now refresh Railway Dashboard and check the users table!
echo Then try login at: https://mirov.vercel.app/auth
echo.
pause
