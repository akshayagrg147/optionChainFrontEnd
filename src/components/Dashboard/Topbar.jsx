import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationPanel from "../../Common/Notification";
import { FaBell } from "react-icons/fa";

const Topbar = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const handleNotificationClick = () => {
    setNotificationOpen(!notificationOpen); // Only open on click
  };
  const navigate = useNavigate();
  // 🧠 Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEmergencyClick = () => {
    alert("Emergency Square-Off triggered!");
  };
  const handleLogout = () => {
    localStorage.removeItem('access-token');
    const token = localStorage.getItem('access-token');
    if (!token) {
      return navigate('/login')
    }
  }
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
        <Link to={'/square-off'}>
          <button className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 text-sm">
            Square off settings
          </button>
        </Link>
        <Link to={'/manual-trade'}>
          <button className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400 text-sm">
            Manual Trade Setup
          </button>
        </Link>
        <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm">
          Settings
        </button>
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-3">

        <button
          // onClick={handleEmergencyClick}
          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm"
        >
          🚨 Emergency Square-Off
        </button>

        <button
          onClick={handleNotificationClick}
          ref={notificationRef}
          className=" px-2 py-2 rounded hover:bg-gray-300 rounded-full transition-all ease-in text-sm"
        >
          <FaBell />
        </button>
        <button
          onClick={() => handleLogout()}
          className=" px-2 py-2 rounded hover:bg-gray-300 rounded-full transition-all ease-in text-sm"
        >
          Logout
        </button>


      </div>
      {notificationOpen ? <NotificationPanel /> : ''}
    </div>
  );
};

export default Topbar;
