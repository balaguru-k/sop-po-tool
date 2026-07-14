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
import { MdCheckCircle, MdCancel, MdAccessTime } from "react-icons/md";
import { setLoaderCallback } from "../utils/Configs.js";
import { FaEye } from "react-icons/fa";
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
import CustomExportComponent from "../components/CustomExportComponent.jsx";
import { applySearch } from "../utils/FormValidation.js";
import VendorAvatar from '../components/VendorAvatar';

const Poscreening = (props) => {
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [getTicket, setgetTicket] = useState([]);
  const role = localStorage.getItem("role");
  const isFetching = useRef(false);

  //notification variables
  const [notifications, setNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem("notifications");
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });

  const [unreadCount, setUnreadCount] = useState(() => {
    const savedCount = localStorage.getItem("unreadCount");
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("");
  const [isView, setIsView] = useState(false);
  const [brandDataArray, setBrandDataArray] = useState([]);
  const [isModalView, setIsModalView] = useState(false);
  const [errorApprove, setErrorApprove] = useState("");
  const [isEditable, setIsEditable] = useState(false);
  const [brandDataLength, setBrandDataLength] = useState(0); // Initialize with 0 or any default value
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
  const [getTicketReject, setGetTicketReject] = useState([]);
  const [checkRes, setCheckRes] = useState("");
  const [checkAvailable, setCheckAvailable] = useState("");
  const [isRelatedCheck, setIsRelatedCheck] = useState("");
  const [poattach, setPoAttach] = useState([]);
  const [prattach, setPrAttach] = useState([]);
  const [tabData, setTabData] = useState("");
  const isBrandTab = localStorage.getItem("selectedTicketTab") === "Brand";
  const [getMttpData, setGetMttpData] = useState([]);
  const [getMttpRejectedData, setMttpRejectedData] = useState([]);
  const [getMttpCompletedData, setMttpCompletedData] = useState([]);
  const [selectedMttpData, setSelectedMttpData] = useState(null);
  const [approveReject, setApproveReject] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);
  const [fileupload, setfileModal] = useState(false);

  const TicketReject = async () => {
    try {
      const apiUrl = `${BaseUrl}api/ticket/rejected-tickets?stage=PO_Screening&ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
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
  const handleOk = () => {
    setIsModalOpen(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setMode("");
    setIsView(false);
    setBrandDataLength(0);
    setIsModalOpen(false);
    setFormData({});
    setTabData("");
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
        setSuccessMessage("Submitted successfully!");
        DataTicket();
        TicketReject();
        setMode(" ");
        setIsModalView(true);
        const notificationIdToDelete = notifications.find(
          (notif) => notif.id === editid // Assuming ticketId links to the notification
        );
        handleClearNotification(notificationIdToDelete);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
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
  const handleFormApprove = async (formData) => {
    if (!("remarks" in formData) || !formData.remarks) {
      formData.remarks = "";
    }
    const encodedRemarks = encodeURIComponent(formData.remarks || "");
    try {
      const token = localStorage.getItem("accessToken");
      let apiUrl = `${BaseUrl}api/ticket/ticket-approve?ticketId=${editid}&approvalStatus=Approved&remarks=${encodedRemarks}`;
      if (formData.reSubmitUser) {
        apiUrl += `&stage=${formData.reSubmitUser}`;
      }
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
        setSuccessMessage("Approved successfully!");
        DataTicket();
        DataTickethistab();
        setMode(" ");
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
  const DataTicket = async () => {
    try {
      const apiUrl =
        BaseUrl +
        `api/ticket/get-all-po-screening-ticket?ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
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
    const roles = localStorage.getItem("role");
    const ticketType = localStorage.getItem("selectedTicketTab");
    try {
      const apiUrl = `${BaseUrl}api/ticket/get_notifications/${roles}?ticketType=${ticketType}`;

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
        stompClient.subscribe("/topic/PO_Screening", (message) => {
          const newTicket = JSON.parse(message.body);
          setgetTicket((prevTickets) => [...prevTickets, newTicket]); // Update tickets
          localStorage.removeItem("notifications");
          localStorage.removeItem("unreadCount");
          setNotifications([]);
          setUnreadCount(0);
          fetchNotifications();
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
      setgetTickethistab(response.data);
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

  const [remarkModal, setRemarkModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);

  const openApproveModal = () => {
    setApproveModal(true);
  };

  const [viewmodal, setviewModal] = useState(false);
  const handleviewClose = () => setviewModal(false);
  const [stsmodal, setstsModal] = useState(false);
  const handlestsClose = () => setstsModal(false);
  const handlestsShow = () => setstsModal(true);
  const [errorRemarks, setErrorRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredDataMttp(filtered);
  }, [getMttpData, searchQuery]);
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
  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchQuery(searchValue);
  };

  const handlefileClose = () => {
    setfileModal(false);
    setSelectedMttpData(null);
    setApproveReject(false);
    setButtonDisable(false);
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
          <pre>{index + 1} </pre>
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
        const dateA = a.createdDate || "";
        const dateB = b.createdDate || "";
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            ₹ {totalBaseValue ? totalBaseValue.toLocaleString('en-IN') : "0"}
          </React.Fragment>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "stage",
      render: (stage, _, index) => {
        const rejectedStatus = _.historyList
          ?.filter((entry) => entry.status.toLowerCase() === "reject")
          ?.slice(-1)[0];
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };

        return (
          <span
            key={`status-${index}`}
            style={{
              backgroundColor: "transparent",
              color: _.status === "Reject" ? "#ff4d4f" : "#faad14",
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
            {_.status === "Reject" ? <MdCancel size={14} /> : <MdAccessTime size={14} />}
            {_.status === "Reject"
              ? `Rejected by ${formatStatus(rejectedStatus.name)}`
              : formatStatus(stage)}
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
                    setMode("view");
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

  const [getTickethistab, setgetTickethistab] = useState([]);
  const title_ticket_tablehistab = [
    {
      title: "S.No",
      dataIndex: "brand",
      // key: 'brand',
      dataIndex: "1",
      render: (text, record, index) => (
        <span>
          <pre>{index + 1}</pre>
        </span>
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
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
                    setTabData("Completed");
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
        <span>
          <pre>{index + 1}</pre>
        </span>
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
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
              <Tooltip title="View Histrory">
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
  const mttp_table = [
    {
      title: "S.No",
      dataIndex: "brand",
      render: (text, record, index) => (
        <>
          <pre>{index + 1} </pre>
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
      dataIndex: "stage",
      render: (stage, _, index) => {
        const rejectedStatus = _.historyList
          ?.filter((entry) => entry.status.toLowerCase() === "reject")
          ?.slice(-1)[0];
        const formatStatus = (status) => {
          return status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };

        return (
          <span
            key={`status-${index}`}
            style={{
              backgroundColor: "transparent",
              color: _.status === "Reject" ? "#ff4d4f" : "#faad14",
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
            {_.status === "Reject" ? <MdCancel size={14} /> : <MdAccessTime size={14} />}
            {_.status === "Reject"
              ? `Rejected by ${formatStatus(rejectedStatus.name)}`
              : formatStatus(stage)}
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
  const mttp_reject_table = [
    {
      title: "S.Now",
      dataIndex: "brand",
      // key: 'brand',
      dataIndex: "1",
      render: (text, record, index) => (
        <span>
          <pre>{index + 1}</pre>
        </span>
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
  const mttp_complete_table = [
    {
      title: "S.No",
      dataIndex: "brand",
      // key: 'brand',
      dataIndex: "1",
      render: (text, record, index) => (
        <span>
          <pre>{index + 1}</pre>
        </span>
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
  const [ticketdataedit, setticketdataedit] = useState({});
  const [editid, seteditId] = useState({});
  const [ticket_basic_dataedit, setticket_basic_dataedit] = useState({});
  const [ticket_brand_dataedit, setticket_brand_dataedit] = useState([{}]);
  const [ticket_history_data, setticket_history_data] = useState([]);
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
      const approvedStatus = historyList
        ?.filter((entry) => entry.status.toLowerCase() === "reject")
        ?.slice(-1)[0];
      setPrAttach(approvedStatus?.name);
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
    setFilteredDataCom(applySearch(getTickethistab, searchQuery));
  }, [getTickethistab, searchQuery]);

  // Inbox tab
  const [filteredDatainbox, setFilteredDatainbox] = useState([]);
  useEffect(() => {
    setFilteredDatainbox(applySearch(getTicket, searchQuery));
  }, [getTicket, searchQuery]);

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

  // Clear a single notification
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
        updatedNotifications.filter((notif) => !notif.read).length
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
      const role = localStorage.getItem("role");
      const response = await axios.delete(
        `${BaseUrl}api/ticket/deleteall_notificationsByrole/${role}`,
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

  const handleMttpUpdate = async (data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl =
        BaseUrl +
        `mttp-ticket/approver-ticket/${data.id}?status=${data.approveStatus
        }&remarks=${encodeURIComponent(data.remarks)}`;
      const formData = new FormData();
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append("file", file);
        });
      }
      if (data.deletedFile && data.deletedFile.length > 0) {
        data.deletedFile.forEach((fileName) => {
          formData.append(`deletedFile`, fileName);
        });
      }
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
        fetchMttpRejectedData();
        fetchMttpCompletedData();
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
            PO Screening
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
                  columns={mttp_reject_table}
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
        <Modal
          size="xl"
          show={viewmodal}
          onHide={handleviewClose}
          backdrop="static"
        >
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
                        {" "}
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
                      <div className="txt_input">
                        <textarea
                          className="txt_input style_addon"
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
                    {/*  */}
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
        checkAvailable={checkAvailable}
        checkRes={checkRes}
        isRelatedCheck={isRelatedCheck}
        poattach={poattach}
        prattach={prattach}
        tabData={tabData}
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
export default Poscreening;
