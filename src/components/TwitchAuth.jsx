// src/components/TwitchAuth.jsx
import React, { useEffect, useState } from 'react';

const TwitchAuth = ({ onAuth }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const CLIENT_ID = 'etwu8htnehip0la9fugdtddl8toh11';
  const REDIRECT_URI = 'http://localhost:3000';
  const SCOPES = ['chat:read', 'chat:edit', 'channel:read:stream_key'];

  const encodedRedirectUri = encodeURIComponent(REDIRECT_URI);
  
  const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodedRedirectUri}&` +
    `response_type=token&` +
    `scope=${SCOPES.join(' ')}&` +
    `force_verify=true`;

  useEffect(() => {
    // Check if we have an access token in the URL fragment
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        localStorage.setItem('twitch_access_token', accessToken);
        setIsAuthenticated(true);
        if (onAuth) onAuth(accessToken);
      }
    }

    // Check if we have a stored token
    const storedToken = localStorage.getItem('twitch_access_token');
    if (storedToken) {
      setIsAuthenticated(true);
      if (onAuth) onAuth(storedToken);
    }
  }, [onAuth]);

  const handleLogin = () => {
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('twitch_access_token');
    setIsAuthenticated(false);
  };

  return (
    <div className="p-4">
      {!isAuthenticated ? (
        <button
          onClick={handleLogin}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Connect with Twitch
        </button>
      ) : (
        <div className="flex gap-4 items-center">
          <span className="text-green-600">✓ Connected to Twitch</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default TwitchAuth;