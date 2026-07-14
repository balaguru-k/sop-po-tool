import React, { useState, useRef, useEffect } from "react";
import { Button, Table, Tooltip } from "antd";
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
import toast from "react-hot-toast";
import NotificationModal from "./NotificationModal.jsx";
import CollapsibleTabHeader from "../components/CollapsibleTabHeader.jsx";
import FileUploadModal from "./FileUploadModal.jsx";
import { applySearch } from "../utils/FormValidation.js";
import { get } from "react-hook-form";
import VendorAvatar from '../components/VendorAvatar';
const Pomaker = (props) => {
  const [isDataChanged, setIsDataChanged] = useState(false);
  const role = localStorage.getItem("role");
  const [getTicket, setgetTicket] = useState([]);
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
  const [checkAvailable, setCheckAvailable] = useState("");
  const [brandDataArray, setBrandDataArray] = useState([]);
  const [brandDataLength, setBrandDataLength] = useState(0);
  const [getTicketReject, setGetTicketReject] = useState([]);
  const [selectedMttpData, setSelectedMttpData] = useState(null);
  const [approveReject, setApproveReject] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);
  const [fileupload, setfileModal] = useState(false);
  const [exportError, setExportError] = useState("");
  const [isModalExportOpen, setIsModalExportOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [dateError, setDateError] = useState("");
  const tabMapping = {
    first: "INBOX",
    second: "HOLD",
    third: "DRAFT",
    fourth: "REJECTED",
    fifth: "COMPLETED",
    sixth: "MTTP",
    seventh: "MTTP HOLD",
    eighth: "MTTP DRAFT",
    ninth: "MTTP REJECTED",
    tenth: "MTTP COMPLETED",
    mailTemplate: "MAIL TEMPLATE"
  };

  const handleExportOpen = () => {
    setIsModalExportOpen(true);
    setStartDate("");
    setEndDate("");
    setStartDateError("");
    setEndDateError("");
    setDateError("");
  };

  const handleExportClose = () => {
    setIsModalExportOpen(false);
    setStartDate("");
    setEndDate("");
    setStartDateError("");
    setEndDateError("");
    setDateError("");
    setExportError("");
  };

  const handleExportClick = async () => {
    if (handleValidation()) {
      try {
        const hasTickets = await handleExport(startDate, endDate);
        if (hasTickets) {
          setExportError(null);
        }
      } catch (error) {
        toast.error("No tickets found for the selected date range.", {
          duration: 2000,
        }); // Display a success message
      }
    }
  };

  const handleExport = async (startDate, endDate) => {
    try {
      const apiUrl = `${BaseUrl}api/ticket/export?startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}&ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
        ? "Brand"
        : "NonBrand"
        }&activeTab=${tabMapping[activeTab] || activeTab}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `MIS Export ${startDate} to ${endDate}.xlsx`;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      setExportError("");
      setIsModalExportOpen(false);
      toast.success("Tickets exported successfully!", { duration: 2000 });
    } catch (error) {
      throw error;
    }
  };
  const TicketReject = async () => {
    try {
      const apiUrl = `${BaseUrl}api/ticket/rejected-tickets?stage=Po_maker&ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
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
  const DataTicket = async () => {
    try {
      const apiUrl = `${BaseUrl}api/ticket/getAllByCommonStage/${role}?ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
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

  const fetchNotifications = async () => {
    if (isFetching.current) return; // Skip if already fetching
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
            ...prevNotifications, // Add new notifications at the top
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
    // Set up WebSocket connection
    const socket = new SockJS(BaseUrl + "ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        const id = localStorage.getItem("id");
        stompClient.subscribe("/topic/Po_maker", (message) => {
          const newTicket = JSON.parse(message.body);
          setgetTicket((prevTickets) => [...prevTickets, newTicket]);
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
        HoldTicket();
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
      // const requestData = {
      //     stagename: 'Budget_Team',
      // };
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        // params: requestData,
      });
      setgetTickethistab(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
    localStorage.setItem("unreadCount", unreadCount.toString());
  }, [notifications, unreadCount]);
  useEffect(() => {
    DataTickethistab();
  }, [isDataChanged]);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  // const formatDate = (inputDate) => {
  // const selectedDate = new Date(inputDate);
  // const formattedDate = selectedDate.toISOString().split('T')[0]; // Format: yyyy-MM-dd
  // return formattedDate;
  // };
  const [viewmodal, setviewModal] = useState(false);
  const [remarkModal, setRemarkModal] = useState(false);

  const handleviewClose = () => {
    setviewModal(false);
    setBApprover("");
    setPoNumber("");
    setRelated("");
    setPoNumberror("");
    setRelatederror("");
    setAttachmenterror("");
  };
  const handleviewShow = () => setviewModal(true);

  const [approveModal, setApproveModal] = useState(false);

  const openApproveModal = () => {
    if (!handleValidation()) {
      return;
    }
    setApproveModal(true);
  };
  const handleRCancel = () => {
    setRemarkModal(false);
    setErrorRemarks("");
    setRemarks("");
    setApproveModal(false);
    setSuccessMessage(null);
  };
  const [remarks, setRemarks] = useState("");
  const [viewmodalcomplete, setviewModalcomplete] = useState(false);
  const handleviewClosecomplete = () => setviewModalcomplete(false);
  const handleviewShowcomplete = () => setviewModalcomplete(true);
  const [stsmodal, setstsModal] = useState(false);
  const handlestsClose = () => setstsModal(false);
  const handlestsShow = () => setstsModal(true);
  const [poattach, setPoAttach] = useState([]);
  const [praattach, setPraAttach] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [errorRemarks, setErrorRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchis, setSearchis] = useState(false);
  const [errorApprove, setErrorApprove] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("");

  const [isView, setIsView] = useState(false);

  const [isModalView, setIsModalView] = useState(false);
  const [getMttpData, setGetMttpData] = useState([]);
  const [getMttpHoldData, setMttpHoldData] = useState([]);
  const [getMttpRejectedData, setMttpRejectedData] = useState([]);
  const [getMttpCompletedData, setMttpCompletedData] = useState([]);
  const isBrandTab = localStorage.getItem("selectedTicketTab") === "Brand";
  const [formData, setFormData] = useState({
    vendorName: "",
    vendorLocation: "",
    gstNo: "",
    vendorCode: "",
    vendorMailId: "",
    currency: "",
    paymentTerm: "",
    remarks: "",
    totalBaseValue: "",
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
  const handlefileClose = () => {
    setfileModal(false);
    setSelectedMttpData(null);
    setApproveReject(false);
    setButtonDisable(false);
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
    fetchMttpData();
    fetchNewPoApprovers();
  }, []);

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
  const [filteredDataMttp, setFilteredDataMttp] = useState([]);
  const [filteredDataMttpHold, setFilteredDataMttpHold] = useState([]);
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
    if (!Array.isArray(getMttpHoldData)) {
      setFilteredDataMttp([]);
      return;
    }

    const filtered = getMttpHoldData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.createdAt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredDataMttpHold(filtered);
  }, [getMttpHoldData, searchQuery]);
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
      // setgettrackerrTicket(response.data || []);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchQuery(searchValue);
  };

  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     if (searchQuery.trim()) {
  //       handleSearch(searchQuery); // Pass searchQuery here
  //     } else {
  //       setSearchResults([]); // Clear results if input is empty
  //     }
  //   }, 500); // Adjust the debounce delay as needed

  //   return () => clearTimeout(timeoutId); // Cleanup the timeout
  // }, [searchQuery]); // Trigger on searchQuery change
  useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);
  useEffect(() => {
    if (!searchis && searchQuery !== "") {
      setSearchQuery("");
    }
  }, [searchis]);
  const handleExpand = (record) => {
    const brandArray = record.brand;

    setExpandedRowKeys((prevExpandedRowKeys) => {
      if (brandArray && brandArray.length > 1) {
        brandArray.forEach((subBrandId) => {
          if (!prevExpandedRowKeys.includes(subBrandId)) {
            prevExpandedRowKeys.push(subBrandId);
          }
        });
      }
      return [...prevExpandedRowKeys];
    });
  };

  const [ticketdatahold, setticketdatahold] = useState([]);
  //hold
  const title_ticket_tablehishold = [
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? <pre>₹ {totalBaseValue.toLocaleString('en-IN')}</pre> : <pre>-</pre>}
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
        const isHold = record.status === "Hold";
        const badgeColor = isCompleted ? "#52c41a" : isHold ? "#faad14" : "#faad14";
        const Icon = isCompleted ? MdCheckCircle : MdAccessTime;
        const statusText = isCompleted ? "Completed" : formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span style={{
              backgroundColor: "transparent",
              color: badgeColor,
              padding: "0px",
              borderRadius: "0px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "13px",
              gap: "6px",
              fontWeight: "700",
              }}>
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
                  Viewticketfunction(record.id);
                  setTicketId(record.id);
                  // DataTicket();
                  setMode("retrieve");
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
          </>
        );
      },
    },
  ];
  const 
  mttp_hold_table = [
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
      dataIndex: "formattedCreatedAt",
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
      render: (username, _, index) => {
        return (
          <React.Fragment key={`username-${index}`}>
            <pre>{username || ""}</pre>
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
        const isRejected = _.status === "Reject";
        const isHold = _.status === "Hold";
        const badgeColor = isRejected ? "#ff4d4f" : isHold ? "#faad14" : "#faad14";
        const Icon = isRejected ? MdCancel : MdAccessTime;
        const statusText = isRejected ? formatStatus(rejectedStatus.name) : formatStatus(stage);
        return (
          <span key={`status-${index}`}>
            <span style={{ 
              backgroundColor: "transparent",
              color: badgeColor,
              padding: "0px",
              borderRadius: "0px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "13px",
              gap: "6px",
              fontWeight: "700",
            }}>
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
  //inbox
  const title_ticket_table = [
    {
      title: "S.No",
      dataIndex: "brand",
      render: (text, record, index) => (
        <>
          <pre>{index + 1}</pre>
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
            {totalBaseValue ? <pre>₹ {totalBaseValue.toLocaleString('en-IN')}</pre> : <pre>-</pre>}
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
        const approvedStatus = _.historyList
          ?.filter((entry) => entry.status.toLowerCase() === "approved")
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
        const isRejected = _.status === "Reject";
        const Icon = isRejected ? MdCancel : MdAccessTime;
        const statusText = isRejected ? formatStatus(rejectedStatus?.name) : formatStatus(stage);
        return (
          <pre>
            <span
              key={`status-${index}`}
              className={
                approvedStatus?.name === "Po_release" ||
                (stage === "Po_maker" &&
                  approvedStatus?.name === "Po_checker" &&
                  rejectedStatus?.name !== "Po_release")
                  ? "yellow_txt"
                  : _.status === "Reject"
                  ? "red_txt"
                  : !isBrandTab && approvedStatus?.name === "Budget_Team"
                  ? "blue_txt"
                  : "green_txt"
              }
            >
              <Icon style={{ fontSize: "14px", marginRight: "6px" }} />
              {statusText}
            </span>
          </pre>
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
                    // setMode("maker");

                    setMode(record.stage === "Po_maker" ? "maker" : "");
                    setIsView(true);
                    showModal();
                    Viewticketfunction(record.id);
                    setTicketId(record.id);
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
  const mttp_table = [
    {
      title: "S.No",
      dataIndex: "brand",
      render: (text, record, index) => (
        <>
          <pre>{index + 1}</pre>
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
        const approvedStatus = _.historyList
          ?.filter((entry) => entry.status.toLowerCase() === "approved")
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
        const isRejected = _.status === "Reject";
        const badgeColor = 
          approvedStatus?.name === "Po_release" ||
          (stage === "Po_maker" &&
            approvedStatus?.name === "Po_checker" &&
            rejectedStatus?.name !== "Po_release")
            ? "#faad14"
            : _.status === "Reject"
            ? "#ff4d4f"
            : "#52c41a";
        const Icon = isRejected ? MdCancel : MdAccessTime;
        const statusText = isRejected ? formatStatus(rejectedStatus?.name) : formatStatus(stage);
        return (
          <span key={`status-${index}`}>
            <span style={{ 
              backgroundColor: "transparent",
              color: badgeColor,
              padding: "0px",
              borderRadius: "0px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "13px",
              gap: "6px",
              fontWeight: "700",
             }}>
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
  const [ticketdataedit, setticketdataedit] = useState({
    // vendorMailId: ticketdataedit.vendorMailId,
    // Add other fields as needed
  });
  //completed
  const [getTickethistab, setgetTickethistab] = useState([]);
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? <pre>₹ {totalBaseValue.toLocaleString('en-IN')}</pre> : <pre>-</pre>}
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
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{bulletPoints || first}</pre>
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        const badgeColor = isCompleted ? "#52c41a" : "#faad14";
        const Icon = isCompleted ? MdCheckCircle : MdAccessTime;
        const statusText = isCompleted ? "Completed" : formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span style={{ 
              backgroundColor: "transparent",
              color: badgeColor,
              padding: "0px",
              borderRadius: "0px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "13px",
              gap: "6px",
              fontWeight: "700",
              }}>
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
                    setMode("view");
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
  const mttp_complete_table = [
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
        return (
          <span key={`status-${index}`} className="green_txt">
            <pre>
              {" "}
              {record.stage === "Completed"
                ? record.stage
                : `Waiting for ${record.stage ? formatStatus(record.stage) : "Unknown"
                } Approval`}
            </pre>
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
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? <pre>₹ {totalBaseValue.toLocaleString('en-IN')}</pre> : <pre>-</pre>}
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
        const badgeColor = isCompleted ? "#52c41a" : "#faad14";
        const Icon = isCompleted ? MdCheckCircle : MdAccessTime;
        const statusText = isCompleted ? "Completed" : formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span style={{ 
              backgroundColor: "transparent",
              color: badgeColor,
              padding: "0px",
              borderRadius: "0px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "13px",
              gap: "6px",
              fontWeight: "700",
              }}>
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
                  setMode("view");
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
          </>
        );
      },
    },
  ];
  const mttp_tablereject = [
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
        const badgeColor = isCompleted ? "#52c41a" : "#faad14";
        const Icon = isCompleted ? MdCheckCircle : MdAccessTime;
        const statusText = isCompleted ? "Completed" : formatStatus(record.stage);
        return (
          <span key={`status-${index}`}>
            <span style={{ 
              backgroundColor: "transparent",
              color: badgeColor,
              padding: "0px",
              borderRadius: "0px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "13px",
              gap: "6px",
              fontWeight: "700",
              }}>
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
                  setButtonDisable(true);
                  setSelectedMttpData(record);
                  setfileModal(true);
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
          </>
        );
      },
    },
  ];

  const [editid, seteditId] = useState({});
  const [ticket_basic_dataedit, setticket_basic_dataedit] = useState({});
  const [ticket_brand_dataedit, setticket_brand_dataedit] = useState([
    {
      // brandOrNonBrand: ticket_brand_dataedit.brandOrNonBrand,
      // Add other brand fields as needed
    },
  ]);
  const [ticket_history_data, setticket_history_data] = useState([]);
  const [isRelatedCheck, setIsRelatedCheck] = useState("");

  const Viewticketfunction = async (id) => {
    try {
      const apiUrl = BaseUrl + "api/ticket/getTicketById/" + id;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const record = await response.json();
      const totalBaseValue = record?.data?.totalBaseValue || 0;
      fetchPoApprovers(totalBaseValue);
      setCheckRes(record?.data?.budgetDetails);
      setCheckAvailable(record?.data?.reason);
      if (record?.data?.isRelated !== null) {
        setIsRelatedCheck(record?.data?.isRelated ? "YES" : "NO");
      }

      setFormData({
        ...record.data,
      });

      seteditId(id);

      //const formDataArray = JSON.parse(record.data.brand.brand);
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
     const lastReject = brandData1
    ?.filter((entry) => entry.status.toLowerCase() === "reject")
    ?.slice(-1)[0];
    const lastRejectIndex = lastReject ? brandData1.lastIndexOf(lastReject) : -1;
const laterApproved = lastReject && brandData1
?.slice(lastRejectIndex + 1)
?.some((entry) => entry.name === lastReject.name && entry.status.toLowerCase() === "approved");
setPraAttach(laterApproved ? undefined : lastReject?.name);


      if (Array.isArray(brandData1) && brandData1.length > 0) {
        setticket_history_data([...brandData1]);
      } else {
        console.error("Brand data is not in the expected format or is empty.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleFormApprove = async (formData) => {
    if (!("remarks" in formData) || !formData.remarks) {
      formData.remarks = "";
    }
    try {
      const token = localStorage.getItem("accessToken");
      const form = new FormData();

      form.append("ticketId", editid);
      form.append("approvalStatus", "Approved");
      form.append("remarks", formData.remarks || "");
      form.append("ponumber", formData.poNumber || "");
      if (formData.isRelated)
        form.append("isRelated", formData.isRelated === "YES");
      if (formData.budgetExceedAvailable)
        form.append(
          "budgetDetails",
          formData.budgetExceedAvailable === "Available" ? "Yes" : "No"
        );
      if (formData.poApprover) form.append("userId", formData.poApprover);
      if (formData.poReSubmitUser)
        form.append("stage", formData.poReSubmitUser);

      if (Array.isArray(formData.budgetFile)) {
        formData.budgetFile
          .filter((file) => file instanceof File)
          .forEach((file) => {
            form.append("budgetFile", file);
          });
      }

      if (Array.isArray(formData.deletedBudgetFiles)) {
        formData.deletedBudgetFiles.forEach((file) => {
          form.append("deletedBudgetFiles", file);
        });
      }

      if (Array.isArray(formData.poApproverFile)) {
        formData.poApproverFile
          .filter((file) => file instanceof File)
          .forEach((file) => {
            form.append("poApproverFile", file);
          });
      }

      if (Array.isArray(formData.deletedPoApproverFiles)) {
        formData.deletedPoApproverFiles.forEach((file) => {
          form.append("deletedPoApproverFiles", file);
        });
      }

      const response = await axios.post(
        `${BaseUrl}api/ticket/approveByPOM`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        setSuccessMessage("Approved successfully!");
        setMode(" ");
        DataTickethistab();
        DataTicket();
        setIsModalView(true);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        const notificationIdToDelete = notifications.find(
          (notif) => notif.id === editid
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
          error.response.data?.message || error.response.data ||
          "An unexpected error occurred. Please try again.";
        toast.error(typeof errorMessage === "string" ? errorMessage : "An unexpected error occurred.", { duration: 1000 });
        setErrorApprove(typeof errorMessage === "string" ? errorMessage : "An unexpected error occurred.");
      } else {
        setErrorApprove("An unexpected error occurred. Please try again.");
      }
    }
  };
  const handlePoApprove = async (formData) => {
    if (!("remarks" in formData) || !formData.remarks) {
      formData.remarks = "";
    }
    const formDataToSend = new FormData();

    for (const key in formData) {
      if (Array.isArray(formData[key])) {
        formData[key].forEach((item, index) => {
          if (key === "poattachment") {
            formDataToSend.append("attchPoCopyNo", item);
          } else if (typeof item === "object" && item !== null) {
            for (const field in item) {
              if (
                item[field] !== undefined &&
                item[field] !== "" &&
                item[field] !== null &&
                !field.endsWith("Options")
              ) {
                formDataToSend.append(`${key}[${index}].${field}`, item[field]);
              }
            }
          }
        });
      } else if (
        formData[key] !== undefined &&
        formData[key] !== "" &&
        formData[key] !== null &&
        !key.endsWith("Options")
      ) {
        formDataToSend.append(key, formData[key]);
      }
    }
    const encodedRemarks = encodeURIComponent(formData.remarks || "");
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}api/ticket/updateAttachPoCopyNo?ticketId=${editid}&approvalStatus=Completed&remarks=${encodedRemarks}`;
      const response = await axios.put(apiUrl, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        setSuccessMessage("Approved successfully!");
        setMode(" ");
        DataTickethistab();
        DataTicket();
        setIsModalView(true);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        const notificationIdToDelete = notifications.find(
          (notif) => notif.id === editid
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
          error.response.data?.message || error.response.data ||
          "An unexpected error occurred. Please try again.";
        setErrorApprove(typeof errorMessage === "string" ? errorMessage : "An unexpected error occurred.");
      } else {
        setErrorApprove("An unexpected error occurred. Please try again.");
      }
    }
  };
  const handleFormRemarks = async (formData) => {
    const encodedRemarks = encodeURIComponent(formData.remarks || "");
    try {
      const token = localStorage.getItem("accessToken");
      let apiUrl = `${BaseUrl}api/ticket/approveByPOM?ticketId=${editid}&approvalStatus=Reject&remarks=${encodedRemarks}`;
      if (formData.rejectUser) {
        apiUrl += `&stage=${formData.rejectUser}`;
      }
      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        setSuccessMessage("Rejected successfully!");
        DataTicket();
        TicketReject();
        setMode(" ");
        setIsModalView(true);
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
          error.response.data?.message || error.response.data ||
          "An unexpected error occurred. Please try again.";
        setErrorRemarks(typeof errorMessage === "string" ? errorMessage : "An unexpected error occurred.");
      } else {
        setErrorRemarks("An unexpected error occurred. Please try again.");
      }
    }
    const notificationIdToDelete = notifications.find(
      (notif) => notif.id === editid
    );
    if (notificationIdToDelete) {
      handleClearNotification(notificationIdToDelete);
    }
  };
  const handlePoRemarks = async (formData) => {
    const encodedRemarks = encodeURIComponent(formData.remarks || "");
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}api/ticket/updateAttachPoCopyNo?ticketId=${editid}&approvalStatus=Reject&remarks=${encodedRemarks}`;

      const response = await axios.put(
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
        DataTicket();
        TicketReject();
        setMode(" ");
        setIsModalView(true);
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
          error.response.data?.message || error.response.data ||
          "An unexpected error occurred. Please try again.";
        setErrorRemarks(typeof errorMessage === "string" ? errorMessage : "An unexpected error occurred.");
      } else {
        setErrorRemarks("An unexpected error occurred. Please try again.");
      }
    }
    const notificationIdToDelete = notifications.find(
      (notif) => notif.id === editid
    );
    handleClearNotification(notificationIdToDelete);
  };

  /* Download File API */
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
  const [filteredDataCom, setFilteredDataCom] = useState([]);
  useEffect(() => {
    setFilteredDataCom(applySearch(getTickethistab, searchQuery));
  }, [getTickethistab, searchQuery]);
  //hold tab
  const [filteredDataHold, setFilteredDataHold] = useState([]);
  useEffect(() => {
    setFilteredDataHold(applySearch(ticketdatahold, searchQuery));
  }, [ticketdatahold, searchQuery]);

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
  const handleValidation = () => {
    let isValid = true;

    if (!startDate) {
      setStartDateError("Start date is required");
      isValid = false;
    } else {
      setStartDateError("");
    }

    if (!endDate) {
      setEndDateError("End date is required");
      isValid = false;
    } else {
      setEndDateError("");
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError("Start date cannot be later than end date");
      isValid = false;
    } else {
      setDateError("");
    }

    return isValid;
  };

  const [successMessage, setSuccessMessage] = useState(null);
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const requestData = {
      ticketId: editid,
      approvalStatus: "Approved",
      userId: bapprover,
      ponumber: ponumber,
      isRelated: related,
      remarks: remarks,
    };

    setBApprovererror("");
    setPoNumberror("");
    setRelatederror("");
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = BaseUrl + "api/ticket/approveByPOM";
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          //'Content-Type': 'application/json',
          "Content-Type": "multipart/form-data",
        },
      });

      DataTicket();
      setIsLoading(false);
      setSuccessMessage("Approved successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
      setviewModal(false);
      setIsDataChanged(true);
      setPoNumber("");
      setBApprover("");
      setRelated("");
      setApproveModal(false);
      setRemarks("");
      handleRCancel();
      setErrorRemarks("");
    } catch (error) {
      if (error.response) {
        const errorMessage =
          error.response.data?.message || error.response.data ||
          "An unexpected error occurred. Please try again.";
        setErrorRemarks(typeof errorMessage === "string" ? errorMessage : "An unexpected error occurred.");
      } else {
        setErrorRemarks("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
    const notificationIdToDelete = notifications.find(
      (notif) => notif.id === editid // Assuming ticketId links to the notification
    );
    handleClearNotification(notificationIdToDelete);
  };

  // const handlesubmitpoattach = async () => {
  //   if (!attachment || attachment.length === 0) {
  //     setAttachmenterror("At least one attachment is required");
  //     return;
  //   }
  //   setAttachmenterror("");

  //   const formData = new FormData();
  //   formData.append("ticketId", editid);

  //   attachment.forEach((file, index) => {
  //     formData.append(`attchPoCopyNo`, file);
  //   });

  //   try {
  //     const token = localStorage.getItem("accessToken");
  //     const apiUrl = `${BaseUrl}api/ticket/updateAttachPoCopyNo`;

  //     const response = await axios.put(apiUrl, formData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     setSuccessMessage("Ticket Completed successfully!");
  //     setTimeout(() => {
  //       setSuccessMessage(null);
  //     }, 1000);
  //     setviewModal(false);
  //     setIsDataChanged(true);
  //     setAttachment([]);
  //   } catch (error) {
  //     console.error("Error sending data to backend:", error);
  //   }
  //   const notificationIdToDelete = notifications.find(
  //     (notif) => notif.id === editid // Assuming ticketId links to the notification
  //   );
  //   handleClearNotification(notificationIdToDelete);
  // };
  // const handlesubmitporelease = async () => {
  //   const requestData = {
  //     ticketId: editid,
  //     approvalStatus: "Approved",
  //     userId: bapprover,
  //     ponumber: ponumber,
  //     isRelated: related,
  //     remarks: related,
  //   };

  //   try {
  //     const token = localStorage.getItem("accessToken");
  //     const apiUrl = BaseUrl + "api/ticket/ticket-approve";
  //     const response = await axios.post(apiUrl, requestData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         //'Content-Type': 'application/json',
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     setSuccessMessage("Approved successfully!");
  //     setTimeout(() => {
  //       setSuccessMessage(null);
  //     }, 1000);
  //     setviewModal(false);
  //     setIsDataChanged(true);
  //     setPoNumber("");
  //     setBApprover("");
  //     setRelated("");
  //   } catch (error) {
  //     console.error("Error sending data to backend:", error);
  //   }
  // };
  const handlereject = async (e) => {
    const approvalStatus = "Reject";
    const remark = approvalStatus === "Reject" ? remarks : "";
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl =
        BaseUrl +
        `api/ticket/approveByPOM?ticketId=${editid}&approvalStatus=Reject&userId=${bapprover}&ponumber=${ponumber}&isRelated=${"false"}&remarks=${remark}`;

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            //'Content-Type': 'application/json',
            "Content-Type": "multipart/form-data",
          },
        }
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
      (notif) => notif.id === editid // Assuming ticketId links to the notification
    );
    handleClearNotification(notificationIdToDelete);
  };
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("selectedStatusTab") || "first";
  }); // or useState("hold")

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setSearchis(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  useEffect(() => { }, [activeTab]);

  const [ponumber, setPoNumber] = useState("");
  const [bapprover, setBApprover] = useState("");
  const [related, setRelated] = useState("");
  const [ponumbererror, setPoNumberror] = useState("");
  const [bapprovererror, setBApprovererror] = useState("");
  const [relatederror, setRelatederror] = useState("");
  const [attachmenterror, setAttachmenterror] = useState("");

  const [userData, setUserData] = useState([]);
  const [poApprovers, setPoApprovers] = useState([]);

  const fetchPoApprovers = async (totalBaseValue, brandType) => {
    try {
      const ticketType = localStorage.getItem("selectedTicketTab") === "Brand" ? "Brand" : "NonBrand";
      const response = await fetch(
        `${BaseUrl}budget/po-approver-by-budget?amount=${totalBaseValue}&ticketType=${ticketType}`
      );

      const data = await response.json();
      if (response.status === 200) {
        setUserData(data?.users);
      } else {
        console.error(
          "Error fetching user data:",
          data.message || "Invalid response"
        );
        setUserData([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData([]);
    }
  };
  const fetchNewPoApprovers = async () => {
    try {
      const response = await fetch(`${BaseUrl}budget/all-po-approvers`);

      const data = await response.json();
      if (response.status === 200) {
        setPoApprovers(data[0]?.users);
      } else {
        console.error(
          "Error fetching user data:",
          data.message || "Invalid response"
        );
        setPoApprovers([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setPoApprovers([]);
    }
  };

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
    let response;
    try {
      response = await axios.put(
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
    setMode(response?.data?.role === "Po_maker" ? "maker" : "");
    setIsView(true);
    showModal();
    setTicketId(notification.id);
    Viewticketfunction(notification.id);
  };
  const [ticketId, setTicketId] = useState("");
  const [openHoldModal, setOpenHoldModal] = useState(false);
  const [openRetrieveModal, setOpenRetrieveModel] = useState("");

  const handleOpenHold = () => {
    setOpenHoldModal(true);
  };

  const handleCloseHold = () => {
    setOpenHoldModal(false);
  };

  const handleOpenRetrieve = () => {
    setOpenRetrieveModel(true);
  };
  const handleCloseRetrieve = () => {
    setOpenRetrieveModel(false);
  };

  // const handleHoldTicket = async () => {
  //   try {
  //     const response = await holdTicket();

  //   } catch (error) {
  //     console.error("Failed to hold the ticket:", error);
  //   }
  // };

  const handleFormHold = async (formData) => {
    if (!("remarks" in formData) || !formData.remarks) {
      formData.remarks = "";
    }
    const encodedRemarks = encodeURIComponent(formData.remarks || "");
    try {
      const response = await axios.put(
        `${BaseUrl}api/ticket/hold?ticketId=${ticketId}&status=Hold&remarks=${encodedRemarks}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (response.status === 200) {
        setSuccessMessage("Ticket has been put on hold successfully!");
        HoldTicket();
        setIsModalOpen(false);
        setOpenHoldModal(false);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        DataTicket();
      }
      return response.data;
    } catch (error) {
      console.error(
        "Error holding ticket:",
        error.response?.data || error.message
      );
      // throw error;
    }
  };
  // const handleRetrieveTicket = async () => {
  //   try {
  //     const response = await RetrieveTicket();

  //   } catch (error) {
  //     console.error("Failed to retrieve the ticket:", error);
  //   }
  // };
  // const handleRetrieveTicket = async () => {
  //   try {
  //     const response = await axios.get(
  //       `${BaseUrl}api/ticket/getTicketById/${ticketId}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  //         },
  //       }
  //     );
  //     if (response.status === 200) {
  //       setOpenRetrieveModel(false);
  //       setviewModalcomplete(false);
  //       setViewmodalhold(false);
  //       DataTicket();
  //     }
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error retrieving ticket:", error.response?.data || error.message);
  //     throw error;
  //   }
  // };
  const handleRetrieveTicket = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}api/ticket/hold?ticketId=${editid}&status=Retrieve`;
      const response = await axios.put(
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
        setSuccessMessage("Retrieved successfully!");
        HoldTicket();
        DataTicket();
        setIsModalView(true);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        setIsModalOpen(false);
      } else {
        const errorMessage =
          response.data?.message || "Error occurred while submitting data.";
        setErrorApprove(errorMessage);
      }
    } catch (error) {
      if (error.response) {
        const errorMessage =
          error.response.data?.message || error.response.data ||
          "An unexpected error occurred. Please try again.";
        setErrorApprove(typeof errorMessage === "string" ? errorMessage : "An unexpected error occurred.");
      } else {
        setErrorApprove("An unexpected error occurred. Please try again.");
      }
    }
  };
  const HoldTicket = async () => {
    try {
      const apiUrl =
        BaseUrl +
        `api/ticket/hold-ticket?stage=${role}&ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
          ? "Brand"
          : "NonBrand"
        }`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setticketdatahold(response.data);
    } catch (error) {
      console.error("Error fetching hold tickets:", error);
    }
  };

  useEffect(() => {
    HoldTicket();
    fetchMttpHoldData();
  }, []);

  const handleMttpUpdate = async (data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();

      if (
        (data.poCopy && data.poCopy.length > 0 && data.poBoolean === true) ||
        (data.poBoolean === true && data.approveStatus === "Reject")
      ) {
        if (data.approveStatus === "Approved") {
          data.poCopy.forEach((file) => formData.append("poCopy", file));
        }

        const apiUrl =
          BaseUrl +
          `mttp-ticket/update-po-copy/${data.id}?status=${data.approveStatus
          }&remarks=${encodeURIComponent(data.remarks)}`;

        const response = await axios.post(apiUrl, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setSuccessMessage(`PO Copy Updated Successfully`);
          setTimeout(() => setSuccessMessage(null), 3000);
          fetchMttpData();
          fetchMttpCompletedData();
          fetchMttpRejectedData();
          handlefileClose();
        }

        return;
      }

      let apiUrl =
        BaseUrl +
        `mttp-ticket/approver-ticket/${data.id}?status=${data.approveStatus
        }&remarks=${encodeURIComponent(data.remarks)}`;

      if (data.approveStatus === "Approved") {
        if (
          Array.isArray(data.updateponumber) &&
          data.updateponumber.length > 0
        ) {
          apiUrl += data.updateponumber
            .map((num) => `&poNumber=${encodeURIComponent(num)}`)
            .join("");
        }
        apiUrl += `&isRelated=${data.relatedToHepl}`;

        if (data.relatedToHepl === true && data.poApprover) {
          apiUrl += `&poApproverId=${data.poApprover}`;
        }

        if (data.files && data.files.length > 0) {
          data.files.forEach((file) => formData.append("file", file));
        }
        if (data.deletedFile && data.deletedFile.length > 0) {
          data.deletedFile.forEach((file) =>
            formData.append("deletedFile", file)
          );
        }
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
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchMttpData();
        fetchMttpCompletedData();
        fetchMttpRejectedData();
        handlefileClose();
      }
    } catch (error) {
      console.error("Error updating MTTP ticket:", error);
    }
  };
  const fetchMttpHoldData = async () => {
    try {
      const apiUrl = `${BaseUrl}mttp-ticket/by-stage?stage=${role}&status=Hold`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const mttpData = response.data?.data || response.data || [];
      setMttpHoldData(Array.isArray(mttpData) ? mttpData : []);
    } catch (error) {
      console.error("Error fetching MTTP data:", error);
      setMttpHoldData([]);
    }
  };

  const handleMttpHold = async (data) => {
    try {
      const token = localStorage.getItem("accessToken");
      let apiUrl =
        BaseUrl +
        `mttp-ticket/approver-ticket/${data.id}?status=${data.approveStatus}`;
      if (data.remarks) {
        apiUrl += `&remarks=${encodeURIComponent(data.remarks)}`;
      }
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
        fetchMttpHoldData();
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
            PO Maker
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
            {isBrandTab ? (
              <CollapsibleTabHeader
                onTabSelect={handleTabSelect}
                activeTab={activeTab}
                tabKeys={[
                  "first",
                  "second",
                  "fourth",
                  "fifth",
                  "sixth",
                  "seventh",
                  "ninth",
                  "tenth",
                ]}
              />
            ) : (
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabSelect}
                className="mb-0"
              >
                <Tab eventKey="first" title="INBOX" />
                <Tab eventKey="second" title="HOLD" />
                <Tab eventKey="fourth" title="REJECTED" />
                <Tab eventKey="fifth" title="COMPLETED" />
              </Tabs>
            )}
          </div>
          <Box
            className="search_box"
            // onSubmit={handleSearch}
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
            {["first", "second", "fourth", "fifth"].includes(activeTab) && (
              <button
                className="download-btn pixel-corners"
                onClick={(e) => {
                  e.preventDefault();
                  handleExportOpen();
                }}
              >
                <div className="button-content">
                  <div className="svg-container">
                    <svg
                      className="download-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.479 10.092c-.212-3.951-3.473-7.092-7.479-7.092-4.005 0-7.267 3.141-7.479 7.092-2.57.463-4.521 2.706-4.521 5.408 0 3.037 2.463 5.5 5.5 5.5h13c3.037 0 5.5-2.463 5.5-5.5 0-2.702-1.951-4.945-4.521-5.408zm-7.479 6.908l-4-4h3v-4h2v4h3l-4 4z"></path>
                    </svg>
                  </div>
                  <div className="text-container">
                    <div className="text">Export</div>
                  </div>
                </div>
              </button>
            )}
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
                  loading={isLoading}
                  columns={title_ticket_table}
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
          {activeTab === "second" && (
            <div className="container-fluid table_bg">
              <div className="table-responsive">
                <Table
                  columns={title_ticket_tablehishold}
                  loading={isLoading}
                  dataSource={filteredDataHold}
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
                  loading={isLoading}
                  columns={mttp_table}
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
          {activeTab === "seventh" && (
            <div className="container-fluid table_bg">
              <div className="table-responsive">
                <Table
                  columns={mttp_hold_table}
                  dataSource={filteredDataMttpHold}
                  pagination={{ pageSize: 10 }}
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
      <Modal show={isModalExportOpen} onHide={handleExportClose}>
        <Modal.Header
          closeButton
          className="modal-close-outremark modal-close-out"
        >
          <Modal.Title className="mt-2 mx-3">Select Date Range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="formStartDate">
            <label className="mt-3">
              Start Date <span className="required-field">*</span>
            </label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => {
                const formattedDate = new Date(e.target.value)
                  .toISOString()
                  .split("T")[0];
                setStartDate(formattedDate);
                setStartDateError(""); // Add this line
                setDateError("");
                setEndDate(null);
                setExportError("");
              }}
              max={new Date().toISOString().split("T")[0]}
              className="mb-3 mt-1"
            />
            {startDateError && <p className="text-danger">{startDateError}</p>}
          </Form.Group>
          <Form.Group controlId="formEndDate">
            <label className="mt-3">
              End Date <span className="required-field">*</span>
            </label>
            <Form.Control
              type="date"
              value={endDate || ""}
              onChange={(e) => {
                const formattedDate = new Date(e.target.value)
                  .toISOString()
                  .split("T")[0];
                setEndDate(formattedDate);
                setEndDateError("");
                setDateError("");
                setExportError("");
              }}
              min={startDate}
              max={new Date().toISOString().split("T")[0]}
              disabled={!startDate}
              className="mb-3 mt-1"
            />
            {endDateError && <p className="text-danger">{endDateError}</p>}
          </Form.Group>
          {dateError && <p className="text-danger">{dateError}</p>}
          {exportError && <p className="text-danger mt-3">{exportError}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleExportClose}
            className="btn_cancel mx-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="remarksbtns mx-2"
            onClick={handleExportClick}
          >
            Export
          </Button>
        </Modal.Footer>
      </Modal>
      <CustomModal
        isModalOpen={isModalOpen}
        mode={mode}
        data={formData}
        isView={isView}
        isModalView={isModalView}
        Pomaker={userData}
        handleFormApprove={handleFormApprove}
        handlePoApprove={handlePoApprove}
        handleFormRemarks={handleFormRemarks}
        handlePoRemarks={handlePoRemarks}
        handleFormHold={handleFormHold}
        handleRetrieveTicket={handleRetrieveTicket}
        brandDataLength={brandDataLength}
        brandDataArray={brandDataArray}
        checkAvailable={checkAvailable}
        poattach={poattach}
        praattach={praattach}
        checkRes={checkRes}
        isRelatedCheck={isRelatedCheck}
        isBrand={isBrandTab}
        handleOk={handleOk}
        handleCancel={handleCancel}
      />

      <FileUploadModal
        show={fileupload}
        onHide={handlefileClose}
        onUpdate={handleMttpUpdate}
        initialData={selectedMttpData}
        approveReject={approveReject}
        buttonDisable={buttonDisable}
        poApprover={poApprovers}
        activeTab={activeTab}
        onHold={handleMttpHold}
      />
    </div>
  );
};
export default Pomaker;
