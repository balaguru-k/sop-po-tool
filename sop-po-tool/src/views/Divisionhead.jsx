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
import { setLoaderCallback } from "../utils/Configs.js";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import image from "../assets/images/time-and-date (1).png";
import moment from "moment";
import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CustomModal from "./CustomModal.jsx";
import VendorAvatar from '../components/VendorAvatar';

const Divisionhead = (props) => {
  const [isDataChanged, setIsDataChanged] = useState(false);
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("");
  const [isView, setIsView] = useState(false);
  const [brandDataArray, setBrandDataArray] = useState([]);
  const [errorApprove, setErrorApprove] = useState("");
  const [isModalView, setIsModalView] = useState(false);
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
  const isFetching = useRef(false);
  const [checkRes, setCheckRes] = useState("");
  const [checkAvailable, setCheckAvailable] = useState("");
  const [isRelatedCheck, setIsRelatedCheck] = useState("");
  const [poattach, setPoAttach] = useState([]);
  const [tabData, setTabData] = useState("");
  const role = localStorage.getItem("role");
  const [getTicketReject, setGetTicketReject] = useState([]);

  const TicketReject = async () => {
    try {
      const apiUrl = `${BaseUrl}api/ticket/rejected-tickets?stage=Division_Head`;

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
      const apiUrl = BaseUrl + "api/ticket/getAllByCommonStage/" + role;
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
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}api/ticket/approveByDH?ticketId=${editid}&approvalStatus=Reject&remarks=${formData.remarks}`;

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
      (notif) => notif.id === editid // Assuming ticketId links to the notification
    );
    handleClearNotification(notificationIdToDelete);
  };
  const handleFormApprove = async (formData) => {
    if (!("remarks" in formData) || !formData.remarks) {
      formData.remarks = "";
    }
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}api/ticket/approveByDH?ticketId=${editid}&approvalStatus=Approved&remarks=${formData.remarks}`;

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
        setIsModalView(true);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        const notificationIdToDelete = notifications.find(
          (notif) => notif.id === editid // Assuming ticketId links to the notification
        );
        handleClearNotification(notificationIdToDelete);
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
    const roles = localStorage.getItem("role");

    try {
      const apiUrl = `${BaseUrl}api/ticket/get_notifications/${roles}`;

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

      // Update the notifications state: Add new notifications to the top
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
    // Set up WebSocket connection
    const socket = new SockJS(BaseUrl + "ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        const id = localStorage.getItem("id");
        stompClient.subscribe("/topic/Business_head", (message) => {
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

  const DataTickethistab = async () => {
    try {
      const apiUrl = BaseUrl + "api/ticket/getAllComplticketsByStage/" + role;
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
    DataTickethistab();
  }, [isDataChanged]);
  const [viewmodal, setviewModal] = useState(false);
  const [remarkModal, setRemarkModal] = useState(false);
  const handleviewClose = () => setviewModal(false);
  const handleviewShow = () => setviewModal(true);
  const [approveModal, setApproveModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchis, setSearchis] = useState(false);
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

  const openApproveModal = () => {
    setApproveModal(true);
  };
  const handleRCancel = () => {
    setRemarkModal(false);
    setRemarks("");
    setApproveModal(false);
  };
  const [remarks, setRemarks] = useState("");
  const [stsmodal, setstsModal] = useState(false);
  const handlestsClose = () => setstsModal(false);
  const handlestsShow = () => setstsModal(true);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [errorRemarks, setErrorRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);

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
            <VendorAvatar name={vendorName} />
          </React.Fragment>
        );
      },
    },
    {
      title: "Vendor Code",
      dataIndex: "vendorCode",
      render: (vendorCode, _, index) => {
        return (
          <React.Fragment key={`vendorCode-${index}`}>
            <pre>{vendorCode || ""}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Total Base Amount",
      dataIndex: "totalBaseValue",
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? <pre>{totalBaseValue}</pre> : <pre>-</pre>}
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
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        };

        const formattedStatus = status ? formatStatus(status) : "Unknown";

        const statusClass =
          formattedStatus.toLowerCase() === "reject"
            ? "red_txt"
            : formattedStatus.toLowerCase() === "approve"
            ? "green_txt"
            : "green_txt";

        return (
          <span key={`status-${index}`} className={statusClass}>
            {`Waiting for  ${record.stage} Approval`}
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
              </a>{" "}
            </Tooltip>
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
            <VendorAvatar name={vendorName} />
          </React.Fragment>
        );
      },
    },
    {
      title: "Vendor Code",
      dataIndex: "vendorCode",
      render: (vendorCode, _, index) => {
        return (
          <React.Fragment key={`vendorCode-${index}`}>
            <pre>{vendorCode || ""}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Total Base Amount",
      dataIndex: "totalBaseValue",
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? <pre>{totalBaseValue}</pre> : <pre>-</pre>}
          </React.Fragment>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "stage",
      render: (stage, record, index) => {
        // Function to format the status text
        const formatStatus = (status) => {
          return status
            .split("_") // Split the string at each underscore
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ) // Capitalize the first letter of each word
            .join(" "); // Join the words back with a space
        };

        return (
          <span key={`status-${index}`} className="green_txt">
            <pre>
              {" "}
              {record.stage === "Completed"
                ? record.stage
                : `Waiting for ${
                    record.stage ? formatStatus(record.stage) : "Unknown"
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
              </a>{" "}
            </Tooltip>
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
        const dateA = a.formattedCreatedAt || "";
        const dateB = b.formattedCreatedAt || "";
        return dateA.localeCompare(dateB);
      },
      sortDirections: ["descend", "ascend"],
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
            <VendorAvatar name={vendorName} />
          </React.Fragment>
        );
      },
    },
    {
      title: "Vendor Code",
      dataIndex: "vendorCode",
      render: (vendorCode, _, index) => {
        return (
          <React.Fragment key={`vendorCode-${index}`}>
            <pre>{vendorCode || ""}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Total Base Amount",
      dataIndex: "totalBaseValue",
      render: (totalBaseValue, record, index) => {
        return (
          <React.Fragment key={`value-${index}`}>
            {totalBaseValue ? <pre>{totalBaseValue}</pre> : <pre>-</pre>}
          </React.Fragment>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "stage",
      render: (stage, record, index) => {
        // Function to format the status text
        const formatStatus = (status) => {
          return status
            .split("_") // Split the string at each underscore
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ) // Capitalize the first letter of each word
            .join(" "); // Join the words back with a space
        };

        return (
          <span key={`status-${index}`} className="green_txt">
            <pre>
              {" "}
              {record.stage === "Completed"
                ? record.stage
                : `Waiting for ${
                    record.stage ? formatStatus(record.stage) : "Unknown"
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
              </a>{" "}
            </Tooltip>
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
  const [ticket_basic_dataedit, setticket_basic_dataedit] = useState({});
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
      setticketdataedit({
        ...record.data,
      });
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
      if (Array.isArray(brandData1) && brandData1.length > 0) {
        setticket_history_data([...brandData1]);
      } else {
        console.error("Brand data is not in the expected format or is empty.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const downloadFile = async (
    poCopyAttachment,
    attachment,
    action = "download"
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
  // Completed tab
  const [filteredDataCom, setFilteredDataCom] = useState([]);
  useEffect(() => {
    if (!Array.isArray(getTickethistab)) {
      console.error("getTickethistab is not an array:", getTickethistab);
      setFilteredDataCom([]);
      return;
    }

    const filtered = getTickethistab.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.createdDate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.totalBaseValue?.toString().toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        item.stage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredDataCom(filtered);
  }, [getTickethistab, searchQuery]);
  // Inbox tab
  const [filteredDatainbox, setFilteredDatainbox] = useState([]);
  useEffect(() => {
    const filtered = getTicket.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.createdDate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.totalBaseValue?.toString().toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Update the filtered data
    setFilteredDatainbox(filtered);
  }, [getTicket, searchQuery]);

  const [filteredDataReject, setFilteredDataReject] = useState([]);
  useEffect(() => {
    if (!Array.isArray(getTicketReject)) {
      setFilteredDataReject([]);
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase(); // Convert search query to lowercase for comparison

    const filtered = getTicketReject.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(lowerCaseQuery) ||
        item.createdDate?.toLowerCase().includes(lowerCaseQuery) ||
        item.username?.toLowerCase().includes(lowerCaseQuery) ||
        item.vendorName?.toLowerCase().includes(lowerCaseQuery) ||
        item.vendorCode?.toLowerCase().includes(lowerCaseQuery) ||
        (item.totalBaseValue?.toString() || "")
          .toLowerCase()
          .includes(lowerCaseQuery) ||
        item.status?.toLowerCase().includes(lowerCaseQuery)
    );

    // Update the filtered data
    setFilteredDataReject(filtered);
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

  const [selectedOption, setSelectedOption] = useState("");
  const budgetDetails = ticketdataedit.budgetDetails; // Assuming ticketdataedit.budgetDetails is an array of objects
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
            Business Head
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
                {showNotifications && (
                  <div className="Notification_container">
                    {/* Close Button */}
                    <button
                      className="Notification_close"
                      onClick={handleCloseNotifications}
                    >
                      ✖
                    </button>

                    <h6 className="notify_text">Notifications</h6>

                    {notifications.length > 0 ? (
                      <>
                        {/* Clear All Button */}
                        <ul className="Notification_list">
                          {notifications.map((notification) => (
                            <li
                              className="d-flex justify-content-center align-center notify_addonlist"
                              key={notification.id}
                              style={{
                                fontWeight: notification.readtext
                                  ? "normal"
                                  : "bold",
                                backgroundColor: notification.readtext
                                  ? "white"
                                  : "#e91f3c29", // Color based on readtext
                              }}
                            >
                              <a
                                className="handy-notify"
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNotificationClick(notification);
                                }}
                              >
                                {notification.text || "No text available"}
                              </a>
                              <button
                                className="notifyclear"
                                onClick={() =>
                                  handleClearNotification(notification)
                                }
                              >
                                ✖
                              </button>
                            </li>
                          ))}
                          <button
                            className="notifyclearAll"
                            onClick={handleClearAllNotifications}
                          >
                            Clear All
                          </button>
                        </ul>
                      </>
                    ) : (
                      <p className="p-10">No notifications</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Col>
          <Box
            className="search_box"
            component="form"
            onSubmit={(e) => e.preventDefault()}
            defaultActiveKey="first"
            sx={{
              display: "flex",
              flexDirection: "row-reverse",

              "& > :not(style)": { mr: "26px", mt: "10px", width: "30ch" },
            }}
            noValidate
            autoComplete="off"
          >
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
        </Row>
        <Tabs
          defaultActiveKey="first"
          id="controlled-tab-example"
          activeKey={activeTab}
          onSelect={handleTabSelect}
        >
          <Tab eventKey="first" title="INBOX">
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
          </Tab>
          <Tab eventKey="second" title="REJECTED">
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
          </Tab>
          <Tab eventKey="third" title="COMPLETED">
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
          </Tab>
        </Tabs>
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
            <div className="vendor_details_part">
              <div className="txt_title">Budget Details</div>
              <Row className="mt-3">
                <div className="form-check">
                  <input
                    type="radio"
                    checked={ticketdataedit.budgetDetails === "exceed"}
                    value={ticketdataedit.budgetDetails}
                    readOnly
                  />
                  <label> Exceed</label>
                  {ticketdataedit.budgetDetails === "exceed" && (
                    <div className="grey-background">
                      <div className="exceed_lable">If Exceed Budget*</div>
                      <label>
                        <input
                          type="radio"
                          value="available"
                          checked={ticketdataedit.reason === "available"}
                          className="grey-background"
                          readOnly
                        />
                        Available
                      </label>

                      <label>
                        <input
                          type="radio"
                          value="notavailable"
                          checked={ticketdataedit.reason === "notavailable"}
                          className="grey-background"
                          readOnly
                        />
                        Not Available
                      </label>
                    </div>
                  )}
                  {ticketdataedit.budgetDetails === "NonExceed" && (
                    <>
                      <input
                        type="radio"
                        checked={ticketdataedit.budgetDetails === "NonExceed"}
                        value={ticketdataedit.budgetDetails}
                        readOnly
                      />
                      <label> Not Exceed</label>
                    </>
                  )}
                </div>
              </Row>
            </div>
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
        checkRes={checkRes}
        checkAvailable={checkAvailable}
        isRelatedCheck={isRelatedCheck}
        poattach={poattach}
        tabData={tabData}
        mode={mode}
        data={formData}
        isView={isView}
        isModalView={isModalView}
      />
    </div>
  );
};
export default Divisionhead;
