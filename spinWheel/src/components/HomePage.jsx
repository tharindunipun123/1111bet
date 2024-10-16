import React from 'react';
import './HomePage.css'; // Import the CSS for the component
import { useNavigate } from 'react-router-dom';
function HomePage() {

  const navigate = useNavigate(); // Declare the navigate function

  const handleNavigate = () => {
    navigate('/spinwheel'); // Navigate to the SpinWheel game route
  };
  const handleNavigate1 = () => {
    navigate('/lucky'); // Navigate to the SpinWheel game route
  };
  const handleNavigate2 = () => {
    navigate('/cricket'); // Navigate to the SpinWheel game route
  };


  return (
    <div className="homepage">
      {/* Header Section */}
      <header className="header">
        <div className="logo">
          <img src="" alt="Logo" className="logo-image" />
        </div>
        <nav className="nav">
          <a href="http://localhost:5173/cricket">Play Live Games</a>
          <a href="#about">About Us</a>
          <a href="#shop">Wallet</a>
          <button className="play-now">Account</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Earn Money While You Play</h1>
          <p>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature.
          </p>
        </div>
        <div className="hero-image">
          <img src=""  />
        </div>
      </section>

<section className="benefits" id="benefits">
  <h2>Fun and Win Money</h2>
  <p>Contrary to popular belief, Lorem Ipsum is not simply random text.</p>
  <div className="benefit-cards">
    <div className="card" onClick={handleNavigate}>
      <img
        src="https://th.bing.com/th/id/OIP.JMBZpnj_nyzacT-HPyKzegAAAA?w=338&h=338&rs=1&pid=ImgDetMain"
        alt="Benefit 1"
        className="card-image"
      />
      <p>Spin Wheeel Game </p>
    </div>
    <div className="card" onClick={handleNavigate1}>
      <img
        src="https://th.bing.com/th/id/OIP.JMBZpnj_nyzacT-HPyKzegAAAA?w=338&h=338&rs=1&pid=ImgDetMain"
        alt="Benefit 2"
        className="card-image"
      />
      <p>Lucky Number Game</p>
    </div>
    <div className="card">
      <img
        src="https://th.bing.com/th/id/OIP.JMBZpnj_nyzacT-HPyKzegAAAA?w=338&h=338&rs=1&pid=ImgDetMain"
        alt="Benefit 3"
        className="card-image"
      />
      <p>Benefit 3 Description</p>
    </div>
  </div>
</section>

    
      {/* Footer Section
      <footer className="footer">
        <div className="footer-logo">LoGo</div>
        <div className="footer-links">
          <a href="#learn-more">Learn More</a>
          <a href="#contact-us">Contact Us</a>
        </div>
        <div className="footer-contact">
          <p>Hotel Reservation: 123-456-7890</p>
          <p>Ticket Office: 123-456-7890</p>
        </div>
        <p>&copy; 2024 | All Rights Reserved</p>
      </footer> */}
    </div>
  );
}

export default HomePage;
