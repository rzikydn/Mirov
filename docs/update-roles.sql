-- Update user roles for production database
UPDATE users SET role = 'SUPERUSER' WHERE email = 'superusermirov';
UPDATE users SET role = 'ADMIN' WHERE email = 'adminmirov';

-- Verify changes
SELECT id, name, email, role FROM users ORDER BY id;
