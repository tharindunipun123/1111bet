import { useState, useRef } from 'react';
import Swal from 'sweetalert2';

const DiceBettingGame = () => {
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState([]);
  const diceRef = useRef(null);
  const userId = localStorage.getItem('user_id');
  
  // Betting states
  const [rangeBet, setRangeBet] = useState({ type: '', amount: '' });
  const [numberBets, setNumberBets] = useState({
    '3': '',
    '6': '',
    '9': '',
    '12': '',
    '15': '',
    '18': ''
  });
  const [balance, setBalance] = useState(0);
  const [lastWin, setLastWin] = useState(null);

  // Map target numbers to final rotations
  const rotationMap = {
    '3': [0, 0, 0],           // Front face
    '6': [0, -90, 0],         // Right face -> rotate to front
    '9': [0, 180, 0],         // Back face -> rotate to front
    '12': [0, 90, 0],         // Left face -> rotate to front
    '15': [90, 0, 0],         // Top face -> rotate to front
    '18': [-90, 0, 0]         // Bottom face -> rotate to front
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '1rem auto',
      padding: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      borderRadius: '20px',
      backgroundColor: 'white',
      background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
      '@media (max-width: 768px)': {
        padding: '15px',
        margin: '0.5rem',
      },
    },
    gameSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px',
    },
    diceContainer: {
      width: '200px',
      height: '200px',
      perspective: '1200px',
      position: 'relative',
      margin: '2rem auto',
      '@media (max-width: 768px)': {
        width: '150px',
        height: '150px',
      },
    },
    dice: {
      width: '100%',
      height: '100%',
      position: 'relative',
      transformStyle: 'preserve-3d',
      transition: 'transform 0.5s ease-out',
      cursor: 'pointer',
      transform: 'rotateX(-25deg) rotateY(-25deg)',
    },
    face: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(145deg, #ff4444, #cc0000)',
      border: '2px solid rgba(255,255,255,0.2)',
      borderRadius: '24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '48px',
      fontWeight: 'bold',
      color: 'white',
      userSelect: 'none',
      backfaceVisibility: 'hidden',
      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2), 0 0 10px rgba(0,0,0,0.3)',
      '@media (max-width: 768px)': {
        fontSize: '36px',
        borderRadius: '16px',
      },
    },
    bettingSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      margin: '20px 0',
      padding: '20px',
      borderRadius: '10px',
      backgroundColor: 'rgba(255,255,255,0.5)',
      '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr',
        padding: '15px',
        gap: '15px',
      },
    },
    numberBettingGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
      '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr',
      },
    },
    input: {
      width: '100%',
      height: '42px',
      borderRadius: '10px',
      border: '2px solid #e1e1e1',
      fontSize: '16px',
      textAlign: 'center',
      marginBottom: '10px',
      padding: '0 10px',
      transition: 'border-color 0.3s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#007bff',
      },
    },
    button: {
      width: '200px',
      height: '48px',
      marginTop: '30px',
      fontSize: '18px',
      fontWeight: 'bold',
      borderRadius: '24px',
      border: 'none',
      background: 'linear-gradient(145deg, #007bff, #0056b3)',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(0,123,255,0.4)',
      },
      '@media (max-width: 768px)': {
        width: '180px',
        height: '44px',
        fontSize: '16px',
      },
    },
    balanceDisplay: {
      fontSize: '24px',
      textAlign: 'center',
      marginBottom: '25px',
      padding: '15px',
      borderRadius: '15px',
      backgroundColor: '#f8f9fa',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      '@media (max-width: 768px)': {
        fontSize: '20px',
        padding: '12px',
      },
    },
    history: {
      marginTop: '30px',
      padding: '20px',
      borderRadius: '15px',
      background: '#f8f9fa',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      '@media (max-width: 768px)': {
        padding: '15px',
      },
    },
    title: {
      textAlign: 'center',
      color: '#2c3e50',
      marginBottom: '25px',
      fontSize: '32px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      '@media (max-width: 768px)': {
        fontSize: '24px',
        marginBottom: '20px',
      },
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#666',
    },
  };

  // const fetchWallet = async () => {
  //   try {
  //     const response = await fetch(`http://localhost:3008/wallet?user_id=${userId}`);
  //     const data = await response.json();
  //     if (data.wallet !== undefined) {
  //       setBalance(data.wallet);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching wallet:', error);
  //   }
  // };

  // useEffect(() => {
  //   // Initial fetch
  //   fetchWallet();
    
  //   // Set up interval for periodic fetching
  //   const intervalId = setInterval(fetchWallet, 1000);
    
  //   // Cleanup interval on component unmount
  //   return () => clearInterval(intervalId);
  // }, []); // Emp

   
  const determineWinningNumber = () => {
    const numbers = [3, 6, 9, 12, 15, 18];
    const totalBetAmounts = {};
    let hasRangeBet = false;
    
    // Get numbers that have bets placed on them
    const bettedNumbers = numbers.filter(num => Number(numberBets[num]) > 0);
    
    // If range bet exists, handle that first
    if (rangeBet.type && rangeBet.amount) {
      hasRangeBet = true;
      // If range bet exists, choose number from opposite range
      if (rangeBet.type === 'lower') {
        return numbers[Math.floor(Math.random() * 3) + 3]; // 12, 15, or 18
      } else {
        return numbers[Math.floor(Math.random() * 3)]; // 3, 6, or 9
      }
    }

    // If only number bets exist
    if (bettedNumbers.length > 0) {
      // Get available numbers (numbers not bet on)
      const availableNumbers = numbers.filter(num => !bettedNumbers.includes(num));
      
      // If all numbers are bet on, use the least bet amount logic
      if (availableNumbers.length === 0) {
        numbers.forEach(num => {
          const betAmount = Number(numberBets[num]) || 0;
          totalBetAmounts[num] = betAmount * 2.5;
        });
        
        const lowestPayout = Math.min(...Object.values(totalBetAmounts).filter(amount => amount > 0));
        const possibleNumbers = numbers.filter(num => totalBetAmounts[num] === lowestPayout);
        return possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
      }
      
      // If there are available numbers, randomly select one of them
      return availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    }

    // If no bets at all, return random number
    return numbers[Math.floor(Math.random() * numbers.length)];
};

const processWinnings = (rolledNumber) => {
  let winnings = 0;
  let message = '';

  // Process range bet
  if (rangeBet.amount && rangeBet.type) {
    const isLower = rangeBet.type === 'lower';
    const won = (isLower && rolledNumber <= 9) || (!isLower && rolledNumber > 9);
    if (won) {
      const rangeWin = Number(rangeBet.amount) * 1.8;
      winnings += rangeWin;
      message += `Range bet won: +$${rangeWin.toFixed(2)}! `;
    }
  }

  // Process number bets
  const numberBetAmount = Number(numberBets[rolledNumber]) || 0;
  if (numberBetAmount > 0) {
    const numberWin = numberBetAmount * 2.5;
    winnings += numberWin;
    message += `Number bet won: +$${numberWin.toFixed(2)}! `;
  }

  // Calculate total bet amount
  const totalBet = Object.values(numberBets).reduce((sum, bet) => sum + Number(bet || 0), 0) + 
                  Number(rangeBet.amount || 0);              
         
                  
            
  // Update balance
  // setBalance(prev => prev + winnings - totalBet);

  fetch('http://localhost:3008/dicewin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      winnings
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message === 'Record placed successfully') {

       console.log("wallet updated succesffuly")
        fetchWallet(); // Update wallet after placing bet
        betInput.value = ''; // Clear bet input
      } else {
        console.log('Error', 'Failed to place bet.', 'error');
      }
    })
    .catch((error) => {
      console.error('Error placing bet:', error);
      console.log('Error', 'An error occurred.', 'error');
    });
  

  if (winnings > 0) {
    Swal.fire({
      title: `Winning Number: ${rolledNumber}`,
      html: `<div style="margin-bottom: 15px">Congratulations!</div><div>${message}</div>`,
      icon: 'success'
    });
  } else {
    Swal.fire({
      title: `Winning Number: ${rolledNumber}`,
      html: `<div style="margin-bottom: 15px">Better luck next time!</div><div>You lost $${totalBet.toFixed(2)}</div>`,
      icon: 'info'
    });
  }

  // Reset bets
  setRangeBet({ type: '', amount: '' });
  setNumberBets({
    '3': '',
    '6': '',
    '9': '',
    '12': '',
    '15': '',
    '18': ''
  });
};

  const handleNumberBetChange = (number, value) => {
    // Validate based on range selection
    if (rangeBet.type === 'lower' && number > 9) {
      Swal.fire({
        title: 'Invalid Bet',
        text: 'You can only bet on numbers 3, 6, 9 when lower range is selected',
        icon: 'error'
      });
      return;
    }
    if (rangeBet.type === 'higher' && number <= 9) {
      Swal.fire({
        title: 'Invalid Bet',
        text: 'You can only bet on numbers 12, 15, 18 when higher range is selected',
        icon: 'error'
      });
      return;
    }

    setNumberBets(prev => ({
      ...prev,
      [number]: value
    }));
  };

  const rollDice = () => {
    if (isRolling) return;

    // Calculate total bet amount
    const totalBet = Object.values(numberBets).reduce((sum, bet) => sum + Number(bet || 0), 0) + 
                    Number(rangeBet.amount || 0);

    if (totalBet === 0) {
      Swal.fire({
        title: 'No Bets Placed',
        text: 'Please place at least one bet!',
        icon: 'warning'
      });
      return;
    }
 
    fetch('http://localhost:3008/dicebet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        totalBet
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Bet placed successfully') {

          swal('Bet Placed!', `You have bet ${betAmount} LKR on ${multiplier}.`, 'success');
          fetchWallet(); // Update wallet after placing bet
          betInput.value = ''; // Clear bet input
        } else {
          swal('Error', 'Failed to place bet.', 'error');
          return;
        }
      })
      .catch((error) => {
        console.error('Error placing bet:', error);
        swal('Error', 'An error occurred.', 'error');
        return;
      });

    // if (totalBet > balance) {
    //   Swal.fire({
    //     title: 'Insufficient Balance',
    //     text: 'You don\'t have enough balance for these bets!',
    //     icon: 'error'
    //   });
    //   return;
    // }

    setIsRolling(true);
    const winningNumber = determineWinningNumber();

    const randomRotation = () => {
      const dice = diceRef.current;
      if (!dice) return;
      dice.style.transition = 'transform 0.1s linear';
      const randomX = Math.random() * 360;
      const randomY = Math.random() * 360;
      const randomZ = Math.random() * 360;
      dice.style.transform = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;
    };

    let rotations = 0;
  const rotationInterval = setInterval(() => {
    randomRotation();
    rotations++;
    if (rotations >= 20) {
      clearInterval(rotationInterval);
      const finalRotation = rotationMap[winningNumber.toString()];
      const dice = diceRef.current;
      if (dice) {
        dice.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)'; // Smoother easing
        // Final rotation makes winning number face front
        dice.style.transform = `rotateX(${finalRotation[0]}deg) rotateY(${finalRotation[1]}deg) rotateZ(${finalRotation[2]}deg)`;
      }
      
      setHistory(prev => [{
        number: winningNumber,
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 5));
      
      processWinnings(winningNumber);
      setTimeout(() => setIsRolling(false), 800); // Increased timeout to match new transition duration
    }
  }, 100);
};

  return (
   <div style={styles.container}>
    <h2 style={styles.title}>Dice Betting Game</h2>
    
    <div style={styles.balanceDisplay}>
      Balance: ${balance.toFixed(2)}
    </div>

    <div style={styles.bettingSection}>
      <div>
        <h3 style={{ marginBottom: '15px' }}>Range Betting</h3>
        <select 
          style={styles.input} 
          value={rangeBet.type}
          onChange={(e) => setRangeBet(prev => ({ ...prev, type: e.target.value }))}
        >
          <option value="">Select Range</option>
          <option value="lower">Lower (3-9)</option>
          <option value="higher">Higher (12-18)</option>
        </select>
        <input
          type="number"
          style={styles.input}
          placeholder="Bet Amount"
          value={rangeBet.amount}
          onChange={(e) => setRangeBet(prev => ({ ...prev, amount: e.target.value }))}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '15px' }}>Number Betting</h3>
        <div style={styles.numberBettingGrid}>
          {[3, 6, 9, 12, 15, 18].map(number => (
            <div key={number}>
              <label style={styles.label}>Number {number}</label>
              <input
                type="number"
                style={styles.input}
                placeholder={`Bet on ${number}`}
                value={numberBets[number]}
                onChange={(e) => handleNumberBetChange(number, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={styles.gameSection}>
      <div style={styles.diceContainer}>
        <div ref={diceRef} style={{
          ...styles.dice,
          transform: isRolling ? undefined : 'rotateX(-25deg) rotateY(-25deg)',
        }}>
          <div style={{...styles.face, transform: 'translateZ(100px)'}}><span>3</span></div>
          <div style={{...styles.face, transform: 'rotateY(180deg) translateZ(100px)'}}><span>9</span></div>
          <div style={{...styles.face, transform: 'rotateY(90deg) translateZ(100px)'}}><span>6</span></div>
          <div style={{...styles.face, transform: 'rotateY(-90deg) translateZ(100px)'}}><span>12</span></div>
          <div style={{...styles.face, transform: 'rotateX(90deg) translateZ(100px)'}}><span>15</span></div>
          <div style={{...styles.face, transform: 'rotateX(-90deg) translateZ(100px)'}}><span>18</span></div>
        </div>
      </div>

      <button
        style={{
          ...styles.button,
          opacity: isRolling ? 0.7 : 1,
          transform: isRolling ? 'scale(0.98)' : 'scale(1)',
        }}
        onClick={rollDice}
        disabled={isRolling}
      >
        {isRolling ? 'Rolling...' : 'Roll Dice'}
      </button>
    </div>

    {/* {history.length > 0 && (
      <div style={styles.history}>
        <h3 style={{ marginBottom: '15px' }}>Roll History</h3>
        {history.map((roll, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}>
            <span>Rolled: {roll.number}</span>
            <span>{roll.time}</span>
          </div>
        ))}
      </div>
    )} */}
  </div>
  );
};

export default DiceBettingGame;