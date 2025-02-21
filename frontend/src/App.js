import React, { useState, useEffect } from 'react';
import './App.css';

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

  /**
   * Fetches user info and top tracks from the backend.
   * Triggers a fade-out effect before loading new data.
   * @param {number} limit - Number of top tracks to fetch (1-10).
   */
  const fetchWrapData = (limit) => {
    setIsReloading(true); // Start fade-out effect

    // Ensure fade-out completes before fetching new data
    setTimeout(() => {
      Promise.all([
        fetch('https://monthlywrap.onrender.com/user-info', { credentials: 'include' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`User info HTTP error: ${response.status}`);
            }
            return response.json();
          }),
        fetch(`https://monthlywrap.onrender.com//top-tracks?limit=${limit}`, { credentials: 'include' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Top tracks HTTP error: ${response.status}`);
            }
            return response.json();
          })
      ])
      .then(([userData, tracksData]) => {
        setDisplayName(userData.display_name || 'User');

        // Delay fade-in to ensure smooth transition
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
    }, 300); // Ensures fade-out effect completes before fetching
  };

  /**
   * useEffect hook that triggers data fetching when `limit` changes.
   */
  useEffect(() => {
    fetchWrapData(limit);
  }, [limit]);

  /**
   * Handles changes in the dropdown menu, updating the `limit` state.
   * @param {Event} event - The dropdown change event.
   */
  const handleLimitChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
  };

  return (
    <div className="container">
      {/* Greeting Message */}
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
    </div>
  );
}

export default App;
