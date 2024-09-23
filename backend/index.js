const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'spin_wheel_db'
});

// Global variables to track current round and bets
let bets = [];
let currentRoundId = 0;

// Helper function to spin the wheel
const spinWheel = () => {
  if (bets.length > 0) {
    const winning_multiplier = Math.min(...bets.map(b => b.bet_multiplier));
    
    db.execute('UPDATE rounds SET winning_multiplier = ? WHERE id = ?', [winning_multiplier, currentRoundId], (error) => {
      if (error) {
        console.log('Error updating round with winning multiplier', error);
        return;
      }
      
      bets.forEach(bet => {
        const payout = bet.bet_multiplier === winning_multiplier ? bet.bet_amount * winning_multiplier : 0;
        
        db.execute('UPDATE users SET wallet = wallet + ? WHERE id = ?', [payout, bet.user_id]);
        
        db.execute('INSERT INTO bet_history (user_id, round_id, winning_multiplier, payout) VALUES (?, ?, ?, ?)', 
          [bet.user_id, currentRoundId, winning_multiplier, payout]);
      });

      // Reset bets for the next round
      bets = [];
      console.log(`Round ${currentRoundId} completed. Winning multiplier: ${winning_multiplier}`);
    });
    
    // Increment round ID for the next round
    currentRoundId++;
    
    // Create a new round
    db.execute('INSERT INTO rounds (round_time) VALUES (NOW())', (err, result) => {
      if (err) console.log('Error creating new round', err);
      else currentRoundId = result.insertId;
    });
  }
};

// Automatically spin the wheel every minute
setInterval(() => {
  console.log('Spinning the wheel...');
  spinWheel();
}, 60000); // 1 minute interval

// Start the first round when the server starts
db.execute('INSERT INTO rounds (round_time) VALUES (NOW())', (err, result) => {
  if (err) console.log('Error creating initial round', err);
  else currentRoundId = result.insertId;
});

// Register endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).send('Server error');
    db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], (error) => {
      if (error) return res.status(400).send('User already exists');
      res.status(201).send('User registered');
    });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.execute('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error || results.length === 0) return res.status(400).send('Invalid credentials');
    const user = results[0];
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (!isMatch) return res.status(400).send('Invalid credentials');
      res.json({ id: user.id, wallet: user.wallet });
    });
  });
});

// Place a bet endpoint (no token required)
app.post('/bet', (req, res) => {
  const { user_id, bet_amount, multiplier } = req.body;
    
  db.execute('SELECT wallet FROM users WHERE id = ?', [user_id], (err, results) => {
    if (err || results.length === 0 || results[0].wallet < bet_amount) {
      return res.status(400).send('Insufficient funds');
    }

    // Deduct the bet amount from the user's wallet
    db.execute('UPDATE users SET wallet = wallet - ? WHERE id = ?', [bet_amount, user_id], (err) => {
      if (err) return res.status(500).send('Error updating wallet');
      
      // Add the bet to the current round
      bets.push({
        user_id,
        bet_amount,
        bet_multiplier: multiplier
      });
      
      res.status(200).send('Bet placed');
    });
  });
});

// Fetch bet history endpoint (no token required)
app.get('/history', (req, res) => {
  const { user_id } = req.query;
  
  db.execute('SELECT * FROM bet_history WHERE user_id = ? ORDER BY id DESC LIMIT 10', [user_id], (error, results) => {
    if (error) return res.status(500).send('Error fetching history');
    res.json(results);
  });
});

// Fetch global winning numbers (last 10 spins)
app.get('/global-history', (req, res) => {
  db.execute('SELECT * FROM rounds ORDER BY round_time DESC LIMIT 10', (error, results) => {
    if (error) return res.status(500).send('Error fetching global history');
    res.json(results);
  });
});

// Get wallet balance endpoint (no token required)
app.get('/wallet', (req, res) => {
  const { user_id } = req.query;
  
  db.execute('SELECT wallet FROM users WHERE id = ?', [user_id], (error, results) => {
    if (error) return res.status(500).send('Error fetching wallet balance');
    res.json({ wallet: results[0].wallet });
  });
});

app.post('/spin', (req, res) => {
    const { user_id } = req.body;
  
    // Determine the winning multiplier based on existing bets or random selection
    let winning_multiplier;
  
    if (bets.length > 0) {
      // Use the lowest multiplier from the current bets as the winner
      winning_multiplier = Math.min(...bets.map(b => b.bet_multiplier));
    } else {
      // If no bets are placed, randomly select a multiplier from possible values
      const multipliers = [2, 5, 10, 20, 30, 50];
      winning_multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
    }
  
    // Update the round in the database with the winning multiplier
    db.execute('UPDATE rounds SET winning_multiplier = ? WHERE id = ?', [winning_multiplier, currentRoundId], (error) => {
      if (error) {
        console.log('Error updating round with winning multiplier', error);
        return res.status(500).json({ message: 'Error updating round' });
      }
  
      if (bets.length > 0) {
        // If there are bets, process the payouts
        bets.forEach(bet => {
          const payout = bet.bet_multiplier === winning_multiplier ? bet.bet_amount * winning_multiplier : 0;
  
          // Update the user's wallet balance
          db.execute('UPDATE users SET wallet = wallet + ? WHERE id = ?', [payout, bet.user_id]);
  
          // Log the bet history
          db.execute('INSERT INTO bet_history (user_id, round_id, winning_multiplier, payout) VALUES (?, ?, ?, ?)',
            [bet.user_id, currentRoundId, winning_multiplier, payout]);
        });
  
        // Clear bets for the next round
        bets = [];
      }
  
      // Return the winning multiplier to the frontend, regardless of whether bets were placed
      return res.status(200).json({ winning_multiplier });
    });
  });
  
  
  // Time remaining for the current spin
app.get('/time-remaining', (req, res) => {
    // Calculate the time remaining for the current round
    const spinDuration = 60000; // 60 seconds in milliseconds
    const currentTime = new Date().getTime();
    
    // Get the time when the last round started
    db.execute('SELECT round_time FROM rounds ORDER BY round_time DESC LIMIT 1', (err, result) => {
      if (err || result.length === 0) {
        return res.status(500).json({ message: 'Error fetching round time' });
      }
  
      const roundStartTime = new Date(result[0].round_time).getTime();
      const timePassed = currentTime - roundStartTime;
      const timeRemaining = Math.max(spinDuration - timePassed, 0); // Remaining time before the next spin
  
      return res.status(200).json({ timeRemaining });
    });
  });
  

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});


  






































// const express = require('express');
// const mysql = require('mysql2');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');
// const app = express();

// app.use(express.json());
// app.use(cors());

// // Database connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'spin_wheel_db'
// });

// // Global variables to track current round and bets
// let bets = [];
// let currentRoundId = 0;

// // Helper function for creating JWT tokens
// const createToken = (user) => {
//   return jwt.sign({ id: user.id, username: user.username }, 'secret', { expiresIn: '1h' });
// };

// // Helper function to spin the wheel
// const spinWheel = () => {
//   if (bets.length > 0) {
//     const winning_multiplier = Math.min(...bets.map(b => b.bet_multiplier));
    
//     db.execute('UPDATE rounds SET winning_multiplier = ? WHERE id = ?', [winning_multiplier, currentRoundId], (error) => {
//       if (error) {
//         console.log('Error updating round with winning multiplier', error);
//         return;
//       }
      
//       bets.forEach(bet => {
//         const payout = bet.bet_multiplier === winning_multiplier ? bet.bet_amount * winning_multiplier : 0;
        
//         db.execute('UPDATE users SET wallet = wallet + ? WHERE id = ?', [payout, bet.user_id]);
        
//         db.execute('INSERT INTO bet_history (user_id, round_id, winning_multiplier, payout) VALUES (?, ?, ?, ?)', 
//           [bet.user_id, currentRoundId, winning_multiplier, payout]);
//       });

//       // Reset bets for the next round
//       bets = [];
//       console.log(`Round ${currentRoundId} completed. Winning multiplier: ${winning_multiplier}`);
//     });
    
//     // Increment round ID for the next round
//     currentRoundId++;
    
//     // Create a new round
//     db.execute('INSERT INTO rounds (round_time) VALUES (NOW())', (err, result) => {
//       if (err) console.log('Error creating new round', err);
//       else currentRoundId = result.insertId;
//     });
//   }
// };

// // Automatically spin the wheel every minute
// setInterval(() => {
//   console.log('Spinning the wheel...');
//   spinWheel();
// }, 60000); // 1 minute interval

// // Start the first round when the server starts
// db.execute('INSERT INTO rounds (round_time) VALUES (NOW())', (err, result) => {
//   if (err) console.log('Error creating initial round', err);
//   else currentRoundId = result.insertId;
// });

// // Register endpoint
// app.post('/register', (req, res) => {
//   const { username, password } = req.body;
//   bcrypt.hash(password, 10, (err, hash) => {
//     if (err) return res.status(500).send('Server error');
//     db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], (error) => {
//       if (error) return res.status(400).send('User already exists');
//       res.status(201).send('User registered');
//     });
//   });
// });

// // Login endpoint
// app.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   db.execute('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
//     if (error || results.length === 0) return res.status(400).send('Invalid credentials');
//     const user = results[0];
//     bcrypt.compare(password, user.password_hash, (err, isMatch) => {
//       if (!isMatch) return res.status(400).send('Invalid credentials');
//       const token = createToken(user);
//       res.json({ token, wallet: user.wallet });
//     });
//   });
// });

// // Place a bet endpoint
// app.post('/bet', (req, res) => {
//   const { token, bet_amount, multiplier } = req.body;
//   try {
//     const decoded = jwt.verify(token, 'secret');
    
//     db.execute('SELECT wallet FROM users WHERE id = ?', [decoded.id], (err, results) => {
//       if (err || results.length === 0 || results[0].wallet < bet_amount) {
//         return res.status(400).send('Insufficient funds');
//       }

//       // Deduct the bet amount from the user's wallet
//       db.execute('UPDATE users SET wallet = wallet - ? WHERE id = ?', [bet_amount, decoded.id], (err) => {
//         if (err) return res.status(500).send('Error updating wallet');
        
//         // Add the bet to the current round
//         bets.push({
//           user_id: decoded.id,
//           bet_amount,
//           bet_multiplier: multiplier
//         });
        
//         res.status(200).send('Bet placed');
//       });
//     });
//   } catch (error) {
//     res.status(400).send('Invalid token');
//   }
// });

// // Fetch bet history endpoint
// app.get('/history', (req, res) => {
//   const { token } = req.query;
//   try {
//     const decoded = jwt.verify(token, 'secret');
    
//     db.execute('SELECT * FROM bet_history WHERE user_id = ? ORDER BY id DESC LIMIT 10', [decoded.id], (error, results) => {
//       if (error) return res.status(500).send('Error fetching history');
//       res.json(results);
//     });
//   } catch (error) {
//     res.status(400).send('Invalid token');
//   }
// });

// // Fetch global winning numbers (last 10 spins)
// app.get('/global-history', (req, res) => {
//   db.execute('SELECT * FROM rounds ORDER BY round_time DESC LIMIT 10', (error, results) => {
//     if (error) return res.status(500).send('Error fetching global history');
//     res.json(results);
//   });
// });

// // Get wallet balance endpoint
// app.get('/wallet', (req, res) => {
//   const { token } = req.query;
//   try {
//     const decoded = jwt.verify(token, 'secret');
//     db.execute('SELECT wallet FROM users WHERE id = ?', [decoded.id], (error, results) => {
//       if (error) return res.status(500).send('Error fetching wallet balance');
//       res.json({ wallet: results[0].wallet });
//     });
//   } catch (error) {
//     res.status(400).send('Invalid token');
//   }
// });

// // Start the server
// app.listen(3000, () => {
//   console.log('Server running on port 3000');
// });


