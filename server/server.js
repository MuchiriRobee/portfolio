require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Initialize database (wrapped in async function)
async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create initial admin user if none exists
    const { rows } = await pool.query('SELECT * FROM admin_users LIMIT 1');
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, 10);
      await pool.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        [process.env.ADMIN_USERNAME || 'admin', hashedPassword]
      );
      console.log('Initial admin user created');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE id = $1', [decoded.userId]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Routes
app.post('/messages', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate input
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
      }
  
      const result = await pool.query(
        'INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, subject, message]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/messages', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read
app.put('/messages/:id/read', authenticate, async (req, res) => {
    try {
        await pool.query(
            'UPDATE messages SET read = true WHERE id = $1',
            [req.params.id]
        );
        res.json({ message: 'Message marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete single message
app.delete('/messages/:id', authenticate, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM messages WHERE id = $1',
            [req.params.id]
        );
        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Auto-delete old messages (older than 2 weeks)
app.delete('/messages/cleanup', authenticate, async (req, res) => {
    try {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const result = await pool.query(
            'DELETE FROM messages WHERE timestamp < $1 RETURNING *',
            [twoWeeksAgo]
        );
        
        res.json({ deletedCount: result.rowCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
async function startServer() {
    await initializeDatabase();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  
  startServer().catch(err => {
    console.error('Server startup error:', err);
    process.exit(1);
  });