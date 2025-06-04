-- Create database if not exists
CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users (password: admin123 -> MD5 hashed)
-- MD5 hash of 'admin123' = '0192023a7bbd73250516f069df18b500'
INSERT IGNORE INTO users (username, password, email) VALUES 
('admin', '0192023a7bbd73250516f069df18b500', 'admin@example.com'),
('user1', '0192023a7bbd73250516f069df18b500', 'user1@example.com'),
('testuser', '0192023a7bbd73250516f069df18b500', 'test@example.com');

-- Verify data
SELECT 'Users created:' as status;
SELECT username, email, created_at FROM users;