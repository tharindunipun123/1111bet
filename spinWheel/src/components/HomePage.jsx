import React from 'react';
import './HomePage.css'; // Import the CSS for the component

function HomePage() {
  return (
    <div className="homepage">
      {/* Header Section */}
      <header className="header">
        <div className="logo">
          <img src="" alt="Logo" className="logo-image" />
        </div>
        <nav className="nav">
          <a href="#benefits">Play Live Games</a>
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
          <img src="https://image.freepik.com/free-vector/realistic-3d-spinning-fortune-wheel-lucky-roulette_8829-97.jpg" alt="Slot Machine" />
        </div>
      </section>

       {/* Benefits Section */}
       <section className="benefits">
        <h2>Fun and Win Money</h2>
        <p>
          Contrary to popular belief, Lorem Ipsum is not simply random text.
        </p>
        <div className="benefit-cards">
          <div className="card">
            <img src="https://th.bing.com/th/id/OIP.JMBZpnj_nyzacT-HPyKzegAAAA?w=338&h=338&rs=1&pid=ImgDetMain" alt="Benefit 1" className="card-image" />
            <p>Benefit 1 Description</p>
          </div>
          <div className="card">
            <img src="https://th.bing.com/th/id/OIP.JMBZpnj_nyzacT-HPyKzegAAAA?w=338&h=338&rs=1&pid=ImgDetMain" alt="Benefit 2" className="card-image" />
            <p>Benefit 2 Description</p>
          </div>
          <div className="card">
            <img src="https://th.bing.com/th/id/OIP.JMBZpnj_nyzacT-HPyKzegAAAA?w=338&h=338&rs=1&pid=ImgDetMain" alt="Benefit 3" className="card-image" />
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
