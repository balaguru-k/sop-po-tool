import React, { useState } from "react";
import "./auth-style.css";
import Img from "../../assets/images/welcome.png";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { loginUrl } from "../../App.js";

import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { FaRegEyeSlash } from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { FiArrowRight } from "react-icons/fi";

function Login() {
  const location = useLocation();
  const { pathname } = location;
  const splitLocation = pathname.split("/");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  let navigate = useNavigate();
  const [input, setInput] = useState({
    email: "",
    password: "",
  });

  const validateEmail = (email) => {
    if (email.trim() === "") {
      return "Please enter your email";
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return "Please enter a valid email";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (password.trim() === "") {
      return "Please enter a password";
    } else if (password.length < 5) {
      return "The password must be 5 characters or longer";
    }

    return "";
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let errorMessage = "";

    if (value.trim() === "") {
      errorMessage = `Please enter ${name}`;
    } else if (name === "email") {
      errorMessage = validateEmail(value);
    } else if (name === "password") {
      errorMessage = validatePassword(value);
    }

    setErrors({
      ...errors,
      [name]: errorMessage,
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInput({
      ...input,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const emailError = validateEmail(input.email);
    const passwordError = validatePassword(input.password);

    setErrors({
      email: emailError,
      password: passwordError,
    });

    if (!emailError && !passwordError) {
      const formData = {
        email: input.email,
        password: input.password,
        appId: "app10",
        privilege: [
          "empId",
          "email",
          "roles",
          "username",
          "profilePicture",
          "type",
          "_id",
        ],
      };

      try {
        const response = await axios
          .post(loginUrl, formData, {
            headers: {
              "Content-Type": "application/json",
            },
          })

          .then(function (response) {
            toast.success(response.data.message, { duration: 1000 });

            const token = response.data.data.accessToken;

            const decoded_token = jwtDecode(token);

            localStorage.setItem("accessToken", response.data.data.accessToken);
            const email = decoded_token.userDetails?.email;
            localStorage.setItem("email", email);
            localStorage.setItem("exp", decoded_token.exp);
            localStorage.setItem("iat", decoded_token.iat);
            const id = response.data.data.userDetails._id;
            localStorage.setItem("id", id);
            const username = response.data.data.userDetails.username;
            localStorage.setItem("name", username);
            const role = response.data.data.userDetails.activeRole;
            localStorage.setItem("role", role);
            const roles = response.data.data.userDetails.roles;
            localStorage.setItem("roles", roles);
            const profilepicture =
              response.data.data.userDetails.profilePicture;
            localStorage.setItem("profilepicture", profilepicture);
            const userType = response.data.data.userDetails.type;
            localStorage.setItem("userType", JSON.stringify(userType));
            localStorage.setItem("sub", decoded_token.sub);

            // if (role === "Requestor") {
            //   navigate("/request");
            // } else if (role === "Business_Approver") {
            //   navigate("/businessapprover");
            // } else if (role === "PO_Screening") {
            //   navigate("/prscreening");
            // } else if (role === "Budget_Team") {
            //   navigate("/budgetteam");
            // } else if (role === "Business_head") {
            //   navigate("/businesshead");
            // } else if (role === "Budget_release_team") {
            //   navigate("/budgetreleaseteam");
            // } else if (role === "Po_maker") {
            //   navigate("/pomaker");
            // } else if (role === "Po_release") {
            //   navigate("/porelease");
            // } else if (role === "Po_checker") {
            //   navigate("/pochecker");
            // } else if (role === "admin") {
            //   navigate("/admin");
            // } else {
            //   navigate("/");
            // }
            if (role === "Delivery_Planner") {
              navigate("/deliveryplanner");
            } else if (role === "Internal_Audit") {
              navigate("/internalaudit");
            } else {
              navigate("/dashboard");
            }
            return response;
          });
      } catch (error) {
        if (error.response) {
          toast.error(error.response.data.message, { duration: 1000 });
          navigate("/");
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div id="auth">
      <div className="row h-100">
        <div className="col-lg-5 d-none d-lg-block">
          <div id="auth-right">
            <div class="pins">
              <div className="pin"></div>
              <div className="pin"></div>
              <div className="pin"></div>
              <div className="pin"></div>
              <div className="pin"></div>
            </div>

          </div>
        </div>
        <div className="col-lg-7">
          <div id="auth-left">
            <div className="right">
              <h1 className="greeting-text">Hello <span className="text-accent">there!</span></h1>
              <div className="titleContainer">Login to your account to access your workspace</div>
              <br />
              <form>
                <div className={"inputContainer"}>
                  <div className="full-input">
                    <label className="full-input" htmlFor="email">
                      EMAIL
                    </label>
                    <input
                      type="text"
                      name="email"
                      placeholder="Enter your email here"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={input.email}
                      className={"inputBox"}
                    />
                  </div>
                  <div className="validatetxt">
                    {errors.email && <p>{errors.email}</p>}
                  </div>
                </div>
                <div className={"inputContainer"}>
                  <div className="full-input password__box">
                    <label className="full-input" htmlFor="Password">
                      PASSWORD
                    </label>
                    <input
                      type={showPassword ? "text" : "password"} // Toggle input type based on state
                      name="password"
                      placeholder="................."
                      value={input.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={"inputBox"}
                    />

                    {showPassword ? (
                      <AiOutlineEye
                        onClick={togglePasswordVisibility}
                        className="password__item"
                      />
                    ) : (
                      <FaRegEyeSlash
                        onClick={togglePasswordVisibility}
                        className="password__item"
                      />
                    )}
                  </div>
                  <div className="validatetxt">
                    {errors.password && <p>{errors.password}</p>}
                  </div>
                </div>

                <span
                  className="forgetPass"
                  onClick={() => navigate("/forgetpassword")}
                  style={{ cursor: "pointer" }}
                >
                  Forget Password
                </span>
                <br />
                <div className={"inputContainer"}>
                  <button
                    className={"inputButton"}
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="dual-orbit-loader">
                        <div></div>
                        <div></div>
                      </div>
                    ) : (
                      <span>Login</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
