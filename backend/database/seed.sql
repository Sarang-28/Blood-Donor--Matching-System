-- Default Super Admin Seed
-- Email: admin@bloodmatch.org
-- Password: Admin@123456
INSERT INTO users (id, email, password_hash, role, phone, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@bloodmatch.org',
    '$2b$10$WZm6p0BJfiY3cyByF0P2seJvamaTXz8GtG1PT3cGdJ64SnJmG4DMC', -- bcrypt hash for Admin@123456
    'admin',
    '+919999999999',
    TRUE
)
ON CONFLICT (email) DO NOTHING;
