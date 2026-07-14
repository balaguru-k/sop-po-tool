import React, { useState, useEffect } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "../../assets/css/custom-style.css";
import "../../assets/css/header.css";
import { Dropdown, message, Space, MenuProps, Tabs } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import Hepl_logo from "../../assets/images/download.png";
import CKPL_Logo from "../../assets/images/image.jpg";
import Profile_Img from "../../assets/images/Profile.png";
import defaultImageURL from "../../assets/images/profile_img.png";

import { useNavigate, useLocation } from "react-router-dom";


import toast from "react-hot-toast";
import { BaseUrl } from "../../App.js";
import { profileUrl } from "../../App.js";
import axios from "axios";
import Admin from "../Admin.jsx";

const Header = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [previousTab, setPreviousTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { pathname } = location;
  const splitLocation = pathname.split("/");
  const capitalizeString = (str) => {
    return str
      .split("_")
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };
  const path_split = splitLocation[1];

  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");
  const roles = localStorage.getItem("roles");
  const roleList = roles ? roles.split(",") : [];
  const adminEmails = ['hganesh@cavinkare.com', 'misha@cavinkare.com', 'sakthivel.sp@hepl.com'];
  const isSpecialAdmin = adminEmails.includes(email);
  const picture = localStorage.getItem("profilepicture");
  //    const picture_path = profileUrl+picture;
  // const picture_path = picture ? picture : defaultImageURL;

  const accessToken = localStorage.getItem("accessToken");
  const navigations = {
    Requestor: "/request",
    Business_Approver: "/businessapprover",
    PO_Screening: "/prscreening",
    Budget_Team: "/budgetteam",
    Business_head: "/businesshead",
    Budget_release_team: "/budgetreleaseteam",
    Po_maker: "/pomaker",
    Qa_approval: "/qaapproval",
    Po_release: "/porelease",
    Po_checker: "/pochecker",
    Delivery_Planner: "/deliveryplanner",
    admin: "/admin",
    Internal_Audit: "/internalaudit",
  };
  let navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) {
      navigate("/");
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (pathname === "/dashboard") {
      setActiveTab("Dashboard");
    } else if (pathname === "/potat") {
      setActiveTab("Tat");
    } else if (pathname === "/mailtemplate") {
      setActiveTab("MailTemplate");
    } else if (pathname === navigations[role]) {
      const savedTab = localStorage.getItem("selectedTicketTab") || "Brand";
      setActiveTab(savedTab);
    }
  }, [pathname, role, navigations]);

  // Close sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960 && window.innerHeight > 551) {
        setSidebarOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  // Manage body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [sidebarOpen]);

  const handleTabChange = (key) => {
    const tabs = ["Dashboard", "Brand", "Non Brand", "Tat", "MailTemplate"];

    const updateTab = () => {
      setActiveTab(key);
      if (key === "Dashboard") navigate("/dashboard");
      else if (key === "Brand" || key === "Non Brand") {
        localStorage.setItem("selectedTicketTab", key);
        window.dispatchEvent(new Event("tabChanged"));
        navigate(navigations[role]);
      }
      else if (key === "Tat") navigate("/potat");
      else if (key === "MailTemplate") navigate("/mailtemplate");
    };

    document.startViewTransition ? document.startViewTransition(updateTab) : updateTab();
  };

  const HandleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("email");
    localStorage.removeItem("exp");
    localStorage.removeItem("iat");
    localStorage.removeItem("id");
    localStorage.removeItem("name");
    localStorage.removeItem("picture");
    localStorage.removeItem("role");
    localStorage.removeItem("sub");
    localStorage.clear();

    navigate("/");
  };

  const handleRoleSelection = async (role) => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}api/auth/switch-role`;

      const response = await axios.post(
        apiUrl,
        { token: token, role: role },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const token = response.data.data.accessToken;
        localStorage.setItem("accessToken", token);
        const role = response.data.data.userDetails.activeRole;
        localStorage.setItem("role", role);
        if (role === "Internal_Audit") {
          navigate("/internalaudit");
        } else if (role === "Delivery_Planner") {
          navigate("/deliveryplanner");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error switching role:", error);
    }
  };

  const onClick = () => {
    // message.info(`Click on item ${key}`);
    toast.error("You are logged out successfully!", { duration: 1000 });
  };

  const items = [
    {
      label: <a onClick={HandleLogout}>Logout</a>,
      // key: '1',
    },
  ];
  const companyEmail = localStorage.getItem("email") || "";
  const userType = JSON.parse(localStorage.getItem("userType") || "[]");

  let companyName = "";
  if (companyEmail.toLowerCase().includes("hepl")) {
    companyName = "hepl";
  } else if (companyEmail.toLowerCase().includes("cavinkare")) {
    companyName = "cavinkare";
  }

  const showMarketingTab = userType.includes("Brand");
  const showNonMarketingTab = userType.includes("NonBrand");

  const isInternalAudit = role === "Internal_Audit";

  const navItems = isInternalAudit ? [
    ...(showMarketingTab ? [{ key: "Brand", label: "Marketing" }] : []),
    ...(showNonMarketingTab ? [{ key: "Non Brand", label: "Non Marketing" }] : []),
  ] : [
    ...(role === "Delivery_Planner" ? [] : [{ key: "Dashboard", label: "Dashboard" }]),
    ...(showMarketingTab ? [{ key: "Brand", label: role === "admin" ? "Masters" : "Marketing" }] : []),
    ...(showNonMarketingTab ? [{ key: "Non Brand", label: "Non Marketing" }] : []),
    ...(role !== "Requestor" && role !== "Delivery_Planner" || isSpecialAdmin ? [{ key: "Tat", label: "Tat" }] : []),
    ...(role === "Delivery_Planner" ? [] : [{ key: "MailTemplate", label: "Mail Template" }]),
  ];

  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const names = fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <>
      <div className="custom-header">
        <div className="header-left">
          <button
            className="hamburger-menu d-lg-none me-3"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', fontSize: '20px' }}
          >
            <MenuOutlined />
          </button>

          <div className="d-flex align-items-center gap-2">
            {companyName === "hepl" ? (
              <img src={Hepl_logo} alt="Hepl_logo" height={36} />
            ) : (
              <>
                <div className="logo-box">CK</div>
                <div className="logo-text">
                  <span className="brand-name">CavinKare</span>
                  <span className="brand-slogan">MAKING LIVES HAPPIER</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="header-center d-none d-lg-flex">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => handleTabChange(item.key)}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className="header-right">


          <Dropdown
            menu={{
              items: [
                ...roleList.map((roleKey, idx) => ({
                  label: <b>{roleKey}</b>,
                  key: roleKey,
                  disabled: roleKey === role,
                })),
                {
                  type: "divider",
                },
                {
                  label: <a onClick={HandleLogout}>Logout</a>,
                  key: "logout",
                },
              ],
              onClick: ({ key }) => {
                if (key === "logout") return;
                handleRoleSelection(key);
              },
            }}
          >
            <div className="user-profile">
              <div className="user-avatar">{getInitials(name)}</div>
              <div className="user-info d-none d-md-flex">
                <span className="user-name">{name}</span>
                <span className="user-role">{role}</span>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        <div className="sidebar-content">
          <div className="sidebar-header">
            {companyName === "hepl" ? (
              <img src={Hepl_logo} alt="Hepl_logo" height={30} />
            ) : (
              <div className="d-flex align-items-center gap-2">
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#d6002a',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  fontFamily: 'serif',
                  fontWeight: 'bold',
                }}>CK</div>
                <span style={{ fontWeight: 'bold' }}>CavinKare</span>
              </div>
            )}
            <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>×</button>
          </div>
          <div className="sidebar-menu">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => { handleTabChange(item.key); setSidebarOpen(false); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
