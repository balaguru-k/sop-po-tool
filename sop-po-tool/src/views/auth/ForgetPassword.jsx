import React, { useState } from "react";
import "../../assets/css/ForgetPassword.css";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LuKey } from "react-icons/lu";
import axios from "axios";
import { MdOutlineEmail } from "react-icons/md";
import { BaseUrl } from "../../App.js";
import CKPL_Logo from "../../assets/images/image.jpg";
import Hepllogo from "../../assets/images/download.png";
import forgotPasswordImg from "../../assets/images/7769793_3227468 1.svg";
import emaillogo from "../../assets/images/7367537_3646944 1.svg";
import { Link } from "react-router-dom";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isemailFormVisible, setIsEmailFormVisible] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError("");
    setIsSubmitting(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      const apiUrl = `${BaseUrl}api/auth/reset-link/${email}`;
      const response = await axios.get(apiUrl, {

        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        // },
      });

      toast.success("Password reset link has been sent to your email", {
        position: "top-right",

      });

      setIsSuccess(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to send reset link"

      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyEmail = localStorage.getItem("email") || "";

  let companyName = "";
  if (companyEmail.toLowerCase().includes("hepl")) {
    companyName = "hepl";
  } else if (companyEmail.toLowerCase().includes("cavinkare")) {
    companyName = "cavinkare";
  }

  return (
    <div className="fp-wrapper">
      <div className="fp-box">
        {/* Left Side - Illustration */}
        <div className="fp-left">
          {!isSuccess ? (
            <img src={forgotPasswordImg} alt="Forgot Password Illustration" className="fp-image" />
          ) : isemailFormVisible ? (
            <>
              <div className="fp-box-logo">
                {companyName === "hepl" ? (
                  <img src={Hepllogo} alt="Hepl_logo" className="fp-logo" height={36} />
                ) : (
                  <img src={CKPL_Logo} alt="CKPL_logo" className="fp-logo" width={73} />
                )}
              </div>
              <img src={emaillogo} alt="Company Logo" className="fp-image" />

            </>
          ) : null}

        </div>

        {/* Right Side - Form or Success Message */}
        <div className="fp-right">
          {/* {companyName === "hepl" ? (
            <img src={Hepllogo} alt="Hepl_logo" className="fp-logo"  />
          ) : (
            <img src={CKPL_Logo} alt="CKPL_logo" className="fp-logo" />
          )} */}

          {!isSuccess ? (
            <>
              <div className="fp-key-icon-wrapper">
                <span className="fp-key-icon"><LuKey /></span>
              </div>
              <h2 className="fp-heading">Forgot Password?</h2>
              <p className="fp-subtext">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="fp-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}

                />
                {emailError && (
                  <p style={{ color: "red", fontSize: "12px", marginTop: "-15px", marginBottom: "15px", textAlign: "left" }}>
                    {emailError}
                  </p>
                )}

                <button type="submit" className="fp-button" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Request"}
                </button>
                <p className="fp-subtext" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
                  ← Back to login
                </p>
              </form>
            </>
          ) : (
            <>
              {isemailFormVisible && (
                <>
                  <div className="fp-key-icon-wrapper">
                    <span className="fp-key-icon"><MdOutlineEmail /></span>
                  </div>
                  <h2 className="fp-heading" style={{ color: "#e4003a" }}>Check your email</h2>
                  <p className="fp-subtext">We sent a password reset link to</p>
                  <input type="text" className="fp-input" value={email} disabled />
                  <div className="fp-button">
                    <Link style={{ textDecoration: "none" }}
                      className="reset_email_link"
                      to={`https://outlook.office.com/mail/${email}`}
                      target="_blank"
                    >
                      <span className="fp-button-text"
                        style={{
                          color: "#fff",
                          textDecoration: "none",
                        }}
                      >
                        Open Email
                      </span>
                    </Link>
                  </div>
                  <p className="fp-subtext" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
                    ← Back to login
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

};

export default ForgetPassword;