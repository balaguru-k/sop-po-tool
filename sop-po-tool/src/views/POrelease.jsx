import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Tooltip } from "antd";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { LuEye } from "react-icons/lu";
import { BaseUrl } from "../App.js";
import axios from "axios";
import { Tab, Tabs } from "react-bootstrap";
import { BiMessageDots } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import { MdCheckCircle, MdCancel, MdAccessTime } from "react-icons/md";
import { setLoaderCallback } from "../utils/Configs.js";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import image from "../assets/images/time-and-date (1).png";
import moment from "moment";
import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CustomModal from "./CustomModal.jsx";
import NotificationModal from "./NotificationModal.jsx";
import CollapsibleTabHeader from "../components/CollapsibleTabHeader.jsx";
import FileUploadModal from "./FileUploadModal.jsx";
import { applySearch } from "../utils/FormValidation.js";
import CustomExportComponent from "../components/CustomExportComponent.jsx";
import VendorAvatar from "../components/VendorAvatar";

const Porelease = (props) => {
  const [isDataChanged, setIsDataChanged] = useState(false);
  const role = localStorage.getItem("role");
  const poname = localStorage.getItem("name");
  const [getTicket, setgetTicket] = useState([]);
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
  const [checkRes, setCheckRes] = useState("");
  const [isRelatedCheck, setIsRelatedCheck] = useState("");
  const [checkAvailable, setCheckAvailable] = useState("");
  const [getTicketReject, setGetTicketReject] = useState([]);
  const [poattach, setPoAttach] = useState([]);
  const [tabData, setTabData] = useState("");
  const [getMttpData, setGetMttpData] = useState([]);
  const [getMttpRejectedData, setMttpRejectedData] = useState([]);
  const [getMttpCompletedData, setMttpCompletedData] = useState([]);
  const isBrandTab = localStorage.getItem("selectedTicketTab") === "Brand";
  const [selectedMttpData, setSelectedMttpData] = useState(null);
  const [approveReject, setApproveReject] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);
  const [fileupload, setfileModal] = useState(false);

  const TicketReject = async () => {
    try {
      const apiUrl = `${BaseUrl}api/ticket/rejected-tickets?stage=Po_release&ticketType=${
        localStorage.getItem("selectedTicketTab") === "Brand"
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
    TicketReject();
    fetchMttpData();
  }, [isDataChanged]);
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
  useEffect(() => {
    fetchMttpCompletedData();
  }, [isDataChanged]);
  const DataTicket = async () => {
    try {
      const apiUrl =
        BaseUrl +
        `api/ticket/getAllByCommonStage/${role}?ticketType=${
          localStorage.getItem("selectedTicketTab") === "Brand"
            ? "Brand"
            : "NonBrand"
        }`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setgetTicket(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    DataTicket();
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
        `api/ticket/getAllComplticketsByStage/${role}?ticketType=${
          localStorage.getItem("selectedTicketTab") === "Brand"
            ? "Brand"
            : "NonBrand"
        }`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setgetTickethistab(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    localStorage.removeItem("notifications");
    localStorage.removeItem("unreadCount");
    setNotifications([]);
    setUnreadCount(0);
    return () => {};
  }, []);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
    localStorage.setItem("unreadCount", unreadCount.toString());
  }, [notifications, unreadCount]);

  const fetchNotifications = async () => {
    if (isFetching.current) return; // Skip if already fetching
    isFetching.current = true;
    const userid = localStorage.getItem("id");
    const ticketType = localStorage.getItem("selectedTicketTab");
    try {
      const apiUrl = `${BaseUrl}api/ticket/get_notificationsById/${userid}?ticketType=${ticketType}`;
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
      if (
        newNotifications.length > 0 &&
        newNotifications.every((notif) => notif.role === role)
      ) {
        setNotifications((prevNotifications) => {
          const updatedNotifications = [
            ...newNotifications.filter(
              (newNotif) =>
                !prevNotifications.some((notif) => notif.id === newNotif.id),
            ),
            ...prevNotifications, // Add new notifications at the top
          ];
          return updatedNotifications;
        });
        // Calculate the unread count (increment by 1 for each unread notification)
        const unreadNotificationsCount = newNotifications.filter(
          (notif) => !notif.read, // Only consider notifications where 'read' is false
        ).length;
        setUnreadCount((prevCount) => prevCount + unreadNotificationsCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      isFetching.current = false; // Reset fetching status
    }
  };
  useEffect(() => {
    // Set up WebSocket connection
    const socket = new SockJS(BaseUrl + "ws"); // Backend WebSocket endpoint
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        const id = localStorage.getItem("id");
        // Subscribe to topic for updates
        stompClient.subscribe("/topic/Po_release", (message) => {
          const newTicket = JSON.parse(message.body);
          if (poname == newTicket.poApprover) {
            setgetTicket((prevTickets) => [...prevTickets, newTicket]); // Update tickets
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
    DataTickethistab();
    fetchNotifications();
  }, [isDataChanged]);

  const [viewmodal, setviewModal] = useState(false);
  const [remarkModal, setRemarkModal] = useState(false);
  const handleviewClose = () => setviewModal(false);
  const handleviewShow = () => setviewModal(true);
  const [approveModal, setApproveModal] = useState(false);

  const openApproveModal = () => {
    setApproveModal(true);
  };
  const handleRCancel = () => {
    setRemarkModal(false);
    setRemarks("");
    setApproveModal(false);
  };

  const handlefileClose = () => {
    setfileModal(false);
    setSelectedMttpData(null);
    setApproveReject(false);
    setButtonDisable(false);
  };
  const [remarks, setRemarks] = useState("");
  const [stsmodal, setstsModal] = useState(false);
  const handlestsClose = () => setstsModal(false);
  const handlestsShow = () => setstsModal(true);
  const [errorRemarks, setErrorRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorApprove, setErrorApprove] = useState("");
  const [brandDataArray, setBrandDataArray] = useState([]);
  const [brandDataLength, setBrandDataLength] = useState(0);
  const [mode, setMode] = useState("");
  const [isView, setIsView] = useState(false);
  const [isModalView, setIsModalView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setMode("");
    setIsView(false);
    setIsModalOpen(false);
    setBrandDataLength(0);
    setFormData({});
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
        },
      );
      if (response.status === 200) {
        setSuccessMessage("Approved successfully!");
        DataTicket();
        setIsModalView(true);
        DataTickethistab();
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        setIsModalOpen(false);
        setMode("");
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
    const notificationIdToDelete = notifications.find(
      (notif) => notif.id === editid, // Assuming ticketId links to the notification
    );
    handleClearNotification(notificationIdToDelete);
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
        },
      );
      if (response.status === 200) {
        setSuccessMessage("Rejected successfully!");
        DataTicket();
        TicketReject();
        setIsModalView(true);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        setIsModalOpen(false);
        setMode("");
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
      (notif) => notif.id === editid, // Assuming ticketId links to the notification
    );
    handleClearNotification(notificationIdToDelete);
  };

  useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchis, setSearchis] = useState(false);
  const [filteredDataMttp, setFilteredDataMttp] = useState([]);
  const [filteredRejected, setFilteredRejected] = useState([]);
  const [filteredCompleted, setFilteredCompleted] = useState([]);
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
        item.status?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setFilteredDataMttp(filtered);
  }, [getMttpData, searchQuery]);

  useEffect(() => {
    const filtered = getMttpRejectedData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredRejected(filtered);
  }, [getMttpRejectedData, searchQuery]);

  useEffect(() => {
    fetchMttpRejectedData();
  }, []);

  useEffect(() => {
    const filtered = getMttpCompletedData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredCompleted(filtered);
  }, [getMttpCompletedData, searchQuery]);

  useEffect(() => {
    fetchMttpCompletedData();
  }, []);
  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
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
      dataIndex: "formattedCreatedAt",
      render: (formattedCreatedAt, _, index) => {
        return (
          <React.Fragment key={`formattedCreatedAt-${index}`}>
            <pre>{formattedCreatedAt || ""}</pre>
          </React.Fragment>
        );
      },
      sorter: (a, b) => {
        const dateA = a.formattedCreatedAt || "";
        const dateB = b.formattedCreatedAt || "";
        return dateA.localeCompare(dateB);
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
                : `• ${item.poDescription || ""}`,
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? (
              <pre>₹ {totalBaseValue.toLocaleString("en-IN")}</pre>
            ) : (
              <pre>-</pre>
            )}
          </React.Fragment>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status, record, index) => {
        const formatStatus = (status) => {
          if (!status) return "Unknown";
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        };
        const statusText = formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span
              style={{
                backgroundColor: "transparent",
                color: "#faad14",
                padding: "0px",
                borderRadius: "0px",
                display: "inline-flex",
                alignItems: "center",
                fontSize: "13px",
                gap: "6px",
                fontWeight: "700",
              }}
            >
              <MdAccessTime style={{ fontSize: "14px", marginRight: "6px" }} />
              {statusText}
            </span>
          </span>
        );
      },
    },
    {
      title: "Actionrrr",
      dataIndex: "id",
      render: (_, record) => {
        return (
          <>
            <Tooltip title="View Details">
              <a
                onClick={() => {
                  setIsView(true);
                  showModal();
                  Viewticketfunction(record.id);
                  setMode("checker");
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
              </a>{" "}
            </Tooltip>
          </>
        );
      },
    },
  ];
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
            <pre>{reqName || ""}</pre>
          </React.Fragment>
        );
      },
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (status, record, index) => {
        const formatStatus = (status) => {
          if (!status) return "Unknown";
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        };
        const statusText = formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span
              style={{
                backgroundColor: "transparent",
                color: "#faad14",
                padding: "0px",
                borderRadius: "0px",
                display: "inline-flex",
                alignItems: "center",
                fontSize: "13px",
                gap: "6px",
                fontWeight: "700",
              }}
            >
              <MdAccessTime style={{ fontSize: "14px", marginRight: "6px" }} />
              {statusText}
            </span>
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
                </a>{" "}
              </Tooltip>
            </div>
          </>
        );
      },
    },
  ];
  const [getTickethistab, setgetTickethistab] = useState([]);
  const title_ticket_tablehistab = [
    {
      title: "S.No",
      dataIndex: "brand",
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
                : `• ${item.poDescription || ""}`,
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? (
              <pre>₹ {totalBaseValue.toLocaleString("en-IN")}</pre>
            ) : (
              <pre>-</pre>
            )}
          </React.Fragment>
        );
      },
    },
    ...(!isBrandTab
      ? [
          {
            title: "PO Number",
            dataIndex: "poNumber",
            render: (poNumber, _, index) => {
              const numbers = Array.isArray(poNumber)
                ? poNumber.filter(Boolean)
                : poNumber
                  ? [poNumber]
                  : [];
              const first = numbers[0] || "-";
              const bulletPoints = numbers.map((n) => `• ${n}`).join("\n");
              return (
                <React.Fragment key={`poNumber-${index}`}>
                  <Tooltip
                    overlayClassName="bomb-tooltip"
                    title={
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {bulletPoints || first}
                      </pre>
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <pre>{first}</pre>
                      {numbers.length > 1 && (
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
                          {numbers.length}
                        </span>
                      )}
                    </div>
                  </Tooltip>
                </React.Fragment>
              );
            },
          },
        ]
      : []),
    {
      title: "Status",
      dataIndex: "stage",
      render: (stage, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        const badgeColor = isCompleted ? "#52c41a" : "#faad14";
        const Icon = isCompleted ? MdCheckCircle : MdAccessTime;
        const statusText = isCompleted
          ? "Completed"
          : formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span
              style={{
                backgroundColor: "transparent",
                color: badgeColor,
                padding: "0px",
                borderRadius: "0px",
                display: "inline-flex",
                alignItems: "center",
                fontSize: "13px",
                gap: "6px",
                fontWeight: "700",
              }}
            >
              <Icon style={{ fontSize: "14px", marginRight: "6px" }} />
              {statusText}
            </span>
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
                    showModal();
                    Viewticketfunction(record.id);
                    setMode("view");
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
                </a>{" "}
              </Tooltip>
            </div>
          </>
        );
      },
    },
  ];
  const mttp_complete_table = [
    {
      title: "S.No",
      dataIndex: "brand",
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
      render: (stage, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        const badgeColor = isCompleted ? "#52c41a" : "#faad14";
        const Icon = isCompleted ? MdCheckCircle : MdAccessTime;
        const statusText = isCompleted
          ? "Completed"
          : formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span
              style={{
                backgroundColor: "transparent",
                color: badgeColor,
                padding: "0px",
                borderRadius: "0px",
                display: "inline-flex",
                alignItems: "center",
                fontSize: "13px",
                gap: "6px",
                fontWeight: "700",
              }}
            >
              <Icon style={{ fontSize: "14px", marginRight: "6px" }} />
              {statusText}
            </span>
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
              <Tooltip title="View Histrory">
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
  const title_ticket_tablereject = [
    {
      title: "S.No",
      dataIndex: "brand",
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
                : `• ${item.poDescription || ""}`,
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? (
              <pre>₹ {totalBaseValue.toLocaleString("en-IN")}</pre>
            ) : (
              <pre>-</pre>
            )}
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
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        const badgeColor = isCompleted ? "#52c41a" : "#faad14";
        const Icon = isCompleted ? MdCheckCircle : MdAccessTime;
        const statusText = isCompleted
          ? "Completed"
          : formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span
              style={{
                backgroundColor: "transparent",
                color: badgeColor,
                padding: "0px",
                borderRadius: "0px",
                display: "inline-flex",
                alignItems: "center",
                fontSize: "13px",
                gap: "6px",
                fontWeight: "700",
              }}
            >
              <Icon style={{ fontSize: "14px", marginRight: "6px" }} />
              {statusText}
            </span>
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
            <Tooltip title="View Details">
              <a
                onClick={() => {
                  setIsView(true);
                  showModal();
                  Viewticketfunction(record.id);
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
              </a>{" "}
            </Tooltip>
          </>
        );
      },
    },
  ];
  const mttp_tablereject = [
    {
      title: "S.No",
      dataIndex: "brand",
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
      render: (stage, record, index) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        };
        const isCompleted = record.stage === "Completed";
        const badgeColor = isCompleted ? "#52c41a" : "#faad14";
        const Icon = isCompleted ? MdCheckCircle : MdAccessTime;
        const statusText = isCompleted
          ? "Completed"
          : formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span
              style={{
                backgroundColor: "transparent",
                color: badgeColor,
                padding: "0px",
                borderRadius: "0px",
                display: "inline-flex",
                alignItems: "center",
                fontSize: "13px",
                gap: "6px",
                fontWeight: "700",
              }}
            >
              <Icon style={{ fontSize: "14px", marginRight: "6px" }} />
              {statusText}
            </span>
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
              <Tooltip title="View Histrory">
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

  const Viewticketfunction = async (id) => {
    try {
      const apiUrl = BaseUrl + "api/ticket/getTicketById/" + id;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const record = await response.json();
      setCheckRes(record?.data?.budgetDetails);
      setCheckAvailable(record?.data?.reason);
      if (record?.data?.isRelated !== null) {
        setIsRelatedCheck(record?.data?.isRelated ? "YES" : "NO");
      }
      setFormData({
        ...record.data,
      });
      setticketdataedit({
        ...record.data,
      });

      seteditId(id);

      setticket_brand_dataedit({
        ...record.data.brand,
      });

      setticket_history_data({
        ...record.data.historyList,
      });

      const brandData = record?.data?.brand;
      setBrandDataArray(brandData);
      if (Array.isArray(brandData) && brandData.length > 0) {
        setticket_brand_dataedit([...brandData]);
        setBrandDataLength(brandData.length);
      } else {
        console.error("Brand data is not in the expected format or is empty.");
      }

      const brandData1 = record?.data?.historyList;
      const rejectedStatus = brandData1
        ?.filter((entry) => entry.status.toLowerCase() === "approved")
        ?.slice(-1)[0];
      setPoAttach(rejectedStatus?.name);
      if (Array.isArray(brandData1) && brandData1.length > 0) {
        setticket_history_data([...brandData1]);
      } else {
        console.error("Brand data is not in the expected format or is empty.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const [filteredDataCom, setFilteredDataCom] = useState([]);
  useEffect(() => {
    setFilteredDataCom(applySearch(getTickethistab, searchQuery));
  }, [getTickethistab, searchQuery]);
  // Inbox tab
  const [filteredDatainbox, setFilteredDatainbox] = useState([]);
  useEffect(() => {
    setFilteredDatainbox(applySearch(getTicket, searchQuery));
  }, [getTicket, searchQuery]);

  const [filteredDataReject, setFilteredDataReject] = useState([]);
  useEffect(() => {
    setFilteredDataReject(getTicketReject, searchQuery);
  }, [getTicketReject, searchQuery]);

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
  const downloadFile = async (
    poCopyAttachment,
    attachment,
    action = "download",
  ) => {
    const apiUrl = `${BaseUrl}api/ticket/file-download/${
      poCopyAttachment || attachment
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
      setIsDataChanged(true);
      setApproveModal(false);
      setRemarks("");
      handleRCancel();
    } catch (error) {
      console.error("Error sending data to backend:", error);
    } finally {
      setIsSubmitting(false);
    }
    const notificationIdToDelete = notifications.find(
      (notif) => notif.id === editid, // Assuming ticketId links to the notification
    );
    handleClearNotification(notificationIdToDelete);
  };
  const handlereject = async (e) => {
    const approvalStatus = "Reject";
    const remark = approvalStatus === "Reject" ? remarks : "";
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl =
        BaseUrl +
        `api/ticket/ticket-approve?ticketId=${editid}&approvalStatus=Reject&remarks=${remark}`;

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            //'Content-Type': 'application/json',
            "Content-Type": "multipart/form-data",
          },
        },
      );
      if (response.status === 200) {
        setSuccessMessage("Submitted successfully!");
        setErrorRemarks(""); // Clear error message if successful
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        setRemarkModal(false);
        setviewModal(false);
        DataTicket();
        setIsDataChanged(true);
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
      (notif) => notif.id === editid, // Assuming ticketId links to the notification
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

  useEffect(() => {}, [activeTab]);

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
        JSON.stringify(updatedNotifications),
      );
    }
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  // Clear a single notification
  const handleClearNotification = async (notification) => {
    try {
      const response = await axios.delete(
        `${BaseUrl}api/ticket/delete_notification/${notification.ids}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      const updatedNotifications = notifications.filter(
        (notif) => notif.id !== notification.id,
      );
      setNotifications(updatedNotifications);
      setUnreadCount(
        updatedNotifications.filter((notif) => !notif.read).length,
      );
      localStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications),
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
        },
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
      notif.id === notification.id ? { ...notif, readtext: true } : notif,
    );
    setNotifications(updatedNotifications);
    setUnreadCount(
      updatedNotifications.filter((notif) => !notif.readtext).length,
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
        },
      );
    } catch (error) {
      console.error("Error updating notification:", error);
    }
    setIsView(true);
    setMode("checker");
    showModal();
    Viewticketfunction(notification.id);
  };

  const handleMttpUpdate = async (data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl =
        BaseUrl +
        `mttp-ticket/approver-ticket/${data.id}?status=${
          data.approveStatus
        }&remarks=${encodeURIComponent(data.remarks)}`;
      const formData = new FormData();
      const response = await axios.post(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setSuccessMessage(
          `Ticket ${data.approveStatus.toLowerCase()} successfully`,
        );
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        fetchMttpData();
        fetchMttpCompletedData();
        fetchMttpRejectedData();
        handlefileClose();
      }
    } catch (error) {
      console.error("Error updating MTTP ticket:", error);
    }
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
            PO Release
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
            <CollapsibleTabHeader
              onTabSelect={handleTabSelect}
              activeTab={activeTab}
              tabKeys={["first", "fourth", "fifth", "sixth", "ninth", "tenth"]}
            />
          </div>
          <Box
            className="search_box"
            component="form"
            onSubmit={(e) => e.preventDefault()}
            defaultActiveKey="first"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
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
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
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
                    borderColor: "#C4C4C4", // Remove blue outline
                    borderWidth: 1, // Add 1px solid border
                    borderStyle: "solid", // Make it solid
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
                  id="ticket_table"
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
                  id="ticket_table"
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
                  id="ticket_table"
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
                  columns={mttp_tablereject}
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
                  id="ticket_table"
                  columns={mttp_complete_table}
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
        <Modal size="xl" show={viewmodal} onHide={handleviewClose}>
          <Modal.Header closeButton className="modal-close-out d-block">
            <Modal.Title>
              <Row>
                <Col xl={6}>
                  <Row>
                    <Col xl={8} lg={8} md={8} sm={8} xs={8}>
                      <Form.Label className="modal-label align-text-sub">
                        Detail View
                      </Form.Label>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="vendor_details_part">
              <div className="txt_title">Vendor Details</div>
              <Row>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Vendor Name
                  </Form.Label>
                  <div className="txt_input">{ticketdataedit.vendorName}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Vendor Location
                  </Form.Label>
                  <div className="txt_input">
                    {ticketdataedit.vendorLocation}
                  </div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    CKPL Location
                  </Form.Label>
                  <div className="txt_input">{ticketdataedit.ckplLocation}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Vendor Code
                  </Form.Label>
                  <div className="txt_input">{ticketdataedit.vendorCode}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    GST No.
                  </Form.Label>
                  <div className="txt_input">{ticketdataedit.gstNo}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Currency
                  </Form.Label>
                  <div className="txt_input">{ticketdataedit.currency}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">GST</Form.Label>
                  <div className="txt_input">{ticketdataedit.gstType}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Payment Terms
                  </Form.Label>
                  <div className="txt_input">{ticketdataedit.paymentTerm}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    PO Type
                  </Form.Label>
                  <div className="txt_input">{ticketdataedit.poType}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Total Base Amount
                  </Form.Label>
                  <div className="txt_input">
                    {ticketdataedit.totalBaseValue}
                  </div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Vendor Mail ID
                  </Form.Label>
                  <div className="txt_input">{ticketdataedit.vendorMailId}</div>
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Attachment
                  </Form.Label>
                  {ticketdataedit.attachment &&
                  ticketdataedit.attachment.length > 0 ? (
                    <ul>
                      {ticketdataedit.attachment.map((attachment, index) => (
                        <li key={index}>
                          <span
                            onClick={() => downloadFile(attachment)}
                            className="txt_input text_class"
                          >
                            <Tooltip title={attachment}>
                              {attachment.length > 10
                                ? `${attachment.slice(0, 20)}...`
                                : attachment}
                            </Tooltip>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>No attachments available</div>
                  )}
                </Col>
                <Col
                  xl={3}
                  lg={3}
                  md={6}
                  sm={6}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Business Approver
                  </Form.Label>
                  <div className="txt_input">
                    {ticketdataedit.approverUsername}
                  </div>
                </Col>
              </Row>
            </div>
            {Array.isArray(ticket_brand_dataedit) ? (
              ticket_brand_dataedit.map((ticket, index) => (
                <div className="vendor_details_part" key={index}>
                  <div className="txt_title">Basic Details</div>
                  <Row>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Brand/No Brand
                      </Form.Label>
                      <div className="txt_input">{ticket.brandOrNonBrand}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      {" "}
                      <Form.Label className="txt_lable form-label">
                        Brand
                      </Form.Label>
                      <div className="txt_input">{ticket.detailsBrand}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Department
                      </Form.Label>
                      <div className="txt_input">{ticket.department}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Division
                      </Form.Label>
                      <div className="txt_input">{ticket.division}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Region
                      </Form.Label>
                      <div className="txt_input">{ticket.region}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Channel
                      </Form.Label>
                      <div className="txt_input">{ticket.channel}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Amount
                      </Form.Label>
                      <div className="txt_input">{ticket.value}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Location
                      </Form.Label>
                      <div className="txt_input">{ticket.location}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Nature of Expenses
                      </Form.Label>
                      <div className="txt_input">{ticket.natureOfExpenses}</div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Po Description
                      </Form.Label>
                      <div className="txt_input">
                        <textarea
                          className="txt_input style_addon"
                          value={ticket.poDescription}
                          readOnly
                        />
                      </div>
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Month & Year
                      </Form.Label>
                      <div className="txt_input style_addon">
                        <textarea
                          className="txt_input"
                          value={`${ticket.month} ${ticket.year}`}
                          readOnly
                        />
                      </div>
                    </Col>
                  </Row>

                  <Row className="brand_details_sec">
                    <div className="txt_title">Brand Details</div>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        I/O or CC PO
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="txt_input"
                        value={ticket.ioOrCostCentrePo}
                        id=""
                        readOnly
                      />
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Internal order
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="txt_input"
                        value={
                          ticket.internalorder
                            ? ticket.internalorder
                            : "No Data"
                        }
                        id=""
                        name="Internalorder"
                        readOnly
                      />
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Cost Center
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="txt_input"
                        value={
                          ticket.costcenter ? ticket.costcenter : "No Data"
                        }
                        id=""
                        name="Costcenter"
                        readOnly
                      />
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Fund Center
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="txt_input"
                        value={ticket.fundCentre}
                        id=""
                        readOnly
                      />
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Commitment Item
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="txt_input"
                        value={ticket.commitmentItem}
                        id=""
                        readOnly
                      />
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Selelcted Nature of Expenses
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="txt_input"
                        value={ticket.natureOfExpenses}
                        id=""
                        readOnly
                      />
                    </Col>
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_margin validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        Gl Code
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="txt_input"
                        value={ticket.glCode}
                        id=""
                        readOnly
                      />
                    </Col>
                  </Row>
                  {ticketdataedit.stage === "Completed" && (
                    <Col
                      xl={3}
                      lg={3}
                      md={6}
                      sm={6}
                      className="form_marginsub validation-error"
                    >
                      <Form.Label className="txt_lable form-label">
                        PO Number{" "}
                      </Form.Label>
                      <input
                        type="number"
                        className="txt_input text_addon"
                        value={ticketdataedit.poNumber}
                        readOnly
                      />
                    </Col>
                  )}
                </div>
              ))
            ) : (
              <p>No data available or loading...</p>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <div className="d-flex">
              {activeTab === "first" ? (
                <Button
                  className="btn_cancel mx-2 px-3"
                  onClick={() => setRemarkModal(true)}
                >
                  Reject
                </Button>
              ) : (
                <div>
                  <Button
                    className="btn_cancel mx-2"
                    onClick={() => {
                      setviewModal(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              )}
              {activeTab === "first" && (
                <Button
                  className="btn_subapprove mx-2"
                  type="submit"
                  onClick={openApproveModal}
                >
                  Approve
                </Button>
              )}
            </div>
          </Modal.Footer>
        </Modal>
        <Modal
          size="sm"
          show={stsmodal}
          onHide={handlestsClose}
          centered
          className="compact-remarks-modal"
        >
          <Modal.Header closeButton className="compact-header">
            <Modal.Title>History</Modal.Title>
          </Modal.Header>
          <Modal.Body className="compact-body">
            {Array.isArray(ticket_history_data) &&
            ticket_history_data.length > 0 ? (
              <div className="compact-list">
                {ticket_history_data.map((ticket1, index) => (
                  <div className="compact-item" key={index}>
                    <div
                      className={`compact-badge ${
                        ticket1.status?.toLowerCase().includes("reject")
                          ? "badge-reject"
                          : ticket1.status?.toLowerCase().includes("submit")
                            ? "badge-submit"
                            : ticket1.status?.toLowerCase().includes("approve")
                              ? "badge-approved"
                              : ticket1.status
                                    ?.toLowerCase()
                                    .includes("completed")
                                ? "badge-completed"
                                : "badge-default"
                      }`}
                    >
                      {ticket1.status}
                    </div>
                    <div className="compact-info">
                      <span className="compact-name">{ticket1.name}</span>
                      <span className="compact-date">
                        {moment(ticket1.date).format("MMM D, YYYY HH:mm:ss")}
                      </span>
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
        {/* //Approved without any fail                        */}
      </div>
      <CustomModal
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        handleCancel={handleCancel}
        handleFormRemarks={handleFormRemarks}
        handleFormApprove={handleFormApprove}
        brandDataArray={brandDataArray}
        brandDataLength={brandDataLength}
        checkAvailable={checkAvailable}
        checkRes={checkRes}
        isRelatedCheck={isRelatedCheck}
        poattach={poattach}
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
export default Porelease;
