import React, { useState, useEffect, useRef } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import { UploadOutlined } from "@ant-design/icons";
import { Table, Upload, Button, Tooltip } from "antd";
import Modal from "react-bootstrap/Modal";
import { LuEye } from "react-icons/lu";
import { HiOutlineTrash } from "react-icons/hi2";
import { BaseUrl } from "../App.js";
import axios from "axios";
import { Tab, Tabs } from "react-bootstrap";
import CollapsibleTabHeader from "../components/CollapsibleTabHeader";
import { BiMessageDots } from "react-icons/bi";
import { MdCheckCircle, MdCancel, MdAccessTime, MdRestore } from "react-icons/md";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"; // Import the UTC plugin
import timezone from "dayjs/plugin/timezone";

import { setLoaderCallback } from "../utils/Configs.js";
import CustomModal from "./CustomModal.jsx";
import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import image from "../assets/images/time-and-date (1).png";
import moment from "moment";
import { FaEye } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import e from "cors";
import "../styles/notifications.css";
import NotificationModal from "../views/NotificationModal.jsx";
import FileUploadModal from "../views/FileUploadModal.jsx";
import CustomExportComponent from "../components/CustomExportComponent.jsx";
import { applySearch } from "../utils/FormValidation.js";
import VendorAvatar from '../components/VendorAvatar';

// Extend dayjs with the UTC plugin
dayjs.extend(utc);
dayjs.extend(timezone);
const Request = (index, props) => {
  const globalBoldStyle = { fontWeight: "bold" };
  //tab(inbox)
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [isBrand, setIsBrand] = useState(
    localStorage.getItem("selectedTicketTab") === "Brand"
  );
  const isBrandTab = localStorage.getItem("selectedTicketTab") === "Brand";

  useEffect(() => {
    const handleTabChange = () => {
      const selectedTab = localStorage.getItem("selectedTicketTab");
      setIsBrand(selectedTab === "Brand");
      if (selectedTab === "Brand" || selectedTab === "Non Brand") {
        DataTicket();
        DraftTicket();
        TrackerrTicket();
      }
    };
    const handleChatbotTicket = () => {
      DataTicket();
      DraftTicket();
      TrackerrTicket();
      fetchMttpData();
      fetchMttpDraftData();
      fetchMttpCompletedData();
      fetchDeletedTickets();
    };
    window.addEventListener("tabChanged", handleTabChange);
    window.addEventListener("storage", handleTabChange);
    window.addEventListener("chatbotTicketCreated", handleChatbotTicket);
    return () => {
      window.removeEventListener("tabChanged", handleTabChange);
      window.removeEventListener("storage", handleTabChange);
      window.removeEventListener("chatbotTicketCreated", handleChatbotTicket);
    };
  }, []);
  const [isModalVisible, setModalVisible] = useState(false);
  const [tabData, setTabData] = useState("");
  const [attachmentToDelete, setAttachmentToDelete] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [getTicket, setgetTicket] = useState([]);
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");
  const [file, setFile] = useState(null);
  const [setNewSapvalue] = useState("");
  const [setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setIsEditable] = useState(false);
  const [checkRes, setCheckRes] = useState("");
  const [checkAvailable, setCheckAvailable] = useState("");
  const [isRelatedCheck, setIsRelatedCheck] = useState("");
  const [poattach, setPoAttach] = useState([]);
  const [editid, seteditId] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);
  const handleFileChange = (info) => {
    setFile(info.file.originFileObj);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = BaseUrl + "api/ticket/bulk-upload";

      const response = await axios.post(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        setSuccessMessage("Submission successful!");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        DataTicket();
        handlebulkClose();
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };
  const handleMttpCreate = async (data) => {
    const formData = new FormData();

    if (data) {
      if (data.businessApprover) {
        formData.append("approverId", data.businessApprover);
      }

      if (data.poFile && data.poFile.length > 0) {
        data.poFile.forEach((file, index) => {
          formData.append(`poFile[${index}]`, file);
        });
      }

      if (data.mailAttachment && data.mailAttachment.length > 0) {
        data.mailAttachment.forEach((file, index) => {
          formData.append(`mailAttachment[${index}]`, file);
        });
      }
      if (data.carbonCopyMailIds && data.carbonCopyMailIds.length > 0) {
        data.carbonCopyMailIds.forEach((mailId, index) => {
          formData.append(`carbonCopyMailIds[${index}]`, mailId);
        });
      }
      if (data.roiDescription) {
        formData.append("roiDescription", data.roiDescription);
      }
    }

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = BaseUrl + "mttp-ticket";

      const response = await axios.post(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        setSuccessMessage("Submission successful!");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        fetchMttpData();
        handlefileClose();
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleMttpUpdate = async (data) => {
    const formData = new FormData();

    if (data) {
      if (data.businessApprover) {
        formData.append("approverId", data.businessApprover);
      }

      if (data.poFile && data.poFile.length > 0) {
        data.poFile.forEach((file, index) => {
          formData.append(`poFile[${index}]`, file);
        });
      }

      if (data.mailAttachment && data.mailAttachment.length > 0) {
        data.mailAttachment.forEach((file, index) => {
          formData.append(`mailAttachment[${index}]`, file);
        });
      }

      if (data.removedPoFiles && data.removedPoFiles.length > 0) {
        data.removedPoFiles.forEach((fileName, index) => {
          formData.append(`deletedPoFile[${index}]`, fileName);
        });
      }

      if (data.removedMailFiles && data.removedMailFiles.length > 0) {
        data.removedMailFiles.forEach((fileName, index) => {
          formData.append(`deletedmailAttachment[${index}]`, fileName);
        });
      }
      if (data.carbonCopyMailIds && data.carbonCopyMailIds.length > 0) {
        data.carbonCopyMailIds.forEach((mailId, index) => {
          formData.append(`carbonCopyMailIds[${index}]`, mailId);
        });
      }
      if (data.roiDescription) {
        formData.append("roiDescription", data.roiDescription);
      }
    }

    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = `${BaseUrl}mttp-ticket/${selectedMttpData.id}`;

      const response = await axios.put(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        setSuccessMessage("Update successful!");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        fetchMttpData();
        handlefileClose();
        fetchMttpDraftData();
        fetchMttpCompletedData();
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const handleMttpDraft = async (data) => {
    const formData = new FormData();
    if (data) {
      if (data.businessApprover) {
        formData.append("approverId", data.businessApprover);
      }
      if (data.poFile && data.poFile.length > 0) {
        data.poFile.forEach((file, index) => {
          formData.append(`poFile[${index}]`, file);
        });
      }
      if (data.mailAttachment && data.mailAttachment.length > 0) {
        data.mailAttachment.forEach((file, index) => {
          formData.append(`mailAttachment[${index}]`, file);
        });
      }
      if (data.carbonCopyMailIds && data.carbonCopyMailIds.length > 0) {
        data.carbonCopyMailIds.forEach((mailId, index) => {
          formData.append(`carbonCopyMailIds[${index}]`, mailId);
        });
      }
      if (data.roiDescription) {
        formData.append("roiDescription", data.roiDescription);
      }
    }
    formData.append("status", "Draft");
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = BaseUrl + "mttp-ticket/draft";

      const response = await axios.post(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 200) {
        setSuccessMessage("Draft saved successfully!");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        fetchMttpData();
        handlefileClose();
        fetchMttpDraftData();
      }
    } catch (error) {
      console.error("Draft error:", error);
    }
  };

  const DataTicket = async () => {
    try {
      const apiUrl =
        BaseUrl +
        `api/ticket/getAllByCommonStage/${role}?ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
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
    if (isDataChanged) {
      DataTicket();
    }
  }, [isDataChanged]);
  const title_ticket_table = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          <pre>
            {index + 1 + pagination.pageSize * (pagination.current - 1)}
          </pre>
        </React.Fragment>
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
      title: "Action inbox",
      dataIndex: "id",
      width: 100,
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
                // setMode("view");
                setTicketId(record.id);
                setMode("editticket");
                setIsView(true);
                Viewticketfunction(record.id);
                setTabData("Completed");
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
          <Tooltip title="Delete">
            <a
              onClick={() => {
                setTicketId(record.id);
                setModalVisible(true);
              }}
              className="eyee"
            >
              <HiOutlineTrash />
            </a>
          </Tooltip>
        </React.Fragment>
      ),
    },
  ];
  const mttptable = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          <pre>
            {index + 1 + pagination.pageSize * (pagination.current - 1)}
          </pre>
        </React.Fragment>
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
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
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
                setticket_history_data(record?.historyList || []);
              }}
              className="eyee"
            >
              <BiMessageDots />
            </a>
          </Tooltip>
        </React.Fragment>
      ),
    },
  ];
  const mttpdrafttable = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          <pre>
            {index + 1 + pagination.pageSize * (pagination.current - 1)}
          </pre>
        </React.Fragment>
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
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
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
                setticket_history_data(record?.historyList || []);
              }}
              className="eyee"
            >
              <BiMessageDots />
            </a>
          </Tooltip>
        </React.Fragment>
      ),
    },
  ];
  const mttpCompletedtable = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          <pre>
            {index + 1 + pagination.pageSize * (pagination.current - 1)}
          </pre>
        </React.Fragment>
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
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
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
                setticket_history_data(record?.historyList || []);
              }}
              className="eyee"
            >
              <BiMessageDots />
            </a>
          </Tooltip>
        </React.Fragment>
      ),
    },
  ];
  //tab(draft)
  const [getdraftTicket, setgetdraftTicket] = useState([]);
  const [mttpData, setMttpData] = useState([]);
  const [mttpDraftData, setMttpDraftData] = useState([]);
  const [mttpCompletedData, setMttpCompletedData] = useState([]);
  const [deletedTickets, setDeletedTickets] = useState([]);

  const DraftTicket = async () => {
    try {
      const apiUrl =
        BaseUrl +
        `api/ticket/get-draft?ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
          ? "Brand"
          : "NonBrand"
        }`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setgetdraftTicket(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    DraftTicket();
    fetchMttpData();
    fetchMttpDraftData();
    fetchMttpCompletedData();
    fetchDeletedTickets();
 
  }, [isDataChanged]);

   const fetchDeletedTickets = async () => {
    try {
      const apiUrl = BaseUrl + "api/ticket/deleted-tickets";
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setDeletedTickets(response.data);
    } catch (error) {
      console.error("Error fetching deleted tickets:", error);
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
      if (response.data.status) {
        setMttpData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching MTTP data:", error);
    }
  };

  const fetchMttpDraftData = async () => {
    try {
      const apiUrl = `${BaseUrl}mttp-ticket/all-draft`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.data.status) {
        setMttpDraftData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching MTTP data:", error);
    }
  };

  const fetchMttpCompletedData = async () => {
    try {
      const apiUrl = `${BaseUrl}mttp-ticket/completed`;
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
  const title_draftticket_table = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          <pre>
            {index + 1 + pagination.pageSize * (pagination.current - 1)}
          </pre>
        </React.Fragment>
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
    {
      title: "Status",
      dataIndex: "stage",
      render: (stage, _, index) => {
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
              color: "#faad14",
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
            <MdAccessTime size={14} />
            {formatStatus(stage)}
          </span>
        );
      },
    },

    {
      title: "Action draft",
      dataIndex: "id",
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
                // handleviewShow();
                setMode("editticket");
                setIsView(true);
                Viewticketfunction(record.id);
                setTicketId(record.id);
                showModal();
              }}
              className="eye"
            >
              <LuEye />
            </a>
          </Tooltip>
        </React.Fragment>
      ),
    },
  ];
  //tab(completed)
  const [gettrackerrTicket, setgettrackerrTicket] = useState([]);
  const [getCompletedTicket, setGetCompletedTicket] = useState([]);
  const [fundCenterSap, setFundCentersap] = useState("");

  const handleCommitmentItemChange = (index) => {
    if (formData.brand && formData.brand[index]) {
      setCommitmentItem(formData.brand[index].commitmentItem);
    }
  };

  useEffect(() => {
    handleCommitmentItemChange(0);
  }, []);

  const TrackerrTicket = async () => {
    try {
      const apiUrl =
        BaseUrl +
        `api/ticket/getAllComplticketsByStage/${role}?ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
          ? "Brand"
          : "NonBrand"
        }`;
      // const requestData = {
      //     stagename: '',
      // };
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        // params: requestData,
      });
      const ticketData = Array.isArray(response.data)
        ? response.data
        : response.data.tickets || [];

      const filteredTickets = ticketData.filter(
        (ticket) => ticket.stage !== "Completed"
      );
      setgettrackerrTicket(filteredTickets);

      const completedTickets = ticketData.filter(
        (ticket) => ticket.stage === "Completed"
      );
      setGetCompletedTicket(completedTickets);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    TrackerrTicket();
  }, [isDataChanged]);

  useEffect(() => {
    const selectedTab = localStorage.getItem("selectedTicketTab");
    if (selectedTab === "Brand" || selectedTab === "Non Brand") {
      DataTicket();
      DraftTicket();
      TrackerrTicket();
    }
    fetchMttpData();
    fetchMttpDraftData();
    fetchMttpCompletedData();
    fetchDeletedTickets();
  }, []);
  const title_trackerticket_table = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          <pre>
            {index + 1 + pagination.pageSize * (pagination.current - 1)}
          </pre>
        </React.Fragment>
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
        return (
          <span 
            key={`status-${index}`} 
            style={{
              backgroundColor: "transparent",
              color: isCompleted ? "#52c41a" : "#faad14",
              padding: "0",
              borderRadius: "0",
              fontSize: "12px",
              fontWeight: "500",
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
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <div className="action__icons__businessapprover">
            <Tooltip title="View Details">
              <a
                onClick={() => {
                  // handleviewShow();
                  showModal();
                  setIsView(true);
                  Viewticketfunction(record.id);
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
        </React.Fragment>
      ),
    },
  ];

  const title_deleted_table = title_ticket_table.filter(
    (col) => col.title !== "Status" && col.title !== "Action inbox"
  ).concat([
    {
      title: "Action",
      dataIndex: "id",
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
                setTicketId(record.id);
                setMode("editticket");
                setIsView(true);
                Viewticketfunction(record.id);
                setTabData("Completed");
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
          <Tooltip title="Revert">
            <a
              onClick={() => handleRevertTicket(record.id)}
              className="eyee"
            >
              <MdRestore />
            </a>
          </Tooltip>
        </React.Fragment>
      ),
    },
  ]);
 

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("selectedStatusTab") || "first";
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [stsmodal, setstsModal] = useState(false);
  const handlestsClose = () => setstsModal(false);
  const handlestsShow = () => setstsModal(true);
  const [ticket_history_data, setticket_history_data] = useState([]);
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
  const [date, setDate] = useState(new Date());

  const formatActiveDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const formatDate = (inputDate) => {
    const formattedDate = dayjs(inputDate)
      .tz("Asia/Kolkata")
      .format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
    return formattedDate;
  };
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [editmodal, seteditModal] = useState(false);

  const handleeditClose = () => {
    seteditModal(false);
    setFormErrors3({});
    setSelectedOption("");
    setFormData((prevFormData) => {
      const updatedFormData = { ...prevFormData };
      updatedFormData.brand?.forEach((item) => {
        item.brandOrNonBrand = "";
        item.division = "";
      });
      return updatedFormData;
    });
  };
  const handleeditRefresh = () => {
    setSapValue("");
    setNewSapvalue("");
    setFormData({
      vendor_name: "",
      vendor_location: "",
      CKPL_Location: "",
      vendor_code: "",
      GST_No: "",
      Currency: "",
      GST_Type: "",
      payment: "",
      PO_type: "",
      total_base_value: "",
      poCopyAttachment: "",
      attachment: "",
      vendorMailId: "",
      brand: [
        {
          brandOrNonBrand: "",
          department: "",
          departmentOptions: [],
          division: "",
          divisionOptions: [],
          location: "",
          locationOptions: [],
          fundCentre: "",
          glCode: "",
          fundcenterOptions: [],
          ioOrCostCentrePo: "",
          brandOptions: [],
          natureOfExpensesOptions: "",
          glDescription: "",
          natureOfExpenses: "",
          value: "",
          commitmentItem: "",
          detailsBrand: "",
          activityStartDate: "",
          activityEndDate: "",
          month: "",
          year: "",
        },
      ],
    });
  };

  const handleeditShow = () => {
    seteditModal(true);
  };
  const handleeditSubmit = () => seteditModal(true);
  const [clickCount, setClickCount] = useState(1);
  const [brandOptions, setBrandOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [channelOptions, setChannelOptions] = useState([]);
  const [fundCenterOptions, setFundCenterOptions] = useState([]);
  const [costcenterOptions, setcostCenterOptions] = useState([]);
  const [internalorderOptions, setinternalorderOptions] = useState([]);
  const [indexfixing, setIndexfixing] = useState("");
  const [sapValue, setSapValue] = useState("");
  const [commitmentItem, setCommitmentItem] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [period, setPeriod] = useState("");
  const [brandDataLength, setBrandDataLength] = useState(0); // Initialize with 0 or any default value
  const [brandDataArray, setBrandDataArray] = useState([]);
  const [draftData, setDraftData] = useState({}); // Initialize with 0 or any default value

  const [inputValues, setInputValues] = useState(Array(1).fill(""));
  const toggleDiv = () => {
    setInputValues((prevValues) => [
      ...prevValues,
      `Item ${prevValues.length + 1}`,
    ]);
  };
  const handleRemoveClick = (index) => {
    setFormData((prevData) => {
      const updatedBrand = [...prevData.brand];
      updatedBrand.splice(index, 1);

      // Recalculate the total base value after removal
      const totalBaseValue = updatedBrand.reduce(
        (sum, item) => sum + item.value,
        0
      );

      return {
        ...prevData,
        brand: updatedBrand,
        totalBaseValue,
      };
    });

    setInputValues((prevValues) => {
      const newInputValues = [...prevValues];
      newInputValues.splice(index, 1);
      return newInputValues;
    });
  };
  const handleRemoveClickk = () => {
    setClickCount(1);
    setInputValues(inputValues.length > 0 ? [inputValues[0]] : []);
    setNewSapvalue("");
  };

  const toggleDivDrf = () => {
    setTicketDataUpdate((prevState) => ({
      ...prevState,
      brand: [
        ...prevState.brand,
        { brandOrNonBrand: prevState.brandOrNonBrand },
      ],
    }));
  };

  const handleDrfRemoveClick = (index) => {
    // setTicketDataUpdate((prevState) => ({
    //   ...prevState,
    //   brand: prevState.brand.filter((_, i) => i !== index),
    // }));
    setTicketDataUpdate((prevData) => {
      const updatedBrand = [...prevData.brand];
      updatedBrand.splice(index, 1);

      // Recalculate the total base value after removal
      const totalBaseValue = updatedBrand.reduce(
        (sum, item) => sum + item.value,
        0
      );

      return {
        ...prevData,
        brand: updatedBrand,
        totalBaseValue,
      };
    });
  };

  const [bulk_upload_modal, setbulkModal] = useState(false);
  const [fileupload, setfileModal] = useState(false);
  const [selectedMttpData, setSelectedMttpData] = useState(null);
  const handlebulkClose = () => setbulkModal(false);
  const handlebulkShow = () => setbulkModal(true);
  const handlefileClose = () => {
    setfileModal(false);
    setSelectedMttpData(null);
  };
  const handlefileShow = () => setfileModal(true);
  const [viewmodal, setviewModal] = useState(false);
  const handleviewClose = () => {
    setviewModal(false);
    setIsEditMode(false);
  };
  const handleviewShow = () => setviewModal(true);
  const [ticketdataedit, setticketdataedit] = useState({});
  const [ticket_brand_dataedit, setticket_brand_dataedit] = useState([]);
  const [initialFormData, setInitialFormData] = useState([]);

  const Viewticketfunction = async (id) => {
    try {
      const apiUrl = BaseUrl + "api/ticket/getTicketById/" + id;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const record = await response.json();
      seteditId(id);
      setCheckRes(record?.data?.budgetDetails);
      setCheckAvailable(record?.data?.reason);
      if (record?.data?.isRelated !== null) {
        setIsRelatedCheck(record?.data?.isRelated ? "YES" : "NO");
      }

      setInitialFormData({
        ...record.data,
      });
      setDraftData(record.data);
      setFormData({
        ...record.data,
      });
      setticketdataedit({
        ...record.data,
      });

      setticket_brand_dataedit({
        ...record.data.brand,
      });

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
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  // --check

  // --check
  const [formData, setFormData] = useState({});
  const formFieldNames = [
    "vendor_name",
    "vendor_location",
    "CKPL_Location",
    "vendor_code",
    "GST_No",
    "Currency",
    "GST_Type",
    "payment",
    "PO_type",
    "total_base_value",
    "poCopyAttachment",
    "attachment",
    "vendorMailId",
  ];

  //setform

  const [formErrors3, setFormErrors3] = useState({
    vendorName: "",
    vendorLocation: "",
    ckplLocation: "",
    businessApprover: "",
    vendorCode: "",
    gstNo: "",
    currency: "",
    gstType: "",
    paymentTerm: "",
    poType: "",
    totalBaseValue: "",
    poCopyAttachment: "",
    attachment: [],
    vendorMailId: "",
    brand: [
      {
        brandOrNonBrand: "",
        department: "",
        departmentOptions: [],
        division: "",
        divisionOptions: [],
        location: "",
        locationOptions: [],
        fundCentre: "",
        glCode: "",
        fundcenterOptions: [],
        ioOrCostCentrePo: "",
        brandOptions: [],
        natureOfExpensesOptions: "",
        glDescription: "",
        natureOfExpenses: "",
        value: "",
        commitmentItem: "",
        detailsBrand: "",
        activityStartDate: "",
        activityEndDate: "",
        month: "",
        year: "",
      },
    ],
    CKPL_Location: "",
  });
  const [formErrorsDraft, setFormErrorsDraft] = useState({
    brandOrNonBrand: "",
  });
  const [touchedFields, setTouchedFields] = useState({});

  const [ticketDataUpdate, setTicketDataUpdate] = useState({
    vendorName: "",
    vendorLocation: "",
    ckplLocation: "",
    vendorCode: "",
    gstNo: "",
    currency: "",
    gstType: "",
    payment: "",
    poType: "",
    totalBaseValue: 0,
    poCopyAttachment: "",
    attachment: [],
    vendorMailId: "",
    businessApprover: "",
    brand: [
      {
        brandOrNonBrand: "",
        department: "",
        division: "",
        channel: "",
        location: "",
        region: "",
        fundCentre: "",
        ioOrCostCentrePo: "",
        glDescription: "",
        natureOfExpenses: "",
        glCode: "",
        commitmentItem: "",
        value: 0,
        poDescription: "",
        detailsBrand: "",
        activityStartDate: "",
        activityEndDate: "",
        month: "",
        year: "",
      },
    ],
    deletedAttachments: [],
  });

  const EditTicket = async (id) => {
    try {
      const apiUrl = BaseUrl + "api/ticket/getTicketById/" + id;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const record = await response.json();
      setTicketDataUpdate({
        ...record.data,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;

    setTouchedFields({
      ...touchedFields,
      [name]: true,
    });
  };

  const [successMessage, setSuccessMessage] = useState(null);
  const [initialActivityStartDate, setInitialActivityStartDate] = useState("");
  const [initialActivityEndDate, setInitialActivityEndDate] = useState("");

  // Update date fields when formData changes
  useEffect(() => {
    if (isEditMode && formData.activityStartDate) {
      setInitialActivityStartDate(formData.activityStartDate);
    }
    if (isEditMode && formData.activityEndDate) {
      setInitialActivityEndDate(formData.activityEndDate);
    }
  }, [formData.activityStartDate, formData.activityEndDate, isEditMode]);

  // Date formatting function
  const formatDate1 = (date) => {
    if (!date) return "";
    const formattedDate = new Date(date).toISOString().split("T")[0];
    return formattedDate;
  };

  // Get the display value for date fields

  const [errorPopupMessage, setErrorPopupMessage] = useState(null);
  useEffect(() => {
    if (formData.vendorName?.trim()) {
      setFormErrors3((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors.vendorName;
        return updatedErrors;
      });
    }
  }, [formData.vendorName]);

  const handleFormDraft = async (formData) => {
    setIsSubmit(true);
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = BaseUrl + `api/ticket/create-ticket-draft?type=${localStorage.getItem("selectedTicketTab") === "Brand" ? "Brand" : "NonBrand"}`;
      const formDataToSend = new FormData();

      for (const key in formData) {
        if (key === "vendorMailId" || key === "carbonCopy") continue;

        if (Array.isArray(formData[key])) {
          formData[key].forEach((item, index) => {
            if (key === "preApprovedFiles") {
              formDataToSend.append(`preApprovedFiles[${index}]`, item);
              return;
            }
            if (key === "attachment") {
              formDataToSend.append("attachment", item);
            } else if (typeof item === "object" && item !== null) {
              // Special handling for brand array to ensure detailsBrand is set
              if (key === "brand") {
                // If detailsBrand is missing but brand exists, use brand value for detailsBrand
                if (
                  (!item.detailsBrand || item.detailsBrand === "") &&
                  item.brand
                ) {
                  item.detailsBrand = item.brand;
                }
              }

              for (const field in item) {
                if (
                  item[field] !== undefined &&
                  item[field] !== "" &&
                  item[field] !== null &&
                  !field.endsWith("Options")
                ) {
                  formDataToSend.append(
                    `${key}[${index}].${field}`,
                    item[field]
                  );
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

      if (formData.carbonCopy && Array.isArray(formData.carbonCopy)) {
        formData.carbonCopy.forEach((id, index) => {
          formDataToSend.append(`copyMailIds[${index}]`, id);
        });
      }

      // Handle `vendorMailId` logic separately
      if (formData.customMailId && formData.customMailId !== "") {
        formDataToSend.append("vendorMailId", formData.customMailId);
      } else if (
        formData.vendorMailId &&
        formData.vendorMailId !== "" &&
        formData.vendorMailId !== "undefined"
      ) {
        if (formData.vendorMailId.includes(",")) {
          const vendorMailIds = formData.vendorMailId.split(",");
          if (vendorMailIds.includes(formData.mailId)) {
            formDataToSend.append("vendorMailId", formData.mailId);
          } else {
            formDataToSend.append("vendorMailId", vendorMailIds[0]);
          }
        } else {
          formDataToSend.append("vendorMailId", formData.vendorMailId);
        }
      }

      formDataToSend.append("status", "Draft");

      const response = await axios.post(apiUrl, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMode("");
      DraftTicket();
      handleCancel();
      setIsView(false);
      setSuccessMessage("Draft Submitted successfully");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
      DataTicket();
      handleeditRefresh();
      seteditModal(false);
      setIsDataChanged(true);
    } catch (error) {
      console.error("Error sending data to backend:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.validationErrors
      ) {
        const validationErrors = error.response.data.validationErrors;
        setFormErrorsDraft(validationErrors);
      } else {
        console.error("Unknown error:", error);
      }
    } finally {
      setIsSubmit(false);
    }
  };

  const [dataWithRowNumbers, setDataWithRowNumbers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: false,
    showQuickJumper: false,
  });

  useEffect(() => {
    const updateRowNumbers = () => {
      if (getTicket && Array.isArray(getTicket)) {
        const newData = getTicket.map((record, index) => ({
          ...record,
        }));
        setDataWithRowNumbers(newData);
      }
    };
    updateRowNumbers();
  }, [getTicket, pagination.pageSize]);

  useEffect(() => {
    if (formData.brand && formData.brand.length > 0) {
      setIndexfixing(formData.brand[0].brandOrNonBrand);
    }
  }, [formData.brand]);

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleTabSelect = (tab) => {
    setSearchQuery("");
    setActiveTab(tab);
    setSearchis(false);
    setPagination((prevPagination) => ({
      ...prevPagination,
      current: 1,
    }));
  };

   const handleDeleteTicket = async () => {
    try {
      const response = await axios.delete(
        `${BaseUrl}api/ticket/delete-ticket/${ticketId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          params: {
            status: "delete",
          },
        }
      );
      if (response.status === 200) {
        setSuccessMessage("Ticket deleted successfully");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        DataTicket();
        TrackerrTicket();
        fetchDeletedTickets();
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
    } finally {
      setModalVisible(false);
      setTicketId("");
    }
  };
 
  const handleRevertTicket = async (id) => {
    try {
      const response = await axios.delete(
        `${BaseUrl}api/ticket/delete-ticket/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          params: {
            status: "Revert",
          },
        }
      );
      if (response.status === 200) {
        setSuccessMessage("Ticket reverted successfully");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        DataTicket();
        TrackerrTicket();
        fetchDeletedTickets();
      }
    } catch (error) {
      console.error("Error reverting ticket:", error);
    }
  };
 
  // Handle deletion of the attachment
  const handleDeleteAttachment = async () => {
    try {
      const response = await axios.delete(
        `${BaseUrl}api/ticket/delete-attachments/${ticketId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          params: {
            attachmentNames: attachmentToDelete,
          },
        }
      );

      if (response.status === 200) {
        EditTicket(ticketId);
      } else {
        console.error("Failed to delete attachment:", response.status);
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
    } finally {
      handleCancel();
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isView, setIsView] = useState(false);
  const [mode, setMode] = useState("");

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async (formData) => {
    setIsSubmit(true);
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = BaseUrl + `api/ticket/create-ticket?type=${localStorage.getItem("selectedTicketTab") === "Brand" ? "Brand" : "NonBrand"}`;

      const formDataToSend = new FormData();

      for (const key in formData) {
        if (key === "approvalType") {
          const value = formData.approvalType === "Pre-Approved" ? true : false;
          formDataToSend.append("approvalType", value);
          continue;
        }
        if (
          key === "vendorMailId" ||
          key === "fundcenter" ||
          key === "carbonCopy"
        ) {
          continue;
        }

        if (Array.isArray(formData[key])) {
          formData[key].forEach((item, index) => {
            if (key === "attachment") {
              formDataToSend.append("attachment", item);
              return;
            }
            if (key === "preApprovedFiles") {
              formDataToSend.append(`preApprovedFiles[${index}]`, item);
              return;
            }
            if (typeof item === "object" && item !== null) {
              if (key === "brand") {
                if (
                  (!item.detailsBrand || item.detailsBrand === "") &&
                  item.brand
                ) {
                  item.detailsBrand = item.brand;
                }
              }

              for (const field in item) {
                if (
                  item[field] !== undefined &&
                  item[field] !== "" &&
                  item[field] !== null &&
                  !field.endsWith("Options")
                ) {
                  formDataToSend.append(
                    `${key}[${index}].${field}`,
                    item[field]
                  );
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
      if (formData.carbonCopy && Array.isArray(formData.carbonCopy)) {
        formData.carbonCopy.forEach((id, index) => {
          formDataToSend.append(`copyMailIds[${index}]`, id);
        });
      }
      if (formData.fundCentre) {
        formDataToSend.append("fundcenter", formData.fundCentre);
      }

      if (formData.customMailId !== "") {
        formDataToSend.append("vendorMailId", formData.customMailId);
      } else {
        if (
          formData.mailId !== "" &&
          formData.vendorMailId.includes(formData.mailId)
        ) {
          formDataToSend.append("vendorMailId", formData.mailId);
        } else {
          formDataToSend.append("vendorMailId", formData.vendorMailId);
        }
      }
      formDataToSend.append("status", "Approved");
      const response = await axios.post(apiUrl, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setSuccessMessage("Ticket created successfully");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        setMode(" ");
        const notificationIdToDelete = notifications.find(
          (notif) => notif.id === editid
        );
        handleClearNotification(notificationIdToDelete);
        TrackerrTicket();
        handleCancel();
      }
    } catch (error) {
      const errorMessage = error?.response?.data;
      if (
        errorMessage ===
        "The total base value exceeds the available SAP budget."
      ) {
        setErrorPopupMessage(errorMessage);
      } else if (
        errorMessage?.message ===
        "Your budget limit is 1-50,000. Please enter budget below your limit"
      ) {
        setErrorPopupMessage(errorMessage.message);
      } else if (
        errorMessage?.message ===
        "Selected Business Approver not eligible for your total Base value"
      ) {
        setErrorPopupMessage(errorMessage.message);
      }
      console.error("Error creating ticket:", error);
      throw error;
    } finally {
      setIsSubmit(false);
    }
  };
  const handleUpdate = async (newFormData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = BaseUrl + "api/ticket/update-ticket?ticketId=" + ticketId;

      const mergedFormData = Object.assign({}, initialFormData, newFormData);
      if (mergedFormData.brand) {
        mergedFormData.brand.forEach((item) => {
          if (item.activityStartDate)
            item.activityStartDate = item.activityStartDate.split("T")[0];
          if (item.activityEndDate)
            item.activityEndDate = item.activityEndDate.split("T")[0];
        });
      }

      if (
        Array.isArray(mergedFormData.carbonCopy) &&
        mergedFormData.carbonCopy.length > 0
      ) {
        mergedFormData.copyMailIds = mergedFormData.carbonCopy.map((user) =>
          typeof user === "object" && user !== null ? user.id : user
        );
      } else if (
        !mergedFormData.carbonCopy ||
        mergedFormData.carbonCopy.length === 0
      ) {
        mergedFormData.copyMailIds = (mergedFormData.copyMailIds || []).map(
          (user) => (typeof user === "object" && user !== null ? user.id : user)
        );
      }
      delete mergedFormData.carbonCopy;
      const formDataToSend = new FormData();

      for (const key in mergedFormData) {
        if (key === "approvalType") {
          const value =
            mergedFormData.approvalType === "Pre-Approved" ||
              mergedFormData.approvalType === true
              ? true
              : false;
          formDataToSend.append("approvalType", value);
          continue;
        }
        if (key === "vendorMailId" || key === "carbonCopy") {
          continue;
        }

        if (Array.isArray(mergedFormData[key])) {
          mergedFormData[key].forEach((item, index) => {
            if (key === "preApprovedFiles") {
              if (item instanceof File) {
                formDataToSend.append(`preApprovedFiles[${index}]`, item);
              }
              return;
            }
            if (key === "deletedPreApprovedFiles") {
              formDataToSend.append(`deletedPreApprovedFiles[${index}]`, item);
              return;
            }
            if (key === "attachment") {
              formDataToSend.append("attachment", item);
            } else if (key === "attachmentsPath") {
              formDataToSend.append("attachmentsPath", item);
            } else if (key === "copyMailIds") {
              formDataToSend.append(`${key}[${index}]`, item);
            } else if (typeof item === "object" && item !== null) {
              if (key === "brand") {
                if (
                  (!item.detailsBrand || item.detailsBrand === "") &&
                  item.brand
                ) {
                  item.detailsBrand = item.brand;
                }
              }

              for (const field in item) {
                if (
                  item[field] !== undefined &&
                  item[field] !== "" &&
                  item[field] !== null &&
                  !field.endsWith("Options")
                ) {
                  formDataToSend.append(
                    `${key}[${index}].${field}`,
                    item[field]
                  );
                }
              }
            }
          });
        } else if (
          mergedFormData[key] !== undefined &&
          mergedFormData[key] !== "" &&
          mergedFormData[key] !== null &&
          !key.endsWith("Options")
        ) {
          formDataToSend.append(key, mergedFormData[key]);
        }
      }
      if (mergedFormData.customMailId && mergedFormData.customMailId !== "") {
        formDataToSend.append("vendorMailId", mergedFormData.customMailId);
      } else {
        if (
          mergedFormData.mailId &&
          mergedFormData.mailId !== "" &&
          mergedFormData.vendorMailId &&
          mergedFormData.vendorMailId.includes(mergedFormData.mailId)
        ) {
          formDataToSend.append("vendorMailId", mergedFormData.mailId);
        } else {
          formDataToSend.append(
            "vendorMailId",
            mergedFormData.vendorMailId || ""
          );
        }
      }
      formDataToSend.append("status", "Approved");
      const response = await axios.put(apiUrl, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setSuccessMessage("Ticket Updated successfully");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 1000);
        const notificationIdToDelete = notifications.find(
          (notif) => notif.id === editid
        );
        handleClearNotification(notificationIdToDelete);
        setMode(" ");
        DraftTicket();
        TrackerrTicket();
        handleCancel();
      }
    } catch (error) {
      const errorMessage = error?.response?.data;
      if (
        errorMessage ===
        "The total base value exceeds the available SAP budget."
      ) {
        setErrorPopupMessage(errorMessage);
      } else if (
        errorMessage?.message ===
        "Your budget limit is 1-50,000. Please enter budget below your limit"
      ) {
        setErrorPopupMessage(errorMessage.message);
      } else if (
        errorMessage?.message ===
        "Selected Business Approver not eligible for your total Base value"
      ) {
        setErrorPopupMessage(errorMessage.message);
      }
      console.error("Error creating ticket:", error);
      throw error;
    }
  };
  const handleCancel = () => {
    setMode("");
    setIsView(false);
    setIsModalOpen(false);
    setFormData({});
    setBrandDataLength(0);
    setTabData("");
    setIsSubmit(false);
    setIsRelatedCheck("");
  };

  //Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchis, setSearchis] = useState(false);
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchQuery(searchValue);
  };
  // Completed tab
  const [filteredData, setFilteredData] = useState([]);
  useEffect(() => {
    setFilteredData(applySearch(getCompletedTicket, searchQuery));
  }, [getCompletedTicket, searchQuery]);

  //Inbox tab
  const [filteredDatainbox, setFilteredDatainbox] = useState([]);
  useEffect(() => {
    setFilteredDatainbox(applySearch(gettrackerrTicket, searchQuery));
  }, [gettrackerrTicket, searchQuery]);

  // Draft tab
  const [filteredDataDraft, setFilteredDataDraft] = useState([]);
  useEffect(() => {
    setFilteredDataDraft(applySearch(getdraftTicket, searchQuery));
  }, [getdraftTicket, searchQuery]);

  const [filteredDeletedData, setFilteredDeletedData] = useState([]);
  useEffect(() => {
    setFilteredDeletedData(applySearch(deletedTickets, searchQuery));
  }, [deletedTickets, searchQuery]);

  // MTTP tab
  const [filteredMttpData, setFilteredMttpData] = useState([]);
  const [filteredDraftMttpData, setFilteredDraftMttpData] = useState([]);
  const [filteredCompleted, setFilteredCompleted] = useState([]);

  useEffect(() => {
    const filtered = mttpData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMttpData(filtered);
  }, [mttpData, searchQuery]);

  useEffect(() => {
    fetchMttpData();
  }, []);

  // MttpDraft
  useEffect(() => {
    const filtered = mttpDraftData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDraftMttpData(filtered);
  }, [mttpDraftData, searchQuery]);

  useEffect(() => {
    fetchMttpDraftData();
  }, []);

  // MttpCompleted
  useEffect(() => {
    const filtered = mttpCompletedData.filter(
      (item) =>
        item.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reqName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCompleted(filtered);
  }, [mttpCompletedData, searchQuery]);

  useEffect(() => {
    fetchMttpCompletedData();
  }, []);

  //Notification
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem("notifications");
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  const [unreadCount, setUnreadCount] = useState(() => {
    const savedCount = localStorage.getItem("unreadCount");
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  const isFetching = useRef(false);
  // Refetch ticket data when `isDataChanged` changes
  useEffect(() => {
    if (isDataChanged) {
      DataTicket();
    }
    fetchNotifications();
  }, [isDataChanged]);
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

  useEffect(() => {
    // Clear all notifications from localStorage on page load or refresh
    localStorage.removeItem("notifications");
    localStorage.removeItem("unreadCount");
    // Optional: If you need to reset the state on refresh (to avoid issues when reloading)
    setNotifications([]);
    setUnreadCount(0);
    // You can return a cleanup function here if needed for WebSocket or other resources
    return () => {
      // Cleanup code if necessary (e.g., WebSocket close)
    };
  }, []);

  //web socket
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
    localStorage.setItem("unreadCount", unreadCount.toString());
  }, [notifications, unreadCount]);
  useEffect(() => {
    const socket = new SockJS(BaseUrl + "ws"); // Backend WebSocket endpoint
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        const id = localStorage.getItem("id");
        // Subscribe to topic for updates
        stompClient.subscribe("/topic/Requestor", (message) => {
          const newTicket = JSON.parse(message.body);
          if (newTicket.createdBy === id) {
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
            ...prevNotifications, // Add new notifications at the top
          ];
          return updatedNotifications;
        });
        // Calculate the unread count (increment by 1 for each unread notification)
        const unreadNotificationsCount = newNotifications.filter(
          (notif) => !notif.read // Only consider notifications where 'read' is false
        ).length;
        setUnreadCount((prevCount) => prevCount + unreadNotificationsCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      isFetching.current = false; // Reset fetching status
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
      // Update notifications by removing the deleted notification
      const updatedNotifications = notifications.filter(
        (notif) => notif.id !== notification.id
      );

      // Count the unread notifications (those where notif.read is false)
      const unreadCount = updatedNotifications.filter(
        (notif) => !notif.readtext
      ).length;

      // Update the state and local storage
      setNotifications(updatedNotifications);
      setUnreadCount(unreadCount);
      localStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

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
    setIsView(true);
    setTicketId(notification.id);
    setMode("editticket");
    Viewticketfunction(notification.id);
  };

  return (
    <div style={globalBoldStyle}>
      {successMessage && (
        <div className="success-message-container">
          <div className="success-message">{successMessage}</div>
        </div>
      )}
      <div className="container-fluid main-content">
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Box className={"txt_title"}>
              Request History
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
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            {name?.replace(/\s+/g, "").toLowerCase() === "meganathanm" && (
              <input
                className={"req_btn"}
                type="button"
                onClick={handlefileShow}
                value={"Create MTTP"}
              />
            )}
            <input
              className={"req_btn"}
              type="button"
              onClick={showModal}
              value={"Create Request"}
            />
          </Box>
        </Box>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ flex: 1 }}>
            {name?.replace(/\s+/g, "").toLowerCase() === "meganathanm" ? (
              <CollapsibleTabHeader
                onTabSelect={handleTabSelect}
                activeTab={activeTab}
                tabKeys={["first", "third", "fifth", "deleted", "sixth", "eighth", "tenth"]}
              />
            ) : (
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabSelect}
                className="mb-0"
              >
                <Tab eventKey="first" title="INBOX" />
                <Tab eventKey="third" title="DRAFT" />
                <Tab eventKey="fifth" title="COMPLETED" />
                <Tab eventKey="deleted" title="DELETED" />
              </Tabs>
            )}
          </div>
          <Box
            className="search_box"
            component="form"
            onSubmit={(e) => e.preventDefault()}
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
              placeholder="Search"
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
          <div className="container-fluid table_bg">
            <div className="table-responsive">
              <Table
                columns={
                  activeTab === "first"
                    ? title_ticket_table
                    : activeTab === "third"
                      ? title_draftticket_table
                      : activeTab === "fifth"
                        ? title_trackerticket_table
                        : activeTab === "sixth"
                          ? mttptable
                          : activeTab === "eighth"
                            ? mttpdrafttable
                            : activeTab === "tenth"
                              ? mttpCompletedtable
                              : activeTab === "deleted"
                                ? title_deleted_table
                                : []
                }
                dataSource={
                  activeTab === "first"
                    ? filteredDatainbox
                    : activeTab === "third"
                      ? filteredDataDraft
                      : activeTab === "fifth"
                        ? filteredData
                        : activeTab === "sixth"
                          ? filteredMttpData
                          : activeTab === "eighth"
                            ? filteredDraftMttpData
                            : activeTab === "tenth"
                              ? filteredCompleted
                              : activeTab === "deleted"
                                ? filteredDeletedData
                                : []
                }
                pagination={pagination}
                rowKey="id"
                loading={isLoading}
                onChange={handleTableChange}
                footer={(currentPageData) => (
                  <span>
                    Showing{" "}
                    {pagination.pageSize > currentPageData.length
                      ? currentPageData.length
                      : pagination.pageSize}{" "}
                    of{" "}
                    {activeTab === "first"
                      ? filteredDatainbox?.length || 0
                      : activeTab === "third"
                        ? filteredDataDraft?.length || 0
                        : activeTab === "fifth"
                          ? filteredData?.length || 0
                          : activeTab === "sixth"
                            ? filteredMttpData?.length || 0
                            : activeTab === "eighth"
                              ? filteredDraftMttpData?.length || 0
                              : activeTab === "tenth"
                                ? filteredCompleted?.length || 0
                                : activeTab === "deleted"
                                  ? filteredDeletedData?.length || 0
                                  : currentPageData.length}{" "}
                    Items.
                  </span>
                )}
              />
            </div>
          </div>
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
        <Modal size="m" show={bulk_upload_modal} onHide={handlebulkClose}>
          <Modal.Header closeButton className="modal-close-out d-block">
            <Modal.Title>Bulk Upload</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="vendor_details_part">
              <Row>
                <Col
                  xl={12}
                  lg={12}
                  md={12}
                  sm={12}
                  className="form_margin validation-error"
                >
                  <Form.Label className="txt_lable form-label">
                    Attachment
                  </Form.Label>
                  <Upload onChange={handleFileChange}>
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </Col>
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <div className="d-flex justify-content-between w-100">
              <a
                href="public/sop_sample_file.xlsx"
                className="decor_none btn_sub px-3"
                download
              >
                Sample File
              </a>
              <div className="d-flex">
                <Button
                  className="btn_cancel mx-2 px-3"
                  onClick={handlebulkClose}
                >
                  Cancel
                </Button>
                <Button className="btn_sub mx-2" onClick={handleUpload}>
                  Upload
                </Button>
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
      <FileUploadModal
        show={fileupload}
        onHide={handlefileClose}
        onUpload={handleMttpCreate}
        onUpdate={handleMttpUpdate}
        onDraft={handleMttpDraft}
        initialData={selectedMttpData}
      />
      <div>
        <Modal
          show={isModalVisible}
          onHide={() => setModalVisible(false)}
          centered
          size="sm"
        >
          <Modal.Body style={{ padding: "30px 24px", textAlign: "center", background: "#f5f3f1", borderRadius: 12 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #eb043c, #c40231)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 4px 15px rgba(235,4,60,0.3)",
              }}
            >
              <HiOutlineTrash style={{ color: "#fff", fontSize: 28 }} />
            </div>
            <h5 style={{ fontWeight: 700, marginBottom: 8, fontFamily: "Manrope-Bold, sans-serif", color: "#1e293b" }}>Delete Ticket?</h5>
            <p style={{ color: "#595959", fontSize: 13, marginBottom: 24, fontFamily: "Manrope-Regular, sans-serif" }}>
              This ticket will be moved to the Deleted tab. You can revert it later.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setModalVisible(false)}
                style={{
                  padding: "8px 28px",
                  borderRadius: 6,
                  border: "1px solid #d9d9d9",
                  background: "#fff",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "Manrope-Medium, sans-serif",
                  color: "#595959",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTicket}
                style={{
                  padding: "8px 28px",
                  borderRadius: 6,
                  border: "none",
                  background: "linear-gradient(135deg, #eb043c, #c40231)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "Manrope-Medium, sans-serif",
                  boxShadow: "0 2px 8px rgba(235,4,60,0.3)",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </Modal.Body>
          </Modal>
      </div>
      <CustomModal
        isModalOpen={isModalOpen}
        handleOk={handleOk}
        handleUpdate={handleUpdate}
        handleFormDraft={handleFormDraft}
        handleCancel={handleCancel}
        mode={mode}
        data={formData}
        isView={isView}
        brandDataLength={brandDataLength}
        brandDataArray={brandDataArray}
        checkAvailable={checkAvailable}
        checkRes={checkRes}
        poattach={poattach}
        isRelatedCheck={isRelatedCheck}
        draftData={draftData}
        tabData={tabData}
        isSubmit={isSubmit}
        isBrand={isBrand}
      />
      {errorPopupMessage && (
        <model className="popup-overlay">
          <div className="popup" style={{ position: "relative" }}>
            <IoCloseOutline
              className="close-icon"
              onClick={() => setErrorPopupMessage(null)}
            />
            <p>{errorPopupMessage}</p>
            <button
              className="popup-close"
              onClick={() => setErrorPopupMessage(null)}
            >
              Close
            </button>
          </div>
        </model>
      )}
    </div>
  );
};
export default Request;
