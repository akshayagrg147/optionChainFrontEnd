import React from "react";

const Topbar = () => {
  const handleNotificationClick = () => {
    alert("You have no new notifications.");
  };

  const handleEmergencyClick = () => {
    alert("Emergency Square-Off triggered!");
  };

  return (
    <div className="bg-white px-6 py-3 shadow-sm border-b border-gray-200 flex justify-between items-center">
      {/* Left Side Buttons */}
      <div className="flex gap-4">
        <button className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm">
          Live Trading
        </button>
        <button className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 text-sm">
          Simulation
        </button>
        <button className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400 text-sm">
          Manual Trade Setup
        </button>
        <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm">
          Settings
        </button>
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleNotificationClick}
          className="bg-gray-200 text-gray-800 px-4 py-1 rounded hover:bg-gray-300 text-sm"
        >
          Notifications
        </button>

        <button
          onClick={handleEmergencyClick}
          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm"
        >
          🚨 Emergency Square-Off
        </button>
      </div>
    </div>
  );
};

export default Topbar;
