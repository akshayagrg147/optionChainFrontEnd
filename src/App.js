import React from "react";
// import Login from "./components/Login/Login";
import Register from "./Common/Register/Register";
import { Route, Router, Routes } from "react-router-dom";
import DashboardPage from "./Pages/DashboardPage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";

function App() {
  return (
    <div>
        <Routes>
          <Route path="/" element={<DashboardPage/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/register" element={<RegisterPage/>}/>
        </Routes>
    </div>
  );
}

export default App;
