// src/components/ChannelSelector.jsx
import React, { useState } from 'react';

const ChannelSelector = ({ onChannelSelect }) => {
  const [channelName, setChannelName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (channelName.trim()) {
      onChannelSelect(channelName.trim().toLowerCase());
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="Enter channel name (e.g., ninja)"
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Watch Channel
        </button>
      </form>
    </div>
  );
};

export default ChannelSelector;