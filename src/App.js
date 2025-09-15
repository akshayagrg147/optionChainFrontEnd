import React from "react";
// import Login from "./components/Login/Login";
import Register from "./Common/Register/Register";
import { Route, Router, Routes } from "react-router-dom";
import DashboardPage from "./Pages/DashboardPage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import SquareOff from "./components/SquareOff";
import ManualTradeUI from "./components/ManualTradeUI";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";
import PrivateRoute from "./components/PrivateRoute";
import { ManualWebSocketProvider } from "./ManualWebSocketContext";
import UpstoxAuth from "./components/UpstoxAuth";


function App() {
  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth" element={<UpstoxAuth />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/square-off"
          element={
            <PrivateRoute>
              <SquareOff />
            </PrivateRoute>
          }
        />
        <Route
          path="/manual-trade"
          element={
            <PrivateRoute>

              <ManualWebSocketProvider>
                <ManualTradeUI />
              </ManualWebSocketProvider>
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
