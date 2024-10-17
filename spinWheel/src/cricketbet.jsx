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
  const [betHistory, setBetHistory] = useState([]);

  const userId = 1; // Replace with actual user ID or fetch from authentication context

  useEffect(() => {
    fetchMatches();
    fetchWalletBalance();
    fetchBetHistory();

    socket.on('matchUpdate', handleMatchUpdate);
    socket.on('matchEnded', handleMatchEnded);

    return () => {
      socket.off('matchUpdate', handleMatchUpdate);
      socket.off('matchEnded', handleMatchEnded);
    };
  }, []);

  const handleMatchUpdate = (updatedMatch) => {
    setMatches(prevMatches => 
      prevMatches.map(match => 
        match.id === updatedMatch.id ? updatedMatch : match
      )
    );
    if (selectedMatch && selectedMatch.id === updatedMatch.id) {
      setSelectedMatch(updatedMatch);
    }
  };

  const handleMatchEnded = ({ matchId, result }) => {
    setMatches(prevMatches => 
      prevMatches.map(match => 
        match.id === matchId ? { ...match, status: 'completed', result } : match
      )
    );
    fetchWalletBalance();
    fetchBetHistory();
  };

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
      const balance = parseFloat(data.wallet);
      setWalletBalance(isNaN(balance) ? 0 : balance);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setError('Failed to load wallet balance. Please try again later.');
      setWalletBalance(0);
    }
  };

  const fetchBetHistory = async () => {
    try {
      const response = await fetch(`http://localhost:3008/bet-history?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch bet history');
      const data = await response.json();
      setBetHistory(data);
    } catch (error) {
      console.error('Error fetching bet history:', error);
      setError('Failed to load bet history. Please try again later.');
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
      fetchBetHistory();
      setBetAmount('');
      setBetType('');
    } catch (error) {
      alert('Error placing bet: ' + error.message);
    }
  };

  const getBetOptions = (match) => [
    { value: `team1_win`, label: `${match.team1} Win`, multiplier: match.team1_win_multiplier },
    { value: `team2_win`, label: `${match.team2} Win`, multiplier: match.team2_win_multiplier },
    { value: 'draw', label: 'Draw', multiplier: match.draw_multiplier }
  ];

  const formatBetType = (betType, match) => {
    switch(betType) {
      case 'team1_win': return `${match.team1} Win`;
      case 'team2_win': return `${match.team2} Win`;
      case 'draw': return 'Draw';
      default: return betType;
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
              {match.status === 'completed' && (
                <p className={styles.matchResult}>
                  Result: {formatBetType(match.result, match)}
                </p>
              )}
            </div>
          ))}
        </section>
        
        {selectedMatch && selectedMatch.status !== 'completed' && !selectedMatch.is_locked && (
          <section className={styles.bettingForm}>
            <h2>Place Bet: {selectedMatch.team1} vs {selectedMatch.team2}</h2>
            <select 
              value={betType} 
              onChange={(e) => setBetType(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Bet Type</option>
              {getBetOptions(selectedMatch).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} (x{option.multiplier})
                </option>
              ))}
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

        <section className={styles.betHistory}>
          <h2>Bet History</h2>
          {betHistory.map(bet => (
            <div key={bet.id} className={styles.betItem}>
              <p>{bet.match_details}</p>
              <p>Bet Type: {formatBetType(bet.bet_type, {team1: bet.match_details.split(' vs ')[0], team2: bet.match_details.split(' vs ')[1].split(' (')[0]})}</p>
              <p>Amount: ${bet.amount}</p>
              <p>Status: {bet.status}</p>
              {bet.status === 'won' && <p>Winnings: ${bet.winnings}</p>}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default CricketBetting;