import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import io from 'socket.io-client';
import swal from 'sweetalert';

const socket = io('http://localhost:3008'); // Replace with your server URL

// Define the wheel segments and styles
const data = [
  { option: '2x', style: { backgroundColor: 'red', textColor: 'white' } },
  { option: '4x', style: { backgroundColor: 'blue', textColor: 'white' } },
  { option: '5x', style: { backgroundColor: 'green', textColor: 'white' } },
  { option: '7x', style: { backgroundColor: 'yellow', textColor: 'black' } },
  { option: '10x', style: { backgroundColor: 'purple', textColor: 'white' } },
  { option: '20x', style: { backgroundColor: 'orange', textColor: 'black' } },
  { option: '2x', style: { backgroundColor: 'red', textColor: 'white' } },
  { option: '4x', style: { backgroundColor: 'blue', textColor: 'white' } },
  { option: '5x', style: { backgroundColor: 'green', textColor: 'white' } },
  { option: '7x', style: { backgroundColor: 'yellow', textColor: 'black' } },
  { option: '10x', style: { backgroundColor: 'purple', textColor: 'white' } },
  { option: '20x', style: { backgroundColor: 'orange', textColor: 'black' } },
];

const multipliers = [2, 4, 5, 7, 10, 20];

const SpinWheel = () => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [walletAmount, setWalletAmount] = useState(0);
  const [results, setResults] = useState([]);
  const [betAmount, setBetAmount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isBettingEnabled, setIsBettingEnabled] = useState(true);
  const [currentRoundId, setCurrentRoundId] = useState(0);
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    fetchWallet();

    socket.on('newRound', handleNewRound);
    socket.on('roundResult', handleRoundResult);
    socket.on('betResponse', handleBetResponse);

    return () => {
      socket.off('newRound');
      socket.off('roundResult');
      socket.off('betResponse');
    };
  }, []);

  const fetchWallet = () => {
    fetch(`http://localhost:3008/wallet?user_id=${userId}`)
      .then((response) => response.json())
      .then((data) => setWalletAmount(data.wallet))
      .catch((error) => console.error('Error fetching wallet:', error));
  };

  const handleNewRound = (data) => {
    setCurrentRoundId(data.roundId);
    setTimeRemaining(data.timeRemaining);
    setIsBettingEnabled(true);
    setMustSpin(false);
  };

  const handleRoundResult = (data) => {
    const winningIndex = multipliers.indexOf(data.winningMultiplier);
    setPrizeNumber(winningIndex);
    setMustSpin(true);

    const userBet = data.bets.find(bet => bet.user_id === parseInt(userId));
    if (userBet) {
      const won = userBet.bet_multiplier === data.winningMultiplier;
      const winAmount = won ? userBet.bet_amount * data.winningMultiplier : 0;

      swal({
        title: won ? "Congratulations!" : "Better luck next time!",
        text: `Round ${data.roundId} result:
               Winning multiplier: ${data.winningMultiplier}x
               Your bet: ${userBet.bet_amount} coins on ${userBet.bet_multiplier}x
               ${won ? `You won ${winAmount} coins!` : "You lost your bet."}`,
        icon: won ? "success" : "info",
      }).then(() => {
        fetchWallet();
      });
    }

    setResults(prevResults => [
      { roundId: data.roundId, multiplier: data.winningMultiplier },
      ...prevResults.slice(0, 9)
    ]);
  };

  const handleBetResponse = (response) => {
    if (response.success) {
      swal('Bet Placed', `You bet ${betAmount} coins on ${response.multiplier}x`, 'success');
      setBetAmount(0);
      fetchWallet();
    } else {
      swal('Error', response.message, 'error');
    }
  };

  const handleBetClick = (multiplier) => {
    if (isBettingEnabled && betAmount > 0 && walletAmount >= betAmount) {
      socket.emit('placeBet', {
        user_id: userId,
        bet_amount: betAmount,
        multiplier,
      });
    } else {
      swal('Error', 'Invalid bet amount or insufficient balance.', 'error');
    }
  };

  const handleBetAmountChange = (e) => {
    const value = Number(e.target.value);
    if (isBettingEnabled) {
      setBetAmount(value);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wallet}>
        <img
          src="https://img.icons8.com/emoji/48/000000/coin-emoji.png"
          alt="coin"
          style={{ marginRight: '8px' }}
        />
        {walletAmount} Coins
      </div>

      <div style={styles.mainContent}>
        <div style={styles.wheelContainer}>
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={data}
            onStopSpinning={() => setMustSpin(false)}
          />
          <h3 style={{ color: 'white' }}>Time Remaining: {timeRemaining} seconds</h3>

          <div className="bet-amount mt-4 text-center">
            <input
              type="number"
              className="form-control mb-2"
              placeholder="Enter bet amount"
              value={betAmount}
              onChange={handleBetAmountChange}
              disabled={!isBettingEnabled}
            />
          </div>

          <div style={styles.betContainer}>
            {multipliers.map((multiplier, index) => (
              <button
                key={index}
                style={{ ...styles.betButton, opacity: isBettingEnabled ? 1 : 0.5 }}
                onClick={() => handleBetClick(multiplier)}
                disabled={!isBettingEnabled}
              >
                Bet {multiplier}x
              </button>
            ))}
          </div>
        </div>

        <div style={styles.resultsContainer}>
          <h3>Results</h3>
          <ul style={styles.resultsList}>
            {results.map((result, index) => (
              <li key={index} style={styles.resultItem}>
                Round {result.roundId}: {result.multiplier}x
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Styles for the component
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, black, #203a43, #219EBC)',
    height: '100vh',
    padding: '20px',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
  },
  wallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5em',
    marginBottom: '20px',
  },
  mainContent: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '1200px',
  },
  wheelContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  betContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '20px',
  },
  betButton: {
    padding: '10px 20px',
    margin: '5px',
    fontSize: '16px',
    borderRadius: '8px',
    color: '#fff',
    backgroundColor: '#219EBC',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0px 4px 15px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  resultsContainer: {
    padding: '20px',
    background: '#333',
    borderRadius: '12px',
    boxShadow: '0px 4px 15px rgba(0,0,0,0.2)',
  },
  resultsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  resultItem: {
    marginBottom: '8px',
  },
};

// Styles remain the same as in your original code

export default SpinWheel;