import React from "react";
import { Route, Navigate, Routes } from "react-router-dom";
import { useAuth } from "../AuthContext";

const PrivateRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <Routes>
      <Route {...rest} element={element} />
    </Routes>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;
