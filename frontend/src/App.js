import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

/**
 * Handles Spotify OAuth callback by extracting the auth code,
 * sending it to the backend, and redirecting the user to the homepage.
 */
function CallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // Send the code to the backend to complete authentication
      fetch(`https://monthlywrap.onrender.com/callback?code=${code}`, {
        method: 'GET',
        credentials: 'include',
      })
      .then(response => response.json())
      .then(data => {
        console.log("Auth Success:", data);
        navigate('/'); // Redirect to homepage after successful login
      })
      .catch(error => {
        console.error("Auth Error:", error);
        navigate('/');
      });
    } else {
      navigate('/'); // Redirect home if no code is found
    }
  }, []);

  return <p>Logging in...</p>;
}

/**
 * Main App component that displays the user's monthly top tracks from Spotify.
 * Allows users to select how many tracks to view and applies smooth animations when reloading.
 */
function App() {
  /** State variables */
  const [displayName, setDisplayName] = useState(''); // Stores user's Spotify display name
  const [tracks, setTracks] = useState([]); // Stores top track data
  const [limit, setLimit] = useState(5); // Default number of tracks to display
  const [error, setError] = useState(null); // Stores any errors from API requests
  const [isReloading, setIsReloading] = useState(false); // Tracks whether cards are reloading
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Tracks user login status

  /**
   * Fetches user info from the backend to check login status.
   */
  useEffect(() => {
    fetch('https://monthlywrap.onrender.com/user-info', { credentials: 'include' })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("User not logged in");
        }
      })
      .then(userData => {
        setDisplayName(userData.display_name || 'User');
        setIsLoggedIn(true);
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  /**
   * Fetches user info and top tracks from the backend.
   * Triggers a fade-out effect before loading new data.
   * @param {number} limit - Number of top tracks to fetch (1-10).
   */
  const fetchWrapData = (limit) => {
    setIsReloading(true); // Start fade-out effect

    setTimeout(() => {
      Promise.all([
        fetch('https://monthlywrap.onrender.com/user-info', { credentials: 'include' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`User info HTTP error: ${response.status}`);
            }
            return response.json();
          }),
        fetch(`https://monthlywrap.onrender.com/top-tracks?limit=${limit}`, { credentials: 'include' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Top tracks HTTP error: ${response.status}`);
            }
            return response.json();
          })
      ])
      .then(([userData, tracksData]) => {
        setDisplayName(userData.display_name || 'User');

        setTimeout(() => {
          setTracks(tracksData);
          setIsReloading(false); // End reload effect after new tracks are set
        }, 100);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError(err);
        setIsReloading(false);
      });
    }, 300);
  };

  /**
   * Handles changes in the dropdown menu, updating the `limit` state.
   * @param {Event} event - The dropdown change event.
   */
  const handleLimitChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
  };

  return (
    <Router>
      <Routes>
        {/* Callback Route (Handles Spotify Auth) */}
        <Route path="/callback" element={<CallbackHandler />} />

        {/* Main Home Page */}
        <Route path="/" element={
          <div className="container">
            {/* Show Login Button if Not Logged In */}
            {!isLoggedIn ? (
              <div className="login-container">
                <h1>Welcome to Monthly Wrap</h1>
                <p>See your top Spotify tracks for the past 4 weeks.</p>
                <a href="https://monthlywrap.onrender.com/login" className="login-button">
                  Login with Spotify
                </a>
              </div>
            ) : (
              <>
                <h1>Hello {displayName}, here is your Monthly Wrap!</h1>

                {/* Dropdown Menu for Selecting Number of Tracks */}
                <div className="dropdown-container">
                  <label htmlFor="limitSelect" className="dropdown-label">
                    <p>Select number of tracks:</p>
                  </label>
                  <select 
                    id="limitSelect" 
                    value={limit} 
                    onChange={handleLimitChange} 
                    className="dropdown-select"
                  >
                    {[...Array(10).keys()].map(i => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Handling */}
                {error && <p>Error: {error.message}</p>}

                {/* Track Cards Container */}
                <div className={`card-container ${isReloading ? 'cards-reloading' : ''}`}>
                  {tracks.length === 0 && !isReloading && <p>No tracks found.</p>}
                  {tracks.map((track, index) => (
                    <div key={index} className="card">
                      <img src={track.album_image} alt={track.name} />
                      <h3>{track.name}</h3>
                      <p>{track.artists.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
