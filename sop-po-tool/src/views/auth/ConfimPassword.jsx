import "../../assets/css/ForgetPassword.css";
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Hepllogo from "../../assets/images/download.png";
import newpassword from "../../assets/images/11905926_4860635 1.svg";
import { AiOutlineLock, AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import CKPL_Logo from "../../assets/images/image.jpg";
import { BaseUrl } from "../../App.js";
import axios from "axios";
import toast from "react-hot-toast";

const ConfirmPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();
  const companyEmail = localStorage.getItem("email") || "";

  let companyName = "";
  if (companyEmail.toLowerCase().includes("hepl")) {
    companyName = "hepl";
  } else if (companyEmail.toLowerCase().includes("cavinkare")) {
    companyName = "cavinkare";
  }
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error("Please enter a password", { position: "top-right" });
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long", { position: "top-right" });
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Please enter both passwords", { position: "top-right" });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match", { position: "top-right" });
      return;
    }

    const hash = window.location.hash;
    const token = new URLSearchParams(hash.split("?")[1]).get("token");

    if (!token) {
      toast.error("Invalid or missing token", { position: "top-right" });
      return;
    }

    try {
      const response = await axios.put(`${BaseUrl}api/auth/forgot-password`, {
        token: token,
        password: password,
      });

      toast.success("Password reset successful", { position: "top-right" });
      setPassword("");
      setConfirmPassword("");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to reset password", { position: "top-right" });
    }
  };

  return (
    <div className="fp-wrapper">
      <div className="fp-box">
        {/* Left Side - Illustration */}
        <div className="fp-left">
          {companyName === "hepl" ? (
            <img src={Hepllogo} alt="Hepl_logo" className="fp-logo" />
          ) : (
            <img src={CKPL_Logo} alt="CKPL_logo" className="fp-logo" />
          )}
          <div className="fp-illustration-box">
            <img
              src={newpassword}
              alt="Email Illustration"
              className="fp-illustration"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="fp-right">
          <div className="fp-key-icon-wrapper">
            <span className="fp-key-icon">
              <AiOutlineLock />
            </span>
          </div>
          <h2 className="fp-heading red">Set New Password</h2>
          <p className="fp-subtext">You can set a new password here</p>

          <form onSubmit={handleSubmit}>
            <div className="fp-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="fp-input"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {emailError && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "-15px", marginBottom: "15px", textAlign: "left" }}>
                  {emailError}
                </p>
              )}
              <span
                className="fp-icon-eye"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
              </span>
            </div>


            <div className="fp-input-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                className="fp-input"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {emailError && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "-15px", marginBottom: "15px", textAlign: "left" }}>
                  {emailError}
                </p>
              )}
              <span
                className="fp-icon-eye"
                onClick={() => setShowConfirm((prev) => !prev)}
              >
                {showConfirm ? <AiFillEye /> : <AiFillEyeInvisible />}
              </span>
            </div>

            <button type="submit" className="fp-button full-width">
              Reset Password
            </button>
          </form>

          <p
            className="fp-subtext"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            ← Back to login
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPassword;
