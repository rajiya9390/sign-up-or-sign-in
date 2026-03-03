const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const pool = require('./db');
const verifyToken = require('./authMiddleware');
require('dotenv').config();

console.log('--- Environment Check ---');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('-------------------------');

const app = express();
app.use(express.json());
app.use(cors());

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Register Endpoint
app.post('/register', async (req, res) => {
    const { full_name, username, email, mobile_number, password } = req.body;
    console.log('Register attempt:', { username, email });

    if (!full_name || !username || !email || !password) {
        return res.status(400).json({ message: "Please fill all required fields." });
    }

    try {
        const [existingUser] = await pool.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Username or Email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (full_name, username, email, mobile_number, password) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, email, mobile_number, hashedPassword]
        );

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error('Error in /register:', err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // Changed 'username' to 'identifier'
    console.log('Login attempt:', identifier);

    if (!identifier || !password) {
        return res.status(400).json({ message: "Please provide both Email/Username and Password." });
    }

    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier]);
        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Invalid username or password." });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, full_name: user.full_name, username: user.username }
        });
    } catch (err) {
        console.error('Error in /login:', err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Protected Landing Page Endpoint
app.get('/landing', verifyToken, (req, res) => {
    res.json({ message: `Welcome to the protected landing page, ${req.user.username}!` });
});

// Logout
app.post('/logout', (req, res) => {
    res.json({ message: "Logged out successfully." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
