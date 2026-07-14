import React, { useState, useRef, useEffect } from "react";
import { Table } from "antd";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { LuEye } from "react-icons/lu";
import { Tooltip } from "antd";
import { BaseUrl } from "../App.js";
import axios from "axios";
import { Tab, Tabs } from "react-bootstrap";
import { BiMessageDots } from "react-icons/bi";
import { MdCheckCircle, MdCancel, MdAccessTime } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import { setLoaderCallback } from "../utils/Configs.js";
import { FaEye } from "react-icons/fa";
import CustomModal from "./CustomModal.jsx";
import FileUploadModal from "./FileUploadModal.jsx";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import image from "../assets/images/time-and-date (1).png";
import moment from "moment";
import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationModal from "./NotificationModal.jsx";
import CollapsibleTabHeader from "../components/CollapsibleTabHeader.jsx";
import CustomExportComponent from "../components/CustomExportComponent.jsx";
import { applySearch } from "../utils/FormValidation.js";
import VendorAvatar from '../components/VendorAvatar';

const Businessapprover = (props) => {
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [getTicket, setGetTicket] = useState([]);
  // State to store users
  const [notifications, setNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem("notifications");
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });

  const [unreadCount, setUnreadCount] = useState(() => {
    const savedCount = localStorage.getItem("unreadCount");
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const isFetching = useRef(false);

  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchis, setSearchis] = useState(false);
  const [getTicketReject, setGetTicketReject] = useState([]);
  const [checkRes, setCheckRes] = useState("");
  const [checkAvailable, setCheckAvailable] = useState("");
  const [isRelatedCheck, setIsRelatedCheck] = useState("");
  const [poattach, setPoAttach] = useState([]);
  const [tabData, setTabData] = useState("");
  const isBrandTab = localStorage.getItem("selectedTicketTab") === "Brand";

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: false,
    showQuickJumper: false,
  });

  const TicketReject = async () => {
    try {
      const apiUrl = `${BaseUrl}api/ticket/rejected-tickets?stage=Business_Approver&ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
        ? "Brand"
        : "NonBrand"
        }`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setGetTicketReject(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    TicketReject();
  }, [isDataChanged]);
  const handleSearch = async (searchQuery) => {
    setSearchis(true);
    try {
      setIsLoading(true);
      const apiUrl = `${BaseUrl}api/ticket/ticket-search?search=${encodeURIComponent(
        searchQuery
      )}`;
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update search results
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchQuery(searchValue);
  };
  useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);
  useEffect(() => {
    if (!searchis && searchQuery !== "") {
      setSearchQuery("");
    }
  }, [searchis]);
  const DataTicket = async () => {
    const id = localStorage.getItem("id");
    try {
      const apiUrl =
        BaseUrl +
        `api/ticket/get-all-ba-approve-ticket/${id}?ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
          ? "Brand"
          : "NonBrand"
        }`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      // Filter tickets for 'Business_Approver' stage
      const filteredData = response.data.filter(
        (ticket) => ticket.stage === "Business_Approver"
      );
      setGetTicket(filteredData);
    } catch (error) {
      console.error("Error fetching ticket data:", error);
    }
  };

  useEffect(() => {
    localStorage.removeItem("notifications");
    localStorage.removeItem("unreadCount");
    setNotifications([]);
    setUnreadCount(0);
    return () => { };
  }, []);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
    localStorage.setItem("unreadCount", unreadCount.toString());
  }, [notifications, unreadCount]);

  const fetchNotifications = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    const userId = localStorage.getItem("id");
    const ticketType = localStorage.getItem("selectedTicketTab");
    try {
      const apiUrl = `${BaseUrl}api/ticket/get_notificationsById/${userId}?ticketType=${ticketType}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const newNotifications = response.data
        .filter((item) => item.role === role)
        .map((newTicket) => ({
          id: newTicket.ticketId,
          ids: newTicket.id,
          text: `${newTicket.message || "No ReqNo"}`,
          read: newTicket.isRead,
          readtext: newTicket.isText,
          role: newTicket.role,
        }));
      //  if(newNotifications[0]?.role === role) {
      if (
        newNotifications.length > 0 &&
        newNotifications.every((notif) => notif.role === role)
      ) {
        setNotifications((prevNotifications) => {
          const updatedNotifications = [
            ...newNotifications.filter(
              (newNotif) =>
                !prevNotifications.some((notif) => notif.id === newNotif.id)
            ),
            ...prevNotifications,
          ];
          return updatedNotifications;
        });
        const unreadNotificationsCount = newNotifications.filter(
          (notif) => !notif.read
        ).length;
        setUnreadCount((prevCount) => prevCount + unreadNotificationsCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    const socket = new SockJS(BaseUrl + "ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        const id = localStorage.getItem("id");
        stompClient.subscribe("/topic/requestTable", (message) => {
          const newTicket = JSON.parse(message.body);
          if (id == newTicket.businessApprover) {
            setGetTicket((prevTickets) => [...prevTickets, newTicket]); // Update tickets
            localStorage.removeItem("notifications");
            localStorage.removeItem("unreadCount");
            setNotifications([]);
            setUnreadCount(0);
            fetchNotifications();
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP Error:", frame);
      },
    });
    stompClient.activate();
    // Cleanup on unmount
    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);
  useEffect(() => {
    DataTicket();
    fetchNotifications();
  }, [isDataChanged]);

  useEffect(() => {
    const handleTabChange = () => {
      const selectedTab = localStorage.getItem("selectedTicketTab");
      if (selectedTab === "Brand" || selectedTab === "Non Brand") {
        DataTicket();
        DataTickethistab();
        TicketReject();
      }
    };
    window.addEventListener("tabChanged", handleTabChange);
    window.addEventListener("storage", handleTabChange);
    return () => {
      window.removeEventListener("tabChanged", handleTabChange);
      window.removeEventListener("storage", handleTabChange);
    };
  }, []);

  const DataTickethistab = async () => {
    try {
      const apiUrl =
        BaseUrl +
        `api/ticket/getAllComplticketsByStage/${role}?ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
          ? "Brand"
          : "NonBrand"
        }`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setgetTicketComtab(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchMttpData = async () => {
    try {
      const apiUrl = `${BaseUrl}mttp-ticket/by-stage?stage=${role}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const mttpData = response.data?.data || response.data || [];
      setGetMttpData(Array.isArray(mttpData) ? mttpData : []);
    } catch (error) {
      console.error("Error fetching MTTP data:", error);
      setGetMttpData([]);
    }
  };
  useEffect(() => {
    DataTickethistab();
    fetchMttpData();
    fetchMttpCompletedData();
    fetchMttpRejectedData();
  }, [isDataChanged]);

  const fetchMttpCompletedData = async () => {
    try {
      const apiUrl = `${BaseUrl}mttp-ticket/get-all-completed-ticket?stage=${role}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.data.status) {
        setMttpCompletedData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching MTTP data:", error);
    }
  };
  const fetchMttpRejectedData = async () => {
    try {
      const apiUrl = `${BaseUrl}mttp-ticket/rejected-tickets?stage=${role}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.data.status) {
        setMttpRejectedData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching MTTP data:", error);
    }
  };
  useEffect(() => {
    fetchMttpRejectedData();
  }, [isDataChanged]);
  const [remarkModal, setRemarkModal] = useState(false);
  const [viewmodal, setviewModal] = useState(false);
  const handleRCancel = () => {
    setRemarkModal(false);
    setRemarks("");
    setApproveModal(false);
  };
  const [approveModal, setApproveModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const handleviewShow = () => setviewModal(true);
  const [stsmodal, setstsModal] = useState(false);
  const handlestsClose = () => setstsModal(false);
  const handlestsShow = () => setstsModal(true);
  const [errorRemarks, setErrorRemarks] = useState("");
  const [errorApprove, setErrorApprove] = useState("");
  const [brandDataArray, setBrandDataArray] = useState([]);
  const [brandDataLength, setBrandDataLength] = useState(0); // Initialize with 0 or any default value
  const [isEditable, setIsEditable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("");
  const [formData, setFormData] = useState({
    vendorName: "",
    vendorLocation: "",
    gstNo: "",
    vendorCode: "",
    vendorMailId: "",
    currency: "",
    paymentTerm: "",
    remarks: "",
  });
  const [isView, setIsView] = useState(false);
  const [isModalView, setIsModalView] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setMode("");
    setIsView(false);
    setBrandDataLength(0);
    setIsModalOpen(false);
    setFormData({});
    setTabData("");
  };
  const title_ticket_table = [
    {
      title: "S.No",
      dataIndex: "brand",
      render: (text, record, index) => (
        <>
          <pre>{index + 1}</pre>{" "}
        </>
      ),
    },
    {
      title: "Req No",
      dataIndex: "reqNo",
      render: (text) => <pre className="pre-text">{text}</pre>,
    },

    {
      title: "Req Date",
      dataIndex: "createdDate",
      render: (createdDate, _, index) => {
        return (
          <React.Fragment key={`createdDate-${index}`}>
            <pre>{createdDate || ""}</pre>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        const vendorNameA = a.formattedCreatedAt || "";
        const vendorNameB = b.formattedCreatedAt || "";
        return vendorNameA.localeCompare(vendorNameB);
      },
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Update At",
      dataIndex: "updatedAt",
      render: (updatedAt, _, index) => {
        const timeOnly = updatedAt
          ? new Date(updatedAt).toLocaleTimeString()
          : "";
        return (
          <React.Fragment key={`updatedAt-${index}`}>
            <pre>{timeOnly}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Req Name",
      dataIndex: "username",
      render: (username, _, index) => {
        return (
          <React.Fragment key={`username-${index}`}>
            <pre>{username || ""}</pre> {/* Display username */}
          </React.Fragment>
        );
      },
    },

    {
      title: "Vendor Name",
      dataIndex: "vendorName",
      render: (vendorName, _, index) => {
        return (
          <React.Fragment key={`vendorName-${index}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* <VendorAvatar name={vendorName} /> */}
              <pre>{vendorName || ""}</pre>
            </div>
          </React.Fragment>
        );
      },
    },
    {
      title: isBrandTab ? "Brand and PO Description" : "PO Description",
      dataIndex: "brand",
      render: (brand, record, index) => {
        const firstBrand = brand?.[0]
          ? isBrandTab
            ? `${brand[0].detailsBrand || ""} - ${brand[0].poDescription || ""}`
            : brand[0].poDescription || ""
          : "";

        const bulletPoints =
          brand
            ?.map((item) =>
              isBrandTab
                ? `• ${item.detailsBrand || ""} - ${item.poDescription || ""}`
                : `• ${item.poDescription || ""}`
            )
            .join("\n") || "";

        return (
          <React.Fragment key={`brand-${index}`}>
            <Tooltip
              overlayClassName="bomb-tooltip"
              title={
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {bulletPoints}
                </pre>
              }
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <pre>{firstBrand}</pre>
                {brand?.length > 1 && (
                  <span
                    style={{
                      backgroundColor: "#52c41a",
                      color: "white",
                      borderRadius: "10px",
                      padding: "2px 6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      marginBottom: "16px",
                    }}
                  >
                    {brand.length}
                  </span>
                )}
              </div>
            </Tooltip>
          </React.Fragment>
        );
      },
    },
    {
      title: "Total Base Value",
      dataIndex: "totalBaseValue",
      render: (totalBaseValue, _, index) => {
        return (
          <React.Fragment key={`totalBaseValue-${index}`}>
            ₹ {totalBaseValue ? totalBaseValue.toLocaleString('en-IN') : "0"}
          </React.Fragment>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "stage",
      render: (stage, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        return (
          <span
            key={`status-${index}`}
            style={{
              backgroundColor: "transparent",
              color: isCompleted ? "#52c41a" : "#faad14",
              padding: "0",
              borderRadius: "0",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {isCompleted ? <MdCheckCircle size={14} /> : <MdAccessTime size={14} />}
            {isCompleted ? "Completed" : formatStatus(record.stage)}
          </span>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <div className="action__icons__businessapprover">
              <Tooltip title="View Details">
                <a
                  onClick={() => {
                    setIsView(true);
                    Viewticketfunction(record.id);
                    showModal();
                    setMode("view");
                  }}
                  className="eye"
                >
                  <LuEye />
                </a>
              </Tooltip>
              <Tooltip title="View History">
                <a
                  onClick={() => {
                    handlestsShow();
                    historyyticketfunction(record.id);
                  }}
                  className="eyee"
                >
                  <BiMessageDots />
                </a>
              </Tooltip>
            </div>
          </>
        );
      },
    },
  ];

  const [getTickethistab, setgetTickethistab] = useState([]);
  const [getTicketComtab, setgetTicketComtab] = useState([]);
  const [getMttpData, setGetMttpData] = useState([]);
  const [getMttpCompletedData, setMttpCompletedData] = useState([]);
  const [getMttpRejectedData, setMttpRejectedData] = useState([]);
  const title_ticket_tablehistab = [
    {
      title: "S.No",
      dataIndex: "brand",
      // key: 'brand',
      dataIndex: "1",
      render: (text, record, index) => (
        <pre>
          <span>{index + 1}</span>
        </pre>
      ),
    },
    {
      title: "Req No",
      dataIndex: "reqNo",
      render: (text) => <pre className="pre-text">{text}</pre>,
    },

    {
      title: "Req Date",
      dataIndex: "createdDate",
      render: (createdDate, _, index) => {
        return (
          <React.Fragment key={`createdDate-${index}`}>
            <pre>{createdDate || ""}</pre>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        const vendorNameA = a.createdDate || "";
        const vendorNameB = b.createdDate || "";
        return vendorNameA.localeCompare(vendorNameB);
      },
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Update At",
      dataIndex: "updatedAt",
      render: (updatedAt, _, index) => {
        const timeOnly = updatedAt
          ? new Date(updatedAt).toLocaleTimeString()
          : "";
        return (
          <React.Fragment key={`updatedAt-${index}`}>
            <pre>{timeOnly}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Req Name",
      dataIndex: "username",
      render: (username, _, index) => {
        return (
          <React.Fragment key={`username-${index}`}>
            <pre>{username || ""}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Vendor Name",
      dataIndex: "vendorName",
      render: (vendorName, _, index) => {
        return (
          <React.Fragment key={`vendorName-${index}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* <VendorAvatar name={vendorName} /> */}
              <pre>{vendorName || ""}</pre>
            </div>
          </React.Fragment>
        );
      },
    },
    {
      title: isBrandTab ? "Brand and PO Description" : "PO Description",
      dataIndex: "brand",
      render: (brand, record, index) => {
        const firstBrand = brand?.[0]
          ? isBrandTab
            ? `${brand[0].detailsBrand || ""} - ${brand[0].poDescription || ""}`
            : brand[0].poDescription || ""
          : "";

        const bulletPoints =
          brand
            ?.map((item) =>
              isBrandTab
                ? `• ${item.detailsBrand || ""} - ${item.poDescription || ""}`
                : `• ${item.poDescription || ""}`
            )
            .join("\n") || "";

        return (
          <React.Fragment key={`brand-${index}`}>
            <Tooltip
              overlayClassName="bomb-tooltip"
              title={
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {bulletPoints}
                </pre>
              }
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <pre>{firstBrand}</pre>
                {brand?.length > 1 && (
                  <span
                    style={{
                      backgroundColor: "#52c41a",
                      color: "white",
                      borderRadius: "10px",
                      padding: "2px 6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      marginBottom: "16px",
                    }}
                  >
                    {brand.length}
                  </span>
                )}
              </div>
            </Tooltip>
          </React.Fragment>
        );
      },
    },
    {
      title: "Total Base Value",
      dataIndex: "totalBaseValue",
      render: (totalBaseValue, _, index) => {
        return (
          <React.Fragment key={`totalBaseValue-${index}`}>
            ₹ {totalBaseValue ? totalBaseValue.toLocaleString('en-IN') : "0"}
          </React.Fragment>
        );
      },
    },
    ...(!isBrandTab ? [{
      title: "PO Number",
      dataIndex: "poNumber",
      render: (poNumber, _, index) => {
        const values = Array.isArray(poNumber) ? poNumber : poNumber ? [poNumber] : [];
        if (!values.length) return <pre>-</pre>;
        const bulletPoints = values.map((v) => `• ${v}`).join("\n");
        return (
          <React.Fragment key={`poNumber-${index}`}>
            <Tooltip overlayClassName="bomb-tooltip" title={<pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{bulletPoints}</pre>}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <pre>{values[0]}</pre>
                {values.length > 1 && (
                  <span style={{ backgroundColor: "#52c41a", color: "white", borderRadius: "10px", padding: "2px 6px", fontSize: "11px", fontWeight: "bold", marginBottom: "16px" }}>
                    {values.length}
                  </span>
                )}
              </div>
            </Tooltip>
          </React.Fragment>
        );
      },
    }] : []),
    {
      title: "Status",
      dataIndex: "stage",
      render: (text, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        return (
          <span
            key={`status-${index}`}
            style={{
              backgroundColor: "transparent",
              color: isCompleted ? "#52c41a" : "#faad14",
              padding: "0",
              borderRadius: "0",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {isCompleted ? <MdCheckCircle size={14} /> : <MdAccessTime size={14} />}
            {isCompleted ? "Completed" : formatStatus(record.stage)}
          </span>
        );
      },
    },

    {
      title: "Action",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <div className="action__icons__businessapprover">
              <Tooltip title="View Details">
                <a
                  onClick={() => {
                    setIsView(true);
                    Viewticketfunction(record.id);
                    showModal();
                    setTabData("Completed");
                  }}
                  className="eye"
                >
                  <LuEye />
                </a>
              </Tooltip>
              <Tooltip title="View History">
                <a
                  onClick={() => {
                    handlestsShow();
                    historyyticketfunction(record.id);
                  }}
                  className="eyee"
                >
                  <BiMessageDots />
                </a>
              </Tooltip>
            </div>
          </>
        );
      },
    },
  ];
  const title_ticket_tablereject = [
    {
      title: "S.No",
      dataIndex: "brand",
      // key: 'brand',
      dataIndex: "1",
      render: (text, record, index) => (
        <pre>
          <span>{index + 1}</span>
        </pre>
      ),
    },
    {
      title: "Req No",
      dataIndex: "reqNo",
      render: (text) => <pre className="pre-text">{text}</pre>,
    },
    {
      title: "Req Date",
      dataIndex: "createdDate",
      render: (createdDate, _, index) => {
        return (
          <React.Fragment key={`createdDate-${index}`}>
            <pre>{createdDate || ""}</pre>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        const vendorNameA = a.createdDate || "";
        const vendorNameB = b.createdDate || "";
        return vendorNameA.localeCompare(vendorNameB);
      },
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Update At",
      dataIndex: "updatedAt",
      render: (updatedAt, _, index) => {
        const timeOnly = updatedAt
          ? new Date(updatedAt).toLocaleTimeString()
          : "";
        return (
          <React.Fragment key={`updatedAt-${index}`}>
            <pre>{timeOnly}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Req Name",
      dataIndex: "username",
      render: (username, _, index) => {
        return (
          <React.Fragment key={`username-${index}`}>
            <pre>{username || ""}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Vendor Name",
      dataIndex: "vendorName",
      render: (vendorName, _, index) => {
        return (
          <React.Fragment key={`vendorName-${index}`}>
            <div style = {{display: "flex", alignItems: "center", gap: "6px"}}>
            {/* <VendorAvatar name={vendorName} /> */}
            <pre>{vendorName || ""}</pre>
            </div>
          </React.Fragment>
        );
      },
    },
    {
      title: isBrandTab ? "Brand and PO Description" : "PO Description",
      dataIndex: "brand",
      render: (brand, record, index) => {
        const firstBrand = brand?.[0]
          ? isBrandTab
            ? `${brand[0].detailsBrand || ""} - ${brand[0].poDescription || ""}`
            : brand[0].poDescription || ""
          : "";

        const bulletPoints =
          brand
            ?.map((item) =>
              isBrandTab
                ? `• ${item.detailsBrand || ""} - ${item.poDescription || ""}`
                : `• ${item.poDescription || ""}`
            )
            .join("\n") || "";

        return (
          <React.Fragment key={`brand-${index}`}>
            <Tooltip
              overlayClassName="bomb-tooltip"
              title={
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {bulletPoints}
                </pre>
              }
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <pre>{firstBrand}</pre>
                {brand?.length > 1 && (
                  <span
                    style={{
                      backgroundColor: "#52c41a",
                      color: "white",
                      borderRadius: "10px",
                      padding: "2px 6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      marginBottom: "16px",
                    }}
                  >
                    {brand.length}
                  </span>
                )}
              </div>
            </Tooltip>
          </React.Fragment>
        );
      },
    },
    {
      title: "Total Base Value",
      dataIndex: "totalBaseValue",
      render: (totalBaseValue, _, index) => {
        return (
          <React.Fragment key={`totalBaseValue-${index}`}>
            ₹ {totalBaseValue ? totalBaseValue.toLocaleString('en-IN') : "0"}
          </React.Fragment>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "stage",
      render: (text, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        return (
          <span
            key={`status-${index}`}
            style={{
              backgroundColor: "transparent",
              color: isCompleted ? "#52c41a" : "#faad14",
              padding: "0",
              borderRadius: "0",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {isCompleted ? <MdCheckCircle size={14} /> : <MdAccessTime size={14} />}
            {isCompleted ? "Completed" : formatStatus(record.stage)}
          </span>
        );
      },
    },

    {
      title: "Action",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <div className="action__icons__businessapprover">
              <Tooltip title="View Details">
                <a
                  onClick={() => {
                    setIsView(true);
                    Viewticketfunction(record.id);
                    showModal();
                  }}
                  className="eye"
                >
                  <LuEye />
                </a>
              </Tooltip>
              <Tooltip title="View History">
                <a
                  onClick={() => {
                    handlestsShow();
                    historyyticketfunction(record.id);
                  }}
                  className="eyee"
                >
                  <BiMessageDots />
                </a>
              </Tooltip>
            </div>
          </>
        );
      },
    },
  ];
  const [ticketdataedit, setticketdataedit] = useState({
    // vendorMailId: ticketdataedit.vendorMailId,
    // Add other fields as needed
  });
  const [editid, seteditId] = useState({});
  const [ticket_brand_dataedit, setticket_brand_dataedit] = useState([
    {
      // brandOrNonBrand: ticket_brand_dataedit.brandOrNonBrand,
      // Add other brand fields as needed
    },
  ]);
  const [ticket_history_data, setticket_history_data] = useState([]);
  const [fileupload, setfileModal] = useState(false);
  const [selectedMttpData, setSelectedMttpData] = useState(null);
  const [approveReject, setApproveReject] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);

  const handlefileClose = () => {
    setfileModal(false);
    setSelectedMttpData(null);
    setApproveReject(false);
    setButtonDisable(false);
  };

  const mttp_table = [
    {
      title: "S.No",
      dataIndex: "brand",
      render: (text, record, index) => (
        <>
          <pre>{index + 1}</pre>{" "}
        </>
      ),
    },
    {
      title: "Req No",
      dataIndex: "reqNo",
      render: (text) => <pre className="pre-text">{text}</pre>,
    },

    {
      title: "Req Date",
      dataIndex: "createdAt",
      render: (createdAt, _, index) => {
        const formattedDate = createdAt
          ? new Date(createdAt).toLocaleDateString()
          : "";
        return (
          <React.Fragment key={`createdAt-${index}`}>
            <pre>{formattedDate}</pre>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      },
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Update At",
      dataIndex: "updatedAt",
      render: (updatedAt, _, index) => {
        const timeOnly = updatedAt
          ? new Date(updatedAt).toLocaleTimeString()
          : "";
        return (
          <React.Fragment key={`updatedAt-${index}`}>
            <pre>{timeOnly}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Req Name",
      dataIndex: "reqName",
      render: (reqName, _, index) => {
        return (
          <React.Fragment key={`reqName-${index}`}>
            <pre>{reqName || ""}</pre> {/* Display reqName */}
          </React.Fragment>
        );
      },
    },

    {
      title: "Status",
      dataIndex: "stage",
      render: (stage, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        return (
          <span
            key={`status-${index}`}
            style={{
              backgroundColor: "transparent",
              color: isCompleted ? "#52c41a" : "#faad14",
              padding: "0",
              borderRadius: "0",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {isCompleted ? <MdCheckCircle size={14} /> : <MdAccessTime size={14} />}
            {isCompleted ? "Completed" : formatStatus(record.stage)}
          </span>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <div className="action__icons__businessapprover">
              <Tooltip title="View Details">
                <a
                  onClick={() => {
                    setSelectedMttpData(record);
                    setfileModal(true);
                    setApproveReject(true);
                  }}
                  className="eye"
                >
                  <LuEye />
                </a>
              </Tooltip>
              <Tooltip title="View History">
                <a
                  onClick={() => {
                    handlestsShow();
                    setticket_history_data(record.historyList || []);
                  }}
                  className="eyee"
                >
                  <BiMessageDots />
                </a>
              </Tooltip>
            </div>
          </>
        );
      },
    },
  ];
  const mttp_draft_table = [
    {
      title: "S.No",
      dataIndex: "brand",
      // key: 'brand',
      dataIndex: "1",
      render: (text, record, index) => (
        <pre>
          <span>{index + 1}</span>
        </pre>
      ),
    },
    {
      title: "Req No",
      dataIndex: "reqNo",
      render: (text) => <pre className="pre-text">{text}</pre>,
    },

    {
      title: "Req Date",
      dataIndex: "createdAt",
      render: (createdAt, _, index) => {
        const formattedDate = createdAt
          ? new Date(createdAt).toLocaleDateString()
          : "";
        return (
          <React.Fragment key={`createdAt-${index}`}>
            <pre>{formattedDate}</pre>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      },
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Update At",
      dataIndex: "updatedAt",
      render: (updatedAt, _, index) => {
        const timeOnly = updatedAt
          ? new Date(updatedAt).toLocaleTimeString()
          : "";
        return (
          <React.Fragment key={`updatedAt-${index}`}>
            <pre>{timeOnly}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Req Name",
      dataIndex: "reqName",
      render: (reqName, _, index) => {
        return (
          <React.Fragment key={`reqName-${index}`}>
            <pre>{reqName || ""}</pre>
          </React.Fragment>
        );
      },
    },

    {
      title: "Status",
      dataIndex: "stage",
      render: (text, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        return (
          <span
            key={`status-${index}`}
            style={{
              backgroundColor: "transparent",
              color: isCompleted ? "#52c41a" : "#faad14",
              padding: "0",
              borderRadius: "0",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {isCompleted ? <MdCheckCircle size={14} /> : <MdAccessTime size={14} />}
            {isCompleted ? "Completed" : formatStatus(record.stage)}
          </span>
        );
      },
    },

    {
      title: "Action",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <div className="action__icons__businessapprover">
              <Tooltip title="View Details">
                <a
                  onClick={() => {
                    setfileModal(true);
                    setSelectedMttpData(record);
                    setButtonDisable(true);
                  }}
                  className="eye"
                >
                  <LuEye />
                </a>
              </Tooltip>
              <Tooltip title="View History">
                <a
                  onClick={() => {
                    handlestsShow();
                    setticket_history_data(record?.historyList || []);
                  }}
                  className="eyee"
                >
                  <BiMessageDots />
                </a>
              </Tooltip>
            </div>
          </>
        );
      },
    },
  ];
  const mttp_completed_table = [
    {
      title: "S.No",
      dataIndex: "brand",
      // key: 'brand',
      dataIndex: "1",
      render: (text, record, index) => (
        <pre>
          <span>{index + 1}</span>
        </pre>
      ),
    },
    {
      title: "Req No",
      dataIndex: "reqNo",
      render: (text) => <pre className="pre-text">{text}</pre>,
    },

    {
      title: "Req Date",
      dataIndex: "createdAt",
      render: (createdAt, _, index) => {
        const formattedDate = createdAt
          ? new Date(createdAt).toLocaleDateString()
          : "";
        return (
          <React.Fragment key={`createdAt-${index}`}>
            <pre>{formattedDate}</pre>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      },
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Update At",
      dataIndex: "updatedAt",
      render: (updatedAt, _, index) => {
        const timeOnly = updatedAt
          ? new Date(updatedAt).toLocaleTimeString()
          : "";
        return (
          <React.Fragment key={`updatedAt-${index}`}>
            <pre>{timeOnly}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Req Name",
      dataIndex: "reqName",
      render: (reqName, _, index) => {
        return (
          <React.Fragment key={`reqName-${index}`}>
            <pre>{reqName || ""}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "stage",
      render: (text, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        return (
          <span
            key={`status-${index}`}
            style={{
              backgroundColor: "transparent",
              color: isCompleted ? "#52c41a" : "#faad14",
              padding: "0",
              borderRadius: "0",
              fontSize: "12px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {isCompleted ? <MdCheckCircle size={14} /> : <MdAccessTime size={14} />}
            {isCompleted ? "Completed" : formatStatus(record.stage)}
          </span>
        );
      },
    },

    {
      title: "Action",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <div className="action__icons__businessapprover">
              <Tooltip title="View Details">
                <a
                  onClick={() => {
                    setSelectedMttpData(record);
                    setfileModal(true);
                    setButtonDisable(true);
                  }}
                  className="eye"
                >
                  <LuEye />
                </a>
              </Tooltip>
              <Tooltip title="View History">
                <a
                  onClick={() => {
                    handlestsShow();
                    setticket_history_data(record?.historyList || []);
                  }}
                  className="eyee"
                >
                  <BiMessageDots />
                </a>
              </Tooltip>
            </div>
          </>
        );
      },
    },
  ];
  const Viewticketfunction = async (id) => {
    try {
      const apiUrl = BaseUrl + "api/ticket/getTicketById/" + id;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const record = await response.json();
      setFormData({
        ...record.data,
      });

      seteditId(id);
      setCheckRes(record?.data?.budgetDetails);
      setCheckAvailable(record?.data?.reason);
      if (record?.data?.isRelated !== null) {
        setIsRelatedCheck(record?.data?.isRelated ? "YES" : "NO");
      }
      const brandData = record?.data?.brand;
      setBrandDataArray(brandData);
      if (Array.isArray(brandData) && brandData.length > 0) {
        setticket_brand_dataedit([...brandData]);
        setBrandDataLength(brandData.length);
      }
      const historyList = record?.data?.historyList;
      const rejectedStatus = historyList
        ?.filter((entry) => entry.status.toLowerCase() === "approved")
        ?.slice(-1)[0];

      setPoAttach(rejectedStatus?.name);
      if (Array.isArray(historyList) && historyList.length > 0) {
        // Check if both conditions are satisfied
        const hasBusinessApproverReject = historyList.some(
          (item) =>
            item.name === "Business_Approver" && item.status === "Reject"
        );

        const hasPOScreeningReject = historyList.some(
          (item) => item.name === "PO_Screening" && item.status === "Reject"
        );
        const hasDraft = historyList.some(
          (item) => item.name === "Requestor" && item.status === "Draft"
        );

        if (hasBusinessApproverReject || hasPOScreeningReject || hasDraft) {
          setIsEditable(true);
        } else {
          setIsEditable(false);
        }
      } else {
        console.error("Brand data is not in the expected format or is empty.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

  // Completed tab
  const [filteredDataCom, setFilteredDataCom] = useState([]);
  useEffect(() => {
    setFilteredDataCom(applySearch(getTicketComtab, searchQuery));
  }, [getTicketComtab, searchQuery]);

  // Inbox tab
  const [filteredDatainbox, setFilteredDatainbox] = useState([]);
  useEffect(() => {
    setFilteredDatainbox(applySearch(getTicket, searchQuery));
  }, [getTicket, searchQuery]);

  // MTTP tab
  const [filteredDataMttp, setFilteredDataMttp] = useState([]);
  const [filteredCompleted, setFilteredCompleted] = useState([]);
  const [filteredRejected, setFilteredRejected] = useState([]);
  useEffect(() => {
    if (!Array.isArray(getMttpData)) {
      setFilteredDataMttp([]);
      return;
    }

    const filtered = getMttpData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.createdAt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredDataMttp(filtered);
  }, [getMttpData, searchQuery]);
  // MTTPtab
  useEffect(() => {
    const filtered = getMttpCompletedData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompleted(filtered);
  }, [getMttpCompletedData, searchQuery]);

  useEffect(() => {
    fetchMttpCompletedData();
  }, []);
  // Rejected tab
  useEffect(() => {
    const filtered = getMttpRejectedData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRejected(filtered);
  }, [getMttpRejectedData, searchQuery]);

  useEffect(() => {
    fetchMttpRejectedData();
  }, []);
  const handleMttpUpdate = async (data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl =
        BaseUrl +
        `mttp-ticket/approver-ticket/${data.id}?status=${data.approveStatus
        }&remarks=${encodeURIComponent(data.remarks)}`;
      const formData = new FormData();
      const response = await axios.post(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setSuccessMessage(
          `Ticket ${data.approveStatus.toLowerCase()} successfully`
        );
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        fetchMttpData();
        handlefileClose();
        fetchMttpCompletedData();
        fetchMttpRejectedData();
      }
    } catch (error) {
      console.error("Error updating MTTP ticket:", error);
    }
  };

  const [filteredDataReject, setFilteredDataReject] = useState([]);
  useEffect(() => {
    setFilteredDataReject(applySearch(getTicketReject, searchQuery));
  }, [getTicketReject, searchQuery]);

  const handleBrandChange = (index, field, value) => {
    const updatedBrandData = [...ticket_brand_dataedit];
    updatedBrandData[index] = {
      ...ticket_brand_dataedit[index],
      [field]: value,
    };
    setticket_brand_dataedit(updatedBrandData);
  };

  const handleAddBrand = () => {
    setticket_brand_dataedit([
      ...ticket_brand_dataedit,
      { brandOrNonBrand: "" },
    ]);
  };

  const handleRemoveBrand = (index) => {
    const updatedBrandData = [...ticket_brand_dataedit];
    updatedBrandData.splice(index, 1);
    setticket_brand_dataedit(updatedBrandData);
  };
  const downloadFile = async (
    poCopyAttachment,
    attachment,
    action = "download"
  ) => {
    const apiUrl = `${BaseUrl}api/ticket/file-download/${poCopyAttachment || attachment
      }`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.download = poCopyAttachment;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (action === "view") {
        window.open(url, "_blank");
      }
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000 * 60);
    } catch (error) {
      console.error("Error handling file:", error.message);
    }
  };
  const historyyticketfunction = async (id) => {
    try {
      const apiUrl = BaseUrl + "api/ticket/getTicketById/" + id;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const record = await response.json();
      setticketdataedit({
        ...record.data,
      });
      setticket_history_data({
        ...record.data.historyList,
      });
      const brandData1 = record?.data?.historyList;
      if (Array.isArray(brandData1) && brandData1.length > 0) {
        setticket_history_data([...brandData1]);
      } else {
        console.error("Brand data is not in the expected format or is empty.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const requestData = {
      ticketId: editid,
      approvalStatus: "Approved",
      remarks: remarks,
    };

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = BaseUrl + "api/ticket/ticket-approve";
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setIsLoading(false);
      setSuccessMessage("Approved successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
      setviewModal(false);
      setApproveModal(false);
      setIsDataChanged(true);
      setRemarks(""); // Reset remarks
      setErrorRemarks(null);

      fetchNotifications();
      const notificationIdToDelete = notifications.find(
        (notif) => notif.id === editid // Assuming ticketId links to the notification
      );
      handleClearNotification(notificationIdToDelete);
      DataTicket();
      setRemarks("");
      setErrorRemarks(null);
      handleRCancel();
    } catch (error) {
      console.error("Error sending data to backend:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormApprove = async (formData) => {
    if (!("remarks" in formData) || !formData.remarks) {
      formData.remarks = "";
    }
    const encodedRemarks = encodeURIComponent(formData.remarks || "");
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}api/ticket/ticket-approve?ticketId=${editid}&approvalStatus=Approved&remarks=${encodedRemarks}`;

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        setSuccessMessage("Ticket approved successfully");
        setMode(" ");
        DataTicket();
        DataTickethistab();
        setIsModalView(true);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        const notificationIdToDelete = notifications.find(
          (notif) => notif.id === editid // Assuming ticketId links to the notification
        );
        handleClearNotification(notificationIdToDelete);
        setIsModalOpen(false);
      } else {
        const errorMessage =
          response.data?.message || "Error occurred while submitting data.";
        setErrorApprove(errorMessage);
      }
    } catch (error) {
      if (error.response) {
        const errorMessage =
          error.response.data ||
          "An unexpected error occurred. Please try again.";
        setErrorApprove(errorMessage);
      } else {
        setErrorApprove("An unexpected error occurred. Please try again.");
      }
    }
  };
  const handleFormRemarks = async (formData) => {
    const encodedRemarks = encodeURIComponent(formData.remarks || "");
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}api/ticket/ticket-approve?ticketId=${editid}&approvalStatus=Reject&remarks=${encodedRemarks}`;

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        setSuccessMessage("Rejected successfully!");
        setMode(" ");
        DataTicket();
        TicketReject();
        setIsModalView(true);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        const notificationIdToDelete = notifications.find(
          (notif) => notif.id === editid // Assuming ticketId links to the notification
        );
        handleClearNotification(notificationIdToDelete);
        setIsModalOpen(false);
      } else {
        const errorMessage =
          response.data?.message || "Error occurred while submitting data.";
        setErrorRemarks(errorMessage);
      }
    } catch (error) {
      if (error.response) {
        const errorMessage =
          error.response.data ||
          "An unexpected error occurred. Please try again.";
        setErrorRemarks(errorMessage);
      } else {
        setErrorRemarks("An unexpected error occurred. Please try again.");
      }
    }
    const notificationIdToDelete = notifications.find(
      (notif) => notif.id === editid // Assuming ticketId links to the notification
    );
    handleClearNotification(notificationIdToDelete);
  };

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("selectedStatusTab") || "first";
  });

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setSearchis(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  useEffect(() => { }, [activeTab]);

  const pageSize = 10;

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      const updatedNotifications = notifications.map((notif) => ({
        ...notif,
        read: true,
      }));
      setNotifications(updatedNotifications);
      localStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );
    }
  };
  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };
  const handleClearNotification = async (notification) => {
    try {
      const response = await axios.delete(
        `${BaseUrl}api/ticket/delete_notification/${notification.ids}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const updatedNotifications = notifications.filter(
        (notif) => notif.id !== notification.id
      );
      setNotifications(updatedNotifications);
      setUnreadCount(
        updatedNotifications.filter((notif) => !notif.readtext).length
      );
      localStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Clear all notifications
  const handleClearAllNotifications = async () => {
    try {
      const userId = localStorage.getItem("id");
      const response = await axios.delete(
        `${BaseUrl}api/ticket/deleteall_notificationsByuserId/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("notifications");
    localStorage.removeItem("unreadCount");
  };

  const handleNotificationClick = async (notification) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === notification.id ? { ...notif, readtext: true } : notif
    );
    setNotifications(updatedNotifications);
    setUnreadCount(
      updatedNotifications.filter((notif) => !notif.readtext).length
    );
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
    try {
      const response = await axios.put(
        `${BaseUrl}api/ticket/update_notification/${notification.ids}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating notification:", error);
    }
    showModal();
    setMode("view");
    setIsView(true);
    Viewticketfunction(notification.id);
  };
  return (
    <div>
      {successMessage && (
        <div className="success-message-container">
          <div className="success-message">{successMessage}</div>
        </div>
      )}
      <div className="container-fluid main-content">
        <Row>
          <Col xl={6} lg={6} md={6} sm={12} className={"txt_title"}>
            Business Approver
            <div className="budgetstream_container">
              <div className="pos_relative">
                {/* Notification Bell */}
                <button className="notify_bell" onClick={handleBellClick}>
                  🔔
                  {unreadCount > 0 && (
                    <span className="notify_back_contain">{unreadCount}</span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <NotificationModal
                  show={showNotifications}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onClose={handleCloseNotifications}
                  onClearNotification={handleClearNotification}
                  onClearAllNotifications={handleClearAllNotifications}
                  onNotificationClick={handleNotificationClick}
                />
              </div>
            </div>
          </Col>
        </Row>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ flex: 1 }}>
            {name?.trim().toLowerCase() === "devaraju gajjela" || name?.trim().toLowerCase() === "gopinath banerjee" ? (
              <CollapsibleTabHeader
                onTabSelect={handleTabSelect}
                activeTab={activeTab}
                tabKeys={["first", "fourth", "fifth", "sixth", "ninth", "tenth"]}
              />
            ) : (
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabSelect}
                className="mb-0"
              >
                <Tab eventKey="first" title="INBOX" />
                <Tab eventKey="fourth" title="REJECTED" />
                <Tab eventKey="fifth" title="COMPLETED" />
              </Tabs>
            )}
          </div>
          <Box
            className="search_box"
            component="form"
            onSubmit={(e) => e.preventDefault()}
            defaultActiveKey="first"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end", // Align both items to the right
              marginLeft: "20px",
              gap: "20px",
            }}
            noValidate
            autoComplete="off"
          >
            <CustomExportComponent activeTab={activeTab} />
            <TextField
              className="search_input"
              id="outlined-basic"
              placeholder="Search "
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment className="search_icon">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: "30ch",
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#C4C4C4",
                    borderWidth: 1,
                    borderStyle: "solid",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#C4C4C4",
                  },
                },
              }}
            />
          </Box>
        </div>
        <div className="tab-content">
          {activeTab === "first" && (
            <div className="container-fluid table_bg">
              <div className="table-responsive">
                <Table
                  columns={title_ticket_table}
                  loading={isLoading}
                  dataSource={filteredDatainbox}
                  pagination={{ pageSize: 10 }}
                  footer={(currentPageData) => {
                    return (
                      <span>
                        Showing {""}
                        {pageSize > currentPageData.length
                          ? currentPageData.length
                          : pageSize}{" "}
                        of {currentPageData.length} Items.
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === "fourth" && (
            <div className="container-fluid table_bg">
              <div className="table-responsive">
                <Table
                  columns={title_ticket_tablereject}
                  loading={isLoading}
                  dataSource={filteredDataReject}
                  pagination={{ pageSize: 10 }}
                  footer={(currentPageData) => {
                    return (
                      <span>
                        Showing {""}
                        {pageSize > currentPageData.length
                          ? currentPageData.length
                          : pageSize}{" "}
                        of {currentPageData.length} Items.
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === "fifth" && (
            <div className="container-fluid table_bg">
              <div className="table-responsive">
                <Table
                  columns={title_ticket_tablehistab}
                  loading={isLoading}
                  dataSource={filteredDataCom}
                  pagination={{ pageSize: 10 }}
                  footer={(currentPageData) => {
                    return (
                      <span>
                        Showing {""}
                        {pageSize > currentPageData.length
                          ? currentPageData.length
                          : pageSize}{" "}
                        of {currentPageData.length} Items.
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === "sixth" && (
            <div className="container-fluid table_bg">
              <div className="table-responsive">
                <Table
                  columns={mttp_table}
                  loading={isLoading}
                  dataSource={filteredDataMttp}
                  pagination={{ pageSize: 10 }}
                  footer={(currentPageData) => {
                    return (
                      <span>
                        Showing {""}
                        {pageSize > currentPageData.length
                          ? currentPageData.length
                          : pageSize}{" "}
                        of {currentPageData.length} Items.
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === "ninth" && (
            <div className="container-fluid table_bg">
              <div className="table-responsive">
                <Table
                  columns={mttp_draft_table}
                  loading={isLoading}
                  dataSource={filteredRejected}
                  pagination={{ pageSize: 10 }}
                  footer={(currentPageData) => {
                    return (
                      <span>
                        Showing {""}
                        {pageSize > currentPageData.length
                          ? currentPageData.length
                          : pageSize}{" "}
                        of {currentPageData.length} Items.
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === "tenth" && (
            <div className="container-fluid table_bg">
              <div className="table-responsive">
                <Table
                  columns={mttp_completed_table}
                  loading={isLoading}
                  dataSource={filteredCompleted}
                  pagination={{ pageSize: 10 }}
                  footer={(currentPageData) => {
                    return (
                      <span>
                        Showing {""}
                        {pageSize > currentPageData.length
                          ? currentPageData.length
                          : pageSize}{" "}
                        of {currentPageData.length} Items.
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <Modal size="sm" show={stsmodal} onHide={handlestsClose} centered className="compact-remarks-modal">
        <Modal.Header closeButton className="compact-header">
        <Modal.Title>History</Modal.Title>
        </Modal.Header>
        <Modal.Body className="compact-body">
        {Array.isArray(ticket_history_data) && ticket_history_data.length > 0 ? (
        <div className="compact-list">
        {ticket_history_data.map((ticket1, index) => (
        <div className="compact-item" key={index}>
                    <div className={`compact-badge ${
                      ticket1.status?.toLowerCase().includes('reject') ? 'badge-reject' :
                      ticket1.status?.toLowerCase().includes('submit') ? 'badge-submit' :
                      ticket1.status?.toLowerCase().includes('approve') ? 'badge-approved' :
                      ticket1.status?.toLowerCase().includes('completed') ? 'badge-completed' :
                      'badge-default'
                    }`}>{ticket1.status}</div>
        <div className="compact-info">
        <span className="compact-name">{ticket1.name}</span>
        <span className="compact-date">{moment(ticket1.date).format("MMM D, YYYY HH:mm:ss")}</span>
        </div>
        <div className="compact-icons">
        <Tooltip title={ticket1.remarks || "No Remarks"}>
        <FaEye className="compact-icon" />
        </Tooltip>
        </div>
        </div>
        ))}
        </div>
        ) : (
        <div className="compact-empty">No history</div>
        )}
        </Modal.Body>
        </Modal>
      </div>
      <CustomModal
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        handleCancel={handleCancel}
        handleFormRemarks={handleFormRemarks}
        handleFormApprove={handleFormApprove}
        brandDataArray={brandDataArray}
        brandDataLength={brandDataLength}
        tabData={tabData}
        poattach={poattach}
        checkAvailable={checkAvailable}
        checkRes={checkRes}
        isRelatedCheck={isRelatedCheck}
        mode={mode}
        data={formData}
        isView={isView}
        isModalView={isModalView}
        isBrand={isBrandTab}
      />
      <FileUploadModal
        show={fileupload}
        onHide={handlefileClose}
        onUpdate={handleMttpUpdate}
        initialData={selectedMttpData}
        approveReject={approveReject}
        buttonDisable={buttonDisable}
      />
    </div>
  );
};
export default Businessapprover;
