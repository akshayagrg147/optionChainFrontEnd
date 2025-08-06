import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access-token");

  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token);

    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("access-token"); // Optional: clean up expired token
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (error) {
    // Invalid token format or decode error
    localStorage.removeItem("access-token");
    return <Navigate to="/login" replace />;
  }
};

export default PrivateRoute;
