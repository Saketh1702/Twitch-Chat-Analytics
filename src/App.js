// src/App.js
import React, { useState } from 'react';
import TwitchAuth from './components/TwitchAuth';
import TwitchDashboard from './components/TwitchDashboard';

function App() {
  const [accessToken, setAccessToken] = useState(null);

  const handleAuth = (token) => {
    setAccessToken(token);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-center bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Twitch Dashboard</h1>
        <TwitchAuth onAuth={handleAuth} />
      </header>
      
      {accessToken ? (
        <TwitchDashboard accessToken={accessToken} />
      ) : (
        <div className="p-8 text-center">
          <p>Please connect with Twitch to view the dashboard</p>
        </div>
      )}
    </div>
  );
}

export default App;