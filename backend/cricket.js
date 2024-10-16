const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());

// Database connection pool
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'spin_wheel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Socket connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Get all matches
app.get('/matches', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cricket_matches ORDER BY match_time DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Place a bet
app.post('/place-bet', async (req, res) => {
  const { userId, matchId, betType, amount } = req.body;
  
  try {
    // Check if the match is locked
    const [matchRows] = await db.query('SELECT is_locked, ?? as multiplier FROM cricket_matches WHERE id = ?', 
      [`${betType}_multiplier`, matchId]);
    
    if (matchRows.length === 0 || matchRows[0].is_locked) {
      return res.status(400).json({ message: 'Betting is not allowed for this match' });
    }

    const multiplier = matchRows[0].multiplier;

    // Check user's wallet balance
    const [userRows] = await db.query('SELECT wallet FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0 || userRows[0].wallet < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    // Deduct amount from user's wallet
    await db.query('UPDATE users SET wallet = wallet - ? WHERE id = ?', [amount, userId]);

    // Place the bet
    await db.query('INSERT INTO cricket_bets (user_id, match_id, bet_type, amount, multiplier) VALUES (?, ?, ?, ?, ?)',
      [userId, matchId, betType, amount, multiplier]);

    // Commit transaction
    await db.query('COMMIT');

    res.json({ message: 'Bet placed successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error placing bet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/wallet', async (req, res) => {
    const { user_id } = req.query;
    try {
      const [users] = await db.query('SELECT wallet FROM users WHERE id = ?', [user_id]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ wallet: users[0].wallet });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ message: 'Error fetching wallet balance' });
    }
  });

// More endpoints for user management, fetching bet history, etc.

const PORT = process.env.PORT || 3008;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});