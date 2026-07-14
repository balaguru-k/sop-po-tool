import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutPage = () => {
  let navigate = useNavigate();

  const HandleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("email");
    localStorage.seremoveItemtItem("exp");
    localStorage.removeItem("iat");
    localStorage.removeItem("id");
    localStorage.removeItem("name");
    localStorage.removeItem("picture");
    localStorage.removeItem("role");
    localStorage.removeItem("sub");
    localStorage.clear();
    localStorage.clear();
    navigate("/");
  };
  return (
    <div>
      <button className="btn btn-primary" href="" onclick={HandleLogout}>
        Logout
      </button>
    </div>
  );
};

export default LogoutPage;
