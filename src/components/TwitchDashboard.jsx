// src/components/TwitchDashboard.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import tmi from 'tmi.js';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import ChannelSelector from './ChannelSelector';

const TwitchDashboard = ({ accessToken }) => {
  const [messages, setMessages] = useState([]);
  const [messageRate, setMessageRate] = useState(() => {
    const now = new Date();
    return Array(30).fill(0).map((_, i) => ({
      timestamp: new Date(now.getTime() - (29 - i) * 1000).toLocaleTimeString(),
      rate: 0
    }));
  });
  const [emoteStats, setEmoteStats] = useState({});
  const [channelInfo, setChannelInfo] = useState(null);
  const [channelName, setChannelName] = useState('');
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  

  // Handle channel selection
  const handleChannelSelect = async (newChannel) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Safely disconnect existing client if any
      if (client) {
        try {
          client.removeAllListeners();
          await client.disconnect();
        } catch (error) {
          // console.log('Disconnect error (safe to ignore):', error);
        }
      }

      // Reset all states before setting up new channel
      setClient(null);
      setChannelName(newChannel);
      setMessages([]);
      setMessageRate([]);
      setEmoteStats({});
      setChannelInfo(null);

      // Fetch channel information from Twitch API
      // console.log('Fetching channel info for:', newChannel);
      const response = await fetch(`https://api.twitch.tv/helix/users?login=${newChannel}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': 'etwu8htnehip0la9fugdtddl8toh11' // Replace with your client ID
        }
      });
      
      const data = await response.json();
      // console.log('Channel info received:', data);

      if (data.data && data.data[0]) {
        setChannelInfo(data.data[0]);
        
        // Create new TMI client after successful channel info fetch
        const newClient = new tmi.Client({
          options: { debug: true },
          connection: {
            secure: true,
            reconnect: true
          },
          channels: [newChannel]
        });

        await newClient.connect();
        setClient(newClient);
      } else {
        throw new Error('Channel not found');
      }
    } catch (error) {
      console.error('Error switching channels:', error);
      setError(error.message || 'Error connecting to channel');
    } finally {
      setIsLoading(false);
    }
  };


  // Initialize chat client when we have the channel name
  useEffect(() => {
    if (!channelName || !client) {
      // console.log('Missing channelName or client');
      return;
    }

    let messageCounter = 0;
    let isFirstUpdate = true;
    const updateInterval = 2000;

    // console.log('Setting up message handler for channel:', channelName);

    const messageHandler = (channel, tags, message, self) => {
      messageCounter++;
      // console.log('Message received, current count:', messageCounter)
      // console.log('New message received:', { channel, message });
      
      const newMessage = {
        id: tags.id,
        username: tags.username,
        message,
        timestamp: new Date(),
        emotes: tags.emotes
      };

      setMessages(prev => [...prev.slice(-99), newMessage]);
      
      if (tags.emotes) {
        setEmoteStats(prev => {
          const newStats = { ...prev };
          Object.keys(tags.emotes).forEach(emoteId => {
            newStats[emoteId] = (newStats[emoteId] || 0) + 1;
          });
          return newStats;
        });
      }
    };

    // Message rate calculation
    const rateInterval = setInterval(() => {
      const now = new Date();
      
      setMessageRate(prev => {

        if (isFirstUpdate) {
          isFirstUpdate = false;
          return Array(30).fill(0).map((_, i) => ({
            timestamp: new Date(now.getTime() - (29 - i) * updateInterval).toLocaleTimeString(),
            rate: 0
          }));
        }

        const newPoint = {
          timestamp: now.toLocaleTimeString(),
          rate: messageCounter
        };
        messageCounter = 0;
        
        return [...prev.slice(-29), newPoint];
      });
    }, updateInterval);

    client.on('message', messageHandler);
    // console.log('Message handler attached');

    return () => {
      // console.log('Cleaning up message handler');
      client.removeListener('message', messageHandler);
      clearInterval(rateInterval);
    };
  }, [client, channelName]) 


  return (
    <div className="p-4">
      <ChannelSelector onChannelSelect={handleChannelSelect} />
      
      {error && (
        <div className="text-center p-4 text-red-500">
          Error: {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center p-8">
          <p className="text-gray-500">Connecting to channel...</p>
        </div>
      )}

      {!channelName && !isLoading && (
        <div className="text-center p-8 text-gray-500">
          Enter a channel name above to start monitoring
        </div>
      )}
      
      {channelName && channelInfo && !isLoading && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Channel: {channelInfo.display_name}</span>
                <span className="text-sm text-green-500">● Connected</span>
              </CardTitle>
              <p className="text-gray-500">{channelInfo.description}</p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Message Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Message Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={messageRate}>
                      <XAxis 
                        dataKey="timestamp"
                        interval="preserveEnd"
                        minTickGap={30}
                        tick={{fontSize: 12}}
                       />
                      <YAxis
                        domain={[0, dataMax => Math.max(5, dataMax * 1.2)]}
                        tick={{ fontSize: 12 }}
                        // allowDataOverflow={false} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        formatter={(value) => [`${value} messages`, 'Rate']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Emote Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Top Emotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(emoteStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([emoteId, count]) => (
                      <div key={emoteId} className="flex justify-between items-center">
                        <img 
                          src={`https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/1.0`} 
                          alt={`Emote ${emoteId}`}
                          className="h-6"
                        />
                        <span className="font-mono">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto space-y-2">
                  {messages.slice(-20).map(msg => (
                    <div key={msg.id} className="p-2 hover:bg-gray-50 rounded">
                      <span className="font-bold text-purple-600">{msg.username}: </span>
                      <span>{msg.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default TwitchDashboard;