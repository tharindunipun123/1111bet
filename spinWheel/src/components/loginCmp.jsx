import React from 'react';
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const username = document.getElementById('usernameField').value;
    const password = document.getElementById('passwordField').value;

    const formData = { username, password };

    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.id) {
          swal({
            title: 'Congrats!',
            text: 'Login Successful',
            icon: 'success',
            button: 'Proceed!',
          }).then(() => {
            localStorage.setItem('user_id', data.id); // Save user_id instead of token
            localStorage.setItem('wallet', data.wallet); // Optionally store the wallet balance
            navigate('/spinwheel'); // Redirect to spinwheel page
          });
        } else {
          swal({
            title: 'Login Failed',
            text: 'Incorrect credentials, please try again.',
            icon: 'error',
            button: 'Try again!',
          });
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        swal({
          title: 'Error',
          text: 'Something went wrong!',
          icon: 'error',
          button: 'Try again!',
        });
      });
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
        <h3 className="text-center mb-4">Login</h3>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="usernameField" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="usernameField"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="passwordField" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="passwordField"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
