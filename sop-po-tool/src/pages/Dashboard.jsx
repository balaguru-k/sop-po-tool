import React, { useEffect, useState } from "react";
import { Doughnut, Bar, PolarArea } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
} from "chart.js";
import { DatePicker, Select } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import GlobeComponent from "../components/GlobeComponent";
import EmptyState from "../components/EmptyState";
import "../assets/css/custom-style.css";
import "../assets/css/dashboard.css";
import { BaseUrl } from "../App";
import axios from "axios";
import { CloseOutlined, FilterOutlined } from "@ant-design/icons";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale
);

const Dashboard = () => {
  const navigate = useNavigate();
  
  const userType = JSON.parse(localStorage.getItem("userType") || "[]");
  const getInitialMarketingType = () => {
    if (userType.includes("Brand") && !userType.includes("NonBrand")) {
      return "Marketing";
    } else if (userType.includes("NonBrand") && !userType.includes("Brand")) {
      return "Non Marketing";
    } else if (userType.includes("Brand") && userType.includes("NonBrand")) {
      return "Marketing";
    }
    return "Marketing";
  };
  
  const [counts, setCounts] = useState({
    pending: 25,
    completed: 150,
    rejected: 8,
    onHold: 12,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [marketingType, setMarketingType] = useState(getInitialMarketingType());
  const [viewType, setViewType] = useState("Supervise");
  const [filters, setFilters] = useState({
    quarter: "",
    startDate: "",
    endDate: "",
    profitCentre: "",
    vendornamecode: "",
  });
  const [dashboardData, setDashboardData] = useState({});
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );
  const [profitCentreOptions, setProfitCentreOptions] = useState([]);
  const [vendotOptions, setVendorNameOptions ] = useState([]);

  const quarterOptions = [
    { label: "Q1 (Jan-Mar)", value: "Q1" },
    { label: "Q2 (Apr-Jun)", value: "Q2" },
    { label: "Q3 (Jul-Sep)", value: "Q3" },
    { label: "Q4 (Oct-Dec)", value: "Q4" },
  ];
  const userEmail = localStorage.getItem("email");
  const adminEmails = ['sakthivel.sp@hepl.com'];
  const isSpecialAdmin = adminEmails.includes(userEmail);
  const showMarketingToggle = userType.includes("Brand") && userType.includes("NonBrand");

  const CountBox = ({ title, count, color, icon, gradient, countKey }) => {
    const handleClick = () => {
      const role = localStorage.getItem("role");
      const tabType = marketingType === "Marketing" ? "Brand" : "Non Brand";
      localStorage.setItem("selectedTicketTab", tabType);
      localStorage.setItem("selectedActiveTab", tabType);
      
      if (title === "Holder" && role !== "Budget_Team" && role !== "Po_maker") {
        return;
      }
      
      if (title === "Rejected" && role === "Requestor") {
        return;
      }
      
      let statusTabKey = "first";
      if (title === "Rejected") {
        statusTabKey = "fourth";
      } else if (title === "Holder") {
        statusTabKey = "second";
      } else if (title === "Completed") {
        statusTabKey = "fifth";
      }
      localStorage.setItem("selectedStatusTab", statusTabKey);
      
      const roleRouteMap = {
        "Requestor": "/request",
        "Business_Approver": "/businessapprover",
        "PO_Screening": "/prscreening",
        "Budget_Team": "/budgetteam",
        "Business_head": "/businesshead",
        "Budget_Release_Team": "/budgetreleaseteam",
        "Po_maker": "/pomaker",
        "Po_release": "/porelease",
        "Po_checker": "/pochecker",
        "Delivery_Planner": "/deliveryplanner",
        "Admin": "/admin"
      };
      
      navigate(roleRouteMap[role] || "/dashboard");
    };

    return (
      <div
        className="advanced-count-box"
        style={{ background: gradient }}
        onClick={handleClick}
      >
        <div className="count-box-overlay" data-icon={icon}>
          <div className="count-box-info">
            <div className="count-box-title-advanced">{title}</div>
            <div className="count-box-number-advanced" key={count}>
              {count}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = localStorage.getItem("name") || "User";

  const handleRoleChange = () => {
    const newToken = localStorage.getItem("accessToken");
    if (newToken !== accessToken) {
      setAccessToken(newToken);
      DataTicket();
      getDivision();
    }
  };

  useEffect(() => {
    const interval = setInterval(handleRoleChange, 500);
    return () => clearInterval(interval);
  }, [accessToken]);
  const DataTicket = async (customFilters = filters, ticketType = null, myselfOverride = null) => {
    try {
      const token = localStorage.getItem("accessToken");
      const type = ticketType !== null ? ticketType : (marketingType === 'Marketing' ? 'Brand' : 'NonBrand');
      const myself = myselfOverride !== null ? myselfOverride : (viewType === "Self" ? "true" : "false");
      const apiUrl =
        BaseUrl +
        `dashboard/stats?startDate=${customFilters.startDate || ''}&endDate=${customFilters.endDate || ''}&division=${customFilters.profitCentre || ''}&quarter=${customFilters.quarter || ''}&vendorCode=${customFilters.vendornamecode || ''}&ticketType=${type}&myself=${myself}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getDivision = async () => {
    try {
      const divisionUrl = `${BaseUrl}api/ticket/divisions?ticketType=${marketingType === 'Marketing' ? 'Brand' : 'NonBrand'}`;
      const divisionResponse = await axios.get(divisionUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const divisionsData = divisionResponse.data;
      const uniqueDivisions = [...new Set(divisionsData.map((item) => item.division))];
      const options = uniqueDivisions.map((div) => ({
        label: div,
        value: div,
      }));
      setProfitCentreOptions(options);
    } catch (error) {
      console.error("Error fetching division data:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setAccessToken(token);
    DataTicket();
    getDivision();
  }, []);

   const getVendor = async () => {
    try {
      const vendorUrl = `${BaseUrl}api/ticket/vendors?ticketType=${marketingType === 'Marketing' ? 'Brand' : 'NonBrand'}`;
      const vendorResponse = await axios.get(vendorUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const vendorData = vendorResponse.data;
       const options = vendorData.map((item: any) => ({
      value: item.vendorCode, 
      label: `${item.vendorName} - ${item.vendorCode}`,
    }));
    
      setVendorNameOptions(options);
    } catch (error) {
      console.error("Error fetching division data:", error);
    }
  };

  useEffect(() => {
    getVendor();
    getDivision();
  }, [marketingType]);

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("accessToken");
      if (newToken !== accessToken) {
        setAccessToken(newToken);
        DataTicket();
        getDivision();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [accessToken]);

  return (
    <div className="container-fluid main-content">
      <div className="dashboard-welcome-banner">
        <div>
          <h2 className="dashboard-welcome-title">
            {getGreeting()}, {userName}! 👋
          </h2>
          <p className="dashboard-welcome-subtitle">
            Welcome back to your dashboard. Here's what's happening today.
          </p>
        </div>
        <div className="dashboard-controls">
          { isSpecialAdmin && (
            <div className="toggle-container">
            <span className="toggle-label">{viewType}</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={viewType === "Self"}
                onChange={(e) => {
                  const newView = e.target.checked ? "Self" : "Supervise";
                  setViewType(newView);
                  DataTicket(filters, marketingType === 'Marketing' ? 'Brand' : 'NonBrand', newView === "Self" ? "true" : "false");
                }}
              />
              <span className="toggle-slider">
                <span className={`toggle-knob ${viewType === "Supervise" ? "left" : "right"}`}></span>
              </span>
            </label>
          </div>
            )}
          {showMarketingToggle && (
          <div className="toggle-container">
            <span className="toggle-label">{marketingType}</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={marketingType === "Non Marketing"}
                onChange={(e) => {
                  const newType = e.target.checked ? "Non Marketing" : "Marketing";
                  setMarketingType(newType);
                  DataTicket(filters, newType === 'Marketing' ? 'Brand' : 'NonBrand');
                }}
              />
              <span className="toggle-slider">
                <span className={`toggle-knob ${marketingType === "Marketing" ? "left" : "right"}`}></span>
              </span>
            </label>
          </div>
          )}
          
          <button
            onClick={() => {
              if (showFilter) {
                setFilters({
                  quarter: "",
                  startDate: "",
                  endDate: "",
                  profitCentre: "",
                  vendornamecode: "",
                });
              }
              setShowFilter(!showFilter);
            }}
            className="dashboard-filter-btn"
            title={showFilter ? "Hide Filter" : "Filter"}
            aria-label={showFilter ? "Hide Filter" : "Filter"}
          >
            {showFilter ? <CloseOutlined /> : <FilterOutlined />}
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="dashboard-filter-container">
          <div className="dashboard-filter-grid">
            {/* <div>
              <label className="dashboard-filter-label">Quarter</label>
              <Select
                placeholder="Select Quarter"
                value={filters.quarter || undefined}
                onChange={(value) => setFilters({ ...filters, quarter: value })}
                style={{ width: "100%" }}
                showSearch
              >
                {quarterOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </div> */}
            <div>
              <label className="dashboard-filter-label">Start Date</label>
              <DatePicker
                value={filters.startDate ? dayjs(filters.startDate) : null}
                onChange={(date) =>
                  setFilters({
                    ...filters,
                    startDate: date ? date.format("YYYY-MM-DD") : "",
                  })
                }
                placeholder="Choose Start Date"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="dashboard-filter-label">End Date</label>
              <DatePicker
                value={filters.endDate ? dayjs(filters.endDate) : null}
                onChange={(date) =>
                  setFilters({
                    ...filters,
                    endDate: date ? date.format("YYYY-MM-DD") : "",
                  })
                }
                placeholder="Choose End Date"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="dashboard-filter-label">Profit Centre</label>
              <Select
                placeholder="Select Profit Centre"
                value={filters.profitCentre || undefined}
                onChange={(value) =>
                  setFilters({ ...filters, profitCentre: value })
                }
                style={{ width: "100%" }}
                showSearch
              >
                {profitCentreOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
             <div>
              <label className="dashboard-filter-label">Vendor(Name/Code)</label>
              <Select
                placeholder="Select Name/Code"
                value={filters.vendornamecode || undefined}
                onChange={(value) =>
                  setFilters({ ...filters, vendornamecode: value })
                }
                style={{ width: "100%" }}
                showSearch
                optionFilterProp="children"
              >
                {vendotOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>
          <div className="dashboard-filter-actions">
            <button
              onClick={() => {
                const clearedFilters = {
                  quarter: "",
                  startDate: "",
                  endDate: "",
                  profitCentre: "",
                  vendornamecode: "",
                };
                setFilters(clearedFilters);
                DataTicket(clearedFilters);
                setShowFilter(false);
              }}
              className="dashboard-filter-clear-btn"
            >
              Clear
            </button>
            <button
              onClick={() => {
                DataTicket();
                setShowFilter(false);
              }}
              className="dashboard-filter-apply-btn"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
      <div className="dashboard-counts">
        <CountBox
          title="Pending"
          count={
            dashboardData.statusCounts ? dashboardData.statusCounts.Pending : 0
          }
          color="#ffaa00"
          icon="📋"
          gradient="linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)"
          countKey="pending"
        />
        <CountBox
          title="Completed"
          count={
            dashboardData.statusCounts
              ? dashboardData.statusCounts.Completed
              : 0
          }
          color="#00bf00"
          icon="🎉"
          gradient="linear-gradient(135deg, #00b894 0%, #00cec9 100%)"
          countKey="completed"
        />
        {localStorage.getItem("role") !== "Requestor" && (
          <CountBox
            title="Rejected"
            count={
              dashboardData.statusCounts ? dashboardData.statusCounts.Rejected : 0
            }
            color="#eb043c"
            icon="🚫"
            gradient="linear-gradient(135deg, #e17055 0%, #fd79a8 100%)"
            countKey="rejected"
          />
        )}
        {(localStorage.getItem("role") === "Budget_Team" || localStorage.getItem("role") === "Po_maker") && (
          <CountBox
            title="Holder"
            count={
              dashboardData.statusCounts ? dashboardData.statusCounts.Hold : 0
            }
            color="#6c757d"
            icon="⏸️"
            gradient="linear-gradient(135deg, #636e72 0%, #b2bec3 100%)"
            countKey="onHold"
          />
        )}
      </div>

      <div className="charts-layout">
        <div className="top-row">
          <div className="chart-box">
            <h3>PO Status Distribution</h3>
            <div className="chart-container">
              {!dashboardData.statusCounts || 
               (dashboardData.statusCounts.Pending === 0 && 
                dashboardData.statusCounts.Completed === 0 && 
                dashboardData.statusCounts.Rejected === 0 && 
                dashboardData.statusCounts.Hold === 0) ? (
                <EmptyState type="doughnut" />
              ) : (
              <Doughnut
                data={{
                  labels: ["Pending", "Completed", "Rejected", "On Hold"],
                  datasets: [
                    {
                      data: [
                        dashboardData.statusCounts
                          ? dashboardData.statusCounts.Pending
                          : 0,
                        dashboardData.statusCounts
                          ? dashboardData.statusCounts.Completed
                          : 0,
                        dashboardData.statusCounts
                          ? dashboardData.statusCounts.Rejected
                          : 0,
                        dashboardData.statusCounts
                          ? dashboardData.statusCounts.Hold
                          : 0,
                      ],
                      backgroundColor: [
                        "#ffeaa7",
                        "#00b894",
                        "#e17055",
                        "#636e72",
                      ],
                      borderWidth: 2,
                      borderColor: "#fff",
                      hoverBorderWidth: 3,
                      hoverOffset: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 12 },
                      },
                    },
                  },
                }}
              />
              )}
            </div>
          </div>

          <div className="chart-box chart-monthly-trends">
            <h3>Monthly PO Trends</h3>
            <div className="chart-container">
              {!dashboardData.monthWiseCounts || 
               Object.values(dashboardData.monthWiseCounts).every(m => !m || m.count === 0) ? (
                <EmptyState type="chart" />
              ) : (
              <Bar
                data={{
                  labels: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                  datasets: [
                    {
                      label: "PO Count",
                      data: dashboardData.monthWiseCounts
                        ? [
                            dashboardData.monthWiseCounts.January?.count || 0,
                            dashboardData.monthWiseCounts.February?.count || 0,
                            dashboardData.monthWiseCounts.March?.count || 0,
                            dashboardData.monthWiseCounts.April?.count || 0,
                            dashboardData.monthWiseCounts.May?.count || 0,
                            dashboardData.monthWiseCounts.June?.count || 0,
                            dashboardData.monthWiseCounts.July?.count || 0,
                            dashboardData.monthWiseCounts.August?.count || 0,
                            dashboardData.monthWiseCounts.September?.count || 0,
                            dashboardData.monthWiseCounts.October?.count || 0,
                            dashboardData.monthWiseCounts.November?.count || 0,
                            dashboardData.monthWiseCounts.December?.count || 0,
                          ]
                        : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                      backgroundColor: (context) => {
                        const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 350);
                        const colors = [
                          ['#667eea', '#764ba2'],
                          ['#f093fb', '#f5576c'],
                          ['#4facfe', '#00f2fe'],
                          ['#43e97b', '#38f9d7'],
                          ['#fa709a', '#fee140'],
                          ['#30cfd0', '#330867'],
                          ['#a8edea', '#fed6e3'],
                          ['#ff9a9e', '#fecfef'],
                          ['#ffecd2', '#fcb69f'],
                          ['#ff6e7f', '#bfe9ff'],
                          ['#e0c3fc', '#8ec5fc'],
                          ['#fbc2eb', '#a6c1ee']
                        ];
                        const [start, end] = colors[context.dataIndex % 12];
                        gradient.addColorStop(0, start);
                        gradient.addColorStop(1, end);
                        return gradient;
                      },
                      borderWidth: 0,
                      borderRadius: 12,
                      borderSkipped: false,
                      barPercentage: 0.65,
                      categoryPercentage: 0.75,
                    },
                  ],
                }}
               options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 1500,
                  easing: 'easeInOutQuart',
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    padding: 16,
                    titleColor: "#2d3748",
                    bodyColor: "#4a5568",
                    borderColor: "rgba(99, 102, 241, 0.2)",
                    borderWidth: 2,
                    displayColors: false,
                    cornerRadius: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                      label: (context) => {
                        const monthMap = [
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ];

                        const monthKey = monthMap[context.dataIndex];
                        const monthData = dashboardData.monthWiseCounts?.[monthKey];

                        const count = monthData?.count || 0;
                        const total = monthData?.total || 0;

                        return [
                          `PO Count: ${count}`,
                          `PO Value: ₹${total.toLocaleString("en-IN")}`,
                        ];
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.03)',
                      lineWidth: 1,
                    },
                    border: {
                      display: false,
                    },
                    ticks: {
                      font: {
                        size: 12,
                        weight: "500",
                        family: "'Inter', 'DMSans-Medium', sans-serif",
                      },
                      color: "#718096",
                      padding: 10,
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    border: {
                      display: false,
                    },
                    ticks: {
                      font: {
                        size: 12,
                        weight: "600",
                        family: "'Inter', 'DMSans-Medium', sans-serif",
                      },
                      color: "#2d3748",
                      padding: 8,
                    },
                  },
                },
              }}
              />
              )}
            </div>
          </div>
        </div>

        <div className="bottom-row">
          <div className="chart-box chart-suppliers">
            <h3>Top 5 Tickets</h3>
            <div className="chart-container">
              {!dashboardData.topTickets || dashboardData.topTickets.length === 0 ? (
                <EmptyState type="chart" />
              ) : (
              <Bar
                data={{
                  labels: dashboardData.topTickets
                    ? dashboardData.topTickets.map((t) => t.reqNo)
                    : [],
                  datasets: [
                    {
                      label: "Value",
                      data: dashboardData.topTickets
                        ? dashboardData.topTickets.map((t) => t.totalBaseValue)
                        : [],
                      backgroundColor: [
                        "#ff6b6b",
                        "#4ecdc4",
                        "#45b7d1",
                        "#96ceb4",
                        "#feca57",
                      ],
                      borderRadius: {
                        topLeft: 0,
                        topRight: 5,
                        bottomLeft: 0,
                        bottomRight: 5,
                      },
                      borderSkipped: false,
                      barThickness: 40,
                    },
                  ],
                }}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        display: false,
                      },
                    },
                    x: {
                      beginAtZero: true,
                      grid: {
                        color: "rgba(0,0,0,0.1)",
                      },
                    },
                  },
                }}
              />
              )}
            </div>
          </div>

          <div className="chart-box chart-tats">
            <h3>TAT</h3>
            <div className="chart-container">
              {!dashboardData.completedTat || 
               Object.keys(dashboardData.completedTat).length === 0 ||
               (dashboardData.completedTat["0D"] === 0 && 
                dashboardData.completedTat["1D"] === 0 && 
                dashboardData.completedTat["2-3D"] === 0 && 
                dashboardData.completedTat["4D+"] === 0) ? (
                <EmptyState type="polar" />
              ) : (
              <PolarArea
                data={{
                  labels: ["0D", "1D", "2-3D", "4D+"],
                  datasets: [
                    {
                      data: dashboardData.completedTat
                        ? [
                            dashboardData.completedTat["0D"] || 0,
                            dashboardData.completedTat["1D"] || 0,
                            dashboardData.completedTat["2-3D"] || 0,
                            dashboardData.completedTat["4D+"] || 0,
                          ]
                        : [0, 0, 0, 0],
                      backgroundColor: [
                        "#ff6b6b",
                        "#4ecdc4",
                        "#45b7d1",
                        "#96ceb4",
                      ],
                      borderWidth: 2,
                      borderColor: "#fff",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        padding: 8,
                        usePointStyle: true,
                        font: { size: 10 },
                        generateLabels: (chart) => {
                          const data = chart.data;
                          return data.labels.map((label, i) => ({
                            text: `${label}: ${data.datasets[0].data[i]}`,
                            fillStyle: data.datasets[0].backgroundColor[i],
                            strokeStyle: "#fff",
                            lineWidth: 2,
                            hidden: false,
                            index: i,
                          }));
                        },
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) =>
                          ` ${context.label}: ${context.raw} tickets`,
                      },
                    },
                  },
                  scales: {
                    r: {
                      ticks: { display: false },
                    },
                  },
                }}
              />
              )}
            </div>
          </div>

          <div className="chart-box">
            <h3>Global Distribution</h3>
            <div className="chart-container">
              <GlobeComponent
                countryCounts={dashboardData.countryCounts || {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
