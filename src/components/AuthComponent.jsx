import React, { useState } from 'react';

import './AuthComponent.css'

const AuthComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [password, setPassword] = useState(null);
  const [error, setError] = useState('');

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleToggleAuth = () => setIsLogin((prev) => !prev);

  const handleAuthSubmit = (e) => {
    e.preventDefault();

    // Simulate authentication success for now
    if (isLogin) {
        const loginData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        }
        fetch("http://localhost:5003/api/auth/login", loginData)
        .then(res => res.json())
        .then(json => {
            if (json.message) {
                setIsAuthenticated(true);
                setIsModalOpen(false);
            } else {
                console.log(json.error)
                setError(json.error);
            }
        })
    }
    else if (!isLogin) {
        const registerData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        }

        fetch('http://localhost:5003/api/auth/register', registerData)
        .then(res => res.json())
        .then(json => {
            if (json.message) {
                setIsAuthenticated(true)
                setIsModalOpen(false)
            }
            else if (json.error) {
                setError(json.error)
            }
        })
    }
  };

  return (
    <div>
      {!isAuthenticated ? (
        <button className='auth-btn' onClick={handleOpenModal}>Sign Up / Login</button>
      ) : (
        <div className="profile-placeholder">
          <span>👤</span>
        </div>
      )}


{isModalOpen && (
        <div className="modal">
          <p>{error}</p>
          <div className="modal-content">
            <button className="close-btn" onClick={handleCloseModal}>
              &times;
            </button>
            <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
            <form onSubmit={handleAuthSubmit}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
            </form>
            <p>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button className="toggle-btn" onClick={handleToggleAuth}>
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthComponent;