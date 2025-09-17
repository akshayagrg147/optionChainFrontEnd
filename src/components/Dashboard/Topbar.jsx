import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationPanel from "../../Common/Notification";
import { FaBell } from "react-icons/fa";
import axios from "axios";

const Topbar = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [active, setActive] = useState("live");
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
    const funds = JSON.parse(localStorage.getItem('funds')) || [];

    const url = 'https://api.upstox.com/v2/order/positions/exit';

    const requests = funds.map((item) => {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${item.token}`,
      };

      const data = {};

      return axios.post(url, data, { headers });
    });

    // 🟢 Fire all at once in parallel
    Promise.all(requests)
      .then((responses) => {
        responses.forEach((res, i) => {
          console.log(`Response ${i + 1}:`, res.data);
        });
      })
      .catch((error) => {
        console.error('Error during emergency exit:', error.message);
      });
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
        <button
          onClick={() => setActive("live")}
          className={`px-4 py-1 text-sm rounded-full font-medium ${active === "live"
            ? "bg-green-600 text-white"
            : "bg-white text-gray-700 hover:bg-green-50"
            }`}
        >
          Live Trading
        </button>

        <button
          onClick={() => setActive("simulation")}
          className={`px-4 py-1 text-sm rounded-full font-medium ${active === "simulation"
            ? "bg-yellow-500 text-white"
            : "bg-white text-gray-700 hover:bg-yellow-50"
            }`}
        >
          Simulation
        </button>
        {/* <Link to={'/square-off'}>
          <button className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 text-sm">
            Square off settings
          </button>
        </Link> */}
        <Link to={'/manual-trade'}>
          <button className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400 text-sm">
            Manual Trade Setup
          </button>
        </Link>
        {/* <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm">
          Settings
        </button> */}
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-3">

        <button
          onClick={handleEmergencyClick}
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
