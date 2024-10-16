import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styles from './CricketBetting.module.css';

const socket = io('http://localhost:3008');

const CricketBetting = () => {
  const [matches, setMatches] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [betType, setBetType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = 1; // Replace with actual user ID or fetch from authentication context

  useEffect(() => {
    fetchMatches();
    fetchWalletBalance();

    socket.on('matchUpdate', (updatedMatch) => {
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === updatedMatch.id ? updatedMatch : match
        )
      );
    });

    return () => {
      socket.off('matchUpdate');
    };
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3008/matches');
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(`http://localhost:3008/wallet?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch wallet balance');
      const data = await response.json();
      // Ensure the wallet balance is a number
      const balance = parseFloat(data.wallet);
      setWalletBalance(isNaN(balance) ? 0 : balance);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setError('Failed to load wallet balance. Please try again later.');
      setWalletBalance(0);
    }
  };

  const handlePlaceBet = async () => {
    try {
      const response = await fetch('http://localhost:3008/place-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          matchId: selectedMatch.id,
          betType,
          amount: parseFloat(betAmount)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place bet');
      }

      alert('Bet placed successfully!');
      fetchWalletBalance();
      setBetAmount('');
      setBetType('');
    } catch (error) {
      alert('Error placing bet: ' + error.message);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.cricketBetting}>
      <header className={styles.header}>
        <h1>Cricket Betting</h1>
        <div className={styles.walletBalance}>
          Balance: ${typeof walletBalance === 'number' ? walletBalance.toFixed(2) : 'N/A'}
        </div>
      </header>
      
      <main className={styles.main}>
        <section className={styles.matchList}>
          <h2>Upcoming Matches</h2>
          {matches.map(match => (
            <div 
              key={match.id} 
              className={`${styles.matchItem} ${selectedMatch?.id === match.id ? styles.selected : ''}`} 
              onClick={() => setSelectedMatch(match)}
            >
              <h3>{match.team1} vs {match.team2}</h3>
              <p>Time: {new Date(match.match_time).toLocaleString()}</p>
              <p className={styles.matchStatus}>Status: {match.status}</p>
            </div>
          ))}
        </section>
        
        {selectedMatch && (
          <section className={styles.bettingForm}>
            <h2>Place Bet: {selectedMatch.team1} vs {selectedMatch.team2}</h2>
            <select 
              value={betType} 
              onChange={(e) => setBetType(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Bet Type</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="draw">Draw</option>
            </select>
            <input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet Amount"
              className={styles.input}
            />
            <button 
              onClick={handlePlaceBet} 
              disabled={!betType || !betAmount || isNaN(parseFloat(betAmount))}
              className={styles.button}
            >
              Place Bet
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default CricketBetting;