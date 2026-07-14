import { Button, Table, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { BiMessageDots } from "react-icons/bi";
import { LuEye } from "react-icons/lu";
import { BaseUrl } from "../App";
import axios from "axios";
import CustomModal from "./CustomModal";
import { Col, Form, Modal, Row, Tab, Tabs } from "react-bootstrap";
import { FaEye } from "react-icons/fa";
import moment from "moment";
import image from "../assets/images/time-and-date (1).png";
import { Box, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CustomInput from "./Custom/CustomInput";
import { set } from "react-hook-form";
import toast from "react-hot-toast";
import { setLoaderCallback } from "../utils/Configs";
import VendorAvatar from '../components/VendorAvatar';
const Admin = () => {
  const [ticketId, setTicketId] = useState("");
  const [mode, setMode] = useState("");
  const [isView, setIsView] = useState(false);
  const [editid, seteditId] = useState({});
  const [checkRes, setCheckRes] = useState("");
  const [checkAvailable, setCheckAvailable] = useState("");
  const [isRelatedCheck, setIsRelatedCheck] = useState("");
  const [initialFormData, setInitialFormData] = useState([]);
  const [draftData, setDraftData] = useState({});
  const [formData, setFormData] = useState({});
  const [ticketdataedit, setticketdataedit] = useState({});
  const [brandDataLength, setBrandDataLength] = useState(0); // Initialize with 0 or any default value
  const [brandDataArray, setBrandDataArray] = useState([]);
  const [ticket_brand_dataedit, setticket_brand_dataedit] = useState([]);
  const [ticket_history_data, setticket_history_data] = useState([]);
  const [poattach, setPoAttach] = useState([]);
  const [tabData, setTabData] = useState("");
  const handlestsShow = () => {
    setstsModal(true);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stsmodal, setstsModal] = useState(false);
  const [filteredDatainbox, setFilteredDatainbox] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filteredDataBudget, setFilteredDataBudget] = useState([]);
  const [filteredDataPoBudget, setFilteredDataPoBudget] = useState([]);
  const [filteredDataBrand, setFilteredDataBrand] = useState([]);
  const [filteredDataNonBrand, setFilteredDataNonBrand] = useState([]);
  const [gettrackerrTicket, setgettrackerrTicket] = useState([]);
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [getCompletedTicket, setGetCompletedTicket] = useState([]);
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("selectedStatusTab") || "first";
  });
  const role = localStorage.getItem("role");
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateBudgetModalOpen, setIsCreateBudgetModalOpen] = useState(false);
  const [isCreatePoBudgetModalOpen, setIsCreatePoBudgetModalOpen] =
    useState(false);
  const [isCreateBrandModalOpen, setIsCreateBrandModalOpen] = useState(false);
  const [isCreateNonBrandModalOpen, setIsCreateNonBrandModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createUserFormData, setCreateUserFormData] = useState({
    userName: "",
    email: "",
    empId: "",
    password: "",
    type: [],
    mttp: false,
    roles: [],
  });
  const [createUserErrors, setCreateUserErrors] = useState({});
  const [approvers, setApprovers] = useState([]);
  const [poApprovers, setPoApprovers] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [poBudgetData, setPoBudgetData] = useState([]);
  const [brandData, setBrandData] = useState([]);
  const [nonBrandData, setNonBrandData] = useState([]);
  const [createBudgetFormData, setCreateBudgetFormData] = useState({
    minRange: "",
    maxRange: "",
    businessApprover: [],
  });
  const [createPoBudgetFormData, setCreatePoBudgetFormData] = useState({
    minRange: "",
    maxRange: "",
    businessApprover: [],
  });

  const [createBudgetErrors, setCreateBudgetErrors] = useState({});
  const [createPoBudgetErrors, setCreatePoBudgetErrors] = useState({});
  const [createBrandFormData, setCreateBrandFormData] = useState({
    division: "",
    brand: "",
    brandSubCategory: "",
    region: "",
    channel: "",
    fundcenter: "",
    internalorder: "",
  });
  const [createBrandErrors, setCreateBrandErrors] = useState({});
  const [createNonBrandFormData, setCreateNonBrandFormData] = useState({
    division: "", location: "", department: "", channel: "", fundcenter: "", costcenter: "",
  });
  const [createNonBrandErrors, setCreateNonBrandErrors] = useState({});

  // Add this state for search
  const [approverSearch, setApproverSearch] = useState("");
  const [poApproverSearch, setPoApproverSearch] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: false,
    showQuickJumper: false,
    total: 0,
  });

  useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);

  const fetchApprovers = async () => {
    try {
      const response = await axios.get(
        BaseUrl + "api/ticket/getBusinessApprover"
      );
      setApprovers(response.data);
    } catch (error) {
      console.error("Error fetching business approvers:", error);
    }
  };
  const fetchPoApprovers = async () => {
    try {
      const response = await axios.get(BaseUrl + "api/auth/allPoUsers");
      setPoApprovers(response.data.data);
    } catch (error) {
      console.error("Error fetching business approvers:", error);
    }
  };
  const fetchBudget = async () => {
    try {
      const apiUrl = BaseUrl + "budget";
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const ticketData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setBudgetData(ticketData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchPoBudget = async () => {
    try {
      const apiUrl = BaseUrl + "budget/all-po-approvers";
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const ticketData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setPoBudgetData(ticketData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchNonBrand = async () => {
    try {
      const response = await axios.get(BaseUrl + "api/sap/getNonBrandData?brandType=NonBrand", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setNonBrandData(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) { console.error("Error fetching non brand data:", error); }
  };

  const fetchBrand = async () => {
    try {
      const apiUrl = BaseUrl + "api/sap/getDivisionData";
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const ticketData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setBrandData(ticketData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const TrackerrTicket = async (page = 0, size = 10, search = "") => {
    try {
      const apiUrl = BaseUrl + `api/ticket/all-po-ticket?role=${role}&page=${page}&size=${size}${search ? `&search=${search}` : ""}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const ticketData = response.data.content || [];
      const totalCount = response.data.totalElements || 0;

      setgettrackerrTicket(ticketData);
      setPagination(prev => ({ ...prev, total: totalCount }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const userFetch = async () => {
    try {
      const apiUrl = BaseUrl + "api/auth/allUsers";
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const userData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setUserData(userData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "second") {
      TrackerrTicket(pagination.current - 1, pagination.pageSize, searchQuery);
    }
    userFetch();
    fetchApprovers();
    fetchPoApprovers();
    fetchBudget();
    fetchPoBudget();
    fetchBrand();
    fetchNonBrand();
  }, [isDataChanged, activeTab, pagination.current, pagination.pageSize, searchQuery]);
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    if (activeTab === "second") {
      TrackerrTicket(newPagination.current - 1, newPagination.pageSize, searchQuery);
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
  const showModal = () => {
    setIsModalOpen(true);
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
      title: "Brand and PO Description",
      dataIndex: "brand",
      render: (brand, record, index) => {
        const firstBrand = brand?.[0]
          ? `${brand[0].detailsBrand || ""} - ${brand[0].poDescription || ""}`
          : "";

        const bulletPoints =
          brand
            ?.map(
              (item) =>
                `• ${item.detailsBrand || ""} - ${item.poDescription || ""}`
            )
            .join("\n") || "";

        return (
          <React.Fragment key={`brand-${index}`}>
            <Tooltip
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
            <pre>{totalBaseValue || ""}</pre>
          </React.Fragment>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "stage",
      render: (stage, _, index) => {
        const historyList = Array.isArray(_?.historyList) ? _?.historyList : [];
        const rejectedStatus = historyList
          .filter((entry) => entry && entry.status.toLowerCase() === "reject")
          .slice(-1)[0];
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
          <pre>
            <span
              key={`status-${index}`}
              className={_.status === "Reject" ? "red_txt" : "green_txt"}
            >
              {_.status === "Reject" && rejectedStatus
                ? `Rejected by ${formatStatus(rejectedStatus.name || "")} (${rejectedStatus.username || ""
                })`
                : `Waiting for ${stage ? formatStatus(stage) : "Unknown"
                } Approval`}
            </span>
          </pre>
        );
      },
    },

    {
      title: "Action inbox",
      dataIndex: "id",
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
                // setMode("view");
                setTicketId(record.id);
                // setMode("editticket");
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
        </React.Fragment>
      ),
    },
  ];
  const user_table = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          {index + 1 + pagination.pageSize * (pagination.current - 1)}
        </React.Fragment>
      ),
    },
    {
      title: "User Name",
      dataIndex: "userName",
      render: (text, index) => (
        <React.Fragment key={`userName-${index}`}>{text}</React.Fragment> // <pre className="pre-text">{text}</pre>,
      ),
    },
    {
      title: "User Email",
      dataIndex: "email",
      render: (email, _, index) => {
        return (
          <React.Fragment key={`email-${index}`}>{email || ""}</React.Fragment>
        );
      },
    },
    {
      title: "User Role",
      dataIndex: "roles",
      render: (roles, _, index) => {
        return (
          <React.Fragment key={`roles-${index}`}>
            {roles?.join(", ") || ""}
          </React.Fragment>
        );
      },
    },

    {
      title: "Action inbox",
      dataIndex: "id",
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
                handleCreateUserModalOpen();
                setCreateUserFormData({
                  id: record.id,
                  userName: record.userName,
                  email: record.email,
                  empId: record.empId,
                  password: record.password,
                  type: record.type || [],
                  mttp: record.mttp || false,
                  roles: record.roles,
                });
                setMode("edit");
              }}
              className="eye"
            >
              <LuEye />
            </a>
          </Tooltip>
          {/* <Tooltip title="View History">
            <a
              onClick={() => {
                handlestsShow();
                historyyticketfunction(record.id);
              }}
              className="eyee"
            >
              <BiMessageDots />
            </a>{" "}
          </Tooltip> */}
        </React.Fragment>
      ),
    },
  ];
  const budget_table = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          {index + 1 + pagination.pageSize * (pagination.current - 1)}
        </React.Fragment>
      ),
    },
    {
      title: "Minimum Budget Range",
      dataIndex: "min",
      render: (text, record, index) => (
        <React.Fragment key={`min-${index}`}>
          {Number(text).toLocaleString()}
        </React.Fragment>
      ),
      sorter: (a, b) => a.min - b.min,
    },
    {
      title: "Maximum Budget Range",
      dataIndex: "max",
      render: (max, record, index) => (
        <React.Fragment key={`max-${index}`}>
          {Number(max).toLocaleString()}
        </React.Fragment>
      ),
      sorter: (a, b) => a.max - b.max,
    },
    {
      title: "User Count",
      dataIndex: "users",
      render: (users, record, index) => (
        <React.Fragment key={`count-${index}`}>
          {users?.length || 0}
        </React.Fragment>
      ),
      sorter: (a, b) => (a.users?.length || 0) - (b.users?.length || 0),
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
                handleCreateBudgetModalOpen();
                setCreateBudgetFormData({
                  id: record.id,
                  minRange: record.min,
                  maxRange: record.max,
                  businessApprover: record.users || [],
                });
                setMode("edit");
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
  const po_budget_table = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          {index + 1 + pagination.pageSize * (pagination.current - 1)}
        </React.Fragment>
      ),
    },
    {
      title: "Minimum Budget Range",
      dataIndex: "min",
      render: (text, record, index) => (
        <React.Fragment key={`min-${index}`}>
          {Number(text).toLocaleString()}
        </React.Fragment>
      ),
      sorter: (a, b) => a.min - b.min,
    },
    {
      title: "Maximum Budget Range",
      dataIndex: "max",
      render: (max, record, index) => (
        <React.Fragment key={`max-${index}`}>
          {Number(max).toLocaleString()}
        </React.Fragment>
      ),
      sorter: (a, b) => a.max - b.max,
    },
    {
      title: "User Count",
      dataIndex: "users",
      render: (users, record, index) => (
        <React.Fragment key={`count-${index}`}>
          {users?.length || 0}
        </React.Fragment>
      ),
      sorter: (a, b) => (a.users?.length || 0) - (b.users?.length || 0),
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
                handleCreatePoBudgetModalOpen();
                setCreatePoBudgetFormData({
                  id: record.id,
                  minRange: record.min,
                  maxRange: record.max,
                  businessApprover: record.users || [],
                });
                setMode("edit");
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
  const brand_table = [
    {
      title: "S.No",
      dataIndex: "id",
      render: (text, record, index) => (
        <React.Fragment key={`sno-${index}`}>
          {index + 1 + pagination.pageSize * (pagination.current - 1)}
        </React.Fragment>
      ),
    },
    {
      title: "Profile Centre",
      dataIndex: "division",
      render: (division, record, index) => (
        <React.Fragment key={`division-${index}`}>
          {division || 0}
        </React.Fragment>
      ),
    },
    {
      title: "Brand",
      dataIndex: "brand",
      render: (brand, record, index) => (
        <React.Fragment key={`brand-${index}`}>{brand || 0}</React.Fragment>
      ),
    },
    {
      title: "Brand Sub Category",
      dataIndex: "brandSubCategory",
      render: (brandSubCategory, record, index) => (
        <React.Fragment key={`brandSubCategory-${index}`}>
          {brandSubCategory || 0}
        </React.Fragment>
      ),
    },
    {
      title: "Region",
      dataIndex: "region",
      render: (region, record, index) => (
        <React.Fragment key={`region-${index}`}>{region || 0}</React.Fragment>
      ),
    },
    {
      title: "Channel",
      dataIndex: "channel",
      render: (channel, record, index) => (
        <React.Fragment key={`channel-${index}`}>{channel || 0}</React.Fragment>
      ),
    },
    {
      title: "Fund Center",
      dataIndex: "fundcenter",
      render: (fundcenter, record, index) => (
        <React.Fragment key={`fundcenter-${index}`}>
          {fundcenter || 0}
        </React.Fragment>
      ),
    },
    {
      title: "Internal Order",
      dataIndex: "internalorder",
      render: (internalorder, record, index) => (
        <React.Fragment key={`internalorder-${index}`}>
          {internalorder || 0}
        </React.Fragment>
      ),
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a
              onClick={() => {
                handleCreateBrandModalOpen();
                setCreateBrandFormData({
                  id: record.id,
                  division: record.division,
                  brand: record.brand,
                  brandSubCategory: record.brandSubCategory,
                  region: record.region,
                  channel: record.channel,
                  fundcenter: record.fundcenter,
                  internalorder: record.internalorder,
                });
                setMode("edit");
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

  const nonbrand_table = [
    { title: "S.No", dataIndex: "id", render: (text, record, index) => <React.Fragment key={`sno-${index}`}>{index + 1}</React.Fragment> },
    { title: "Division", dataIndex: "division", render: (v, _, i) => <React.Fragment key={`division-${i}`}>{v || ""}</React.Fragment> },
    { title: "Location", dataIndex: "location", render: (v, _, i) => <React.Fragment key={`location-${i}`}>{v || ""}</React.Fragment> },
    { title: "Department", dataIndex: "department", render: (v, _, i) => <React.Fragment key={`department-${i}`}>{v || ""}</React.Fragment> },
    { title: "Channel", dataIndex: "channel", render: (v, _, i) => <React.Fragment key={`channel-${i}`}>{v || ""}</React.Fragment> },
    { title: "Fund Center", dataIndex: "fundcenter", render: (v, _, i) => <React.Fragment key={`fundcenter-${i}`}>{v || ""}</React.Fragment> },
    { title: "Cost Center", dataIndex: "costcenter", render: (v, _, i) => <React.Fragment key={`costcenter-${i}`}>{v || ""}</React.Fragment> },
    {
      title: "Action", dataIndex: "id",
      render: (_, record, index) => (
        <React.Fragment key={`action-${index}`}>
          <Tooltip title="View Details">
            <a onClick={() => { handleCreateNonBrandModalOpen(); setCreateNonBrandFormData({ id: record.id, division: record.division, location: record.location, department: record.department, channel: record.channel, fundcenter: record.fundcenter, costcenter: record.costcenter }); setMode("edit"); }} className="eye"><LuEye /></a>
          </Tooltip>
        </React.Fragment>
      ),
    },
  ];

  useEffect(() => {
    const filtered = gettrackerrTicket.filter(
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
  }, [gettrackerrTicket, searchQuery]);

  useEffect(() => {
    const filtered = userData.filter(
      (item) =>
        item.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.roles?.join(", ") || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
    // Update the filtered data
    setFilteredData(filtered);
  }, [userData, searchQuery]);

  useEffect(() => {
    const filtered = budgetData.filter((item) => {
      const searchValue = searchQuery.toLowerCase();
      return (
        item.min?.toString().includes(searchValue) ||
        item.max?.toString().includes(searchValue) ||
        (item.users?.length || 0).toString().includes(searchValue)
      );
    });
    setFilteredDataBudget(filtered);
  }, [budgetData, searchQuery]);
  useEffect(() => {
    const filtered = poBudgetData.filter((item) => {
      const searchValue = searchQuery.toLowerCase();
      return (
        item.min?.toString().includes(searchValue) ||
        item.max?.toString().includes(searchValue) ||
        (item.users?.length || 0).toString().includes(searchValue)
      );
    });
    setFilteredDataPoBudget(filtered);
  }, [poBudgetData, searchQuery]);
  useEffect(() => {
    const filtered = brandData.filter((item) => {
      const searchValue = searchQuery.toLowerCase();
      return (
        item.division?.toLowerCase().includes(searchValue) ||
        item.brand?.toLowerCase().includes(searchValue) ||
        item.brandSubCategory?.toLowerCase().includes(searchValue) ||
        item.region?.toLowerCase().includes(searchValue) ||
        item.channel?.toLowerCase().includes(searchValue) ||
        item.internalorder?.toLowerCase().includes(searchValue) ||
        item.fundcenter?.toLowerCase().includes(searchValue)
      );
    });
    setFilteredDataBrand(filtered);
  }, [brandData, searchQuery]);
  useEffect(() => {
    const filtered = nonBrandData.filter((item) => {
      const searchValue = searchQuery.toLowerCase();
      return (
        item.division?.toLowerCase().includes(searchValue) ||
        item.location?.toLowerCase().includes(searchValue) ||
        item.department?.toLowerCase().includes(searchValue) ||
        item.channel?.toLowerCase().includes(searchValue) ||
        item.fundcenter?.toLowerCase().includes(searchValue) ||
        item.costcenter?.toLowerCase().includes(searchValue)
      );
    });
    setFilteredDataNonBrand(filtered);
  }, [nonBrandData, searchQuery]);
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchQuery(searchValue);
  };

  const handleCancel = () => {
    setMode("");
    setIsView(false);
    setIsModalOpen(false);
    setFormData({});
    setBrandDataLength(0);
    setTabData("");
  };
  const handleTabSelect = (tab) => {
    setSearchQuery("");
    setActiveTab(tab);
    setPagination((prevPagination) => ({
      ...prevPagination,
      current: 1,
    }));
  };
  const handlestsClose = () => setstsModal(false);

  const handleCreateUserModalOpen = () => {
    setIsCreateUserModalOpen(true);
  };
  const handleCreateBudgetModalOpen = () => {
    setIsCreateBudgetModalOpen(true);
  };
  const handleCreatePoBudgetModalOpen = () => {
    setIsCreatePoBudgetModalOpen(true);
  };
  const handleCreateBrandModalOpen = () => {
    setIsCreateBrandModalOpen(true);
  };
  const handleCreateNonBrandModalOpen = () => {
    setIsCreateNonBrandModalOpen(true);
  };

  const handleCreateUserModalClose = () => {
    setIsCreateUserModalOpen(false);
    setCreateUserFormData({
      userName: "",
      email: "",
      empId: "",
      password: "",
      type: [],
      mttp: false,
      roles: [],
    });
    setCreateUserErrors({});
    setMode("");
  };

  const handleCreateUserInputChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;

    if (name === "roles") {
      const selectedValues = Array.from(
        selectedOptions,
        (option) => option.value
      );
      setCreateUserFormData((prevData) => ({
        ...prevData,
        roles: selectedValues,
      }));
    } else {
      // Add input validation based on field name
      let validatedValue = value;
      switch (name) {
        case "userName":
          // Only allow letters and spaces
          validatedValue = value.replace(/[^a-zA-Z\s]/g, "");
          break;
        case "empId":
          // Only allow numbers and limit to 9 digits
          validatedValue = value.replace(/[^0-9]/g, "").slice(0, 9);
          break;
        default:
          validatedValue = value;
      }

      setCreateUserFormData((prevData) => ({
        ...prevData,
        [name]: validatedValue,
      }));
    }

    setCreateUserErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleTypeSelection = (type) => {
    setCreateUserFormData((prevData) => {
      const currentTypes = [...prevData.type];
      const typeIndex = currentTypes.indexOf(type);

      if (typeIndex !== -1) {
        currentTypes.splice(typeIndex, 1);
      } else {
        currentTypes.push(type);
      }

      return {
        ...prevData,
        type: currentTypes,
      };
    });

    setCreateUserErrors((prevErrors) => ({
      ...prevErrors,
      type: "",
    }));
  };

  // Function to handle role selection with simple click
  const handleRoleSelection = (role) => {
    setCreateUserFormData((prevData) => {
      const currentRoles = [...prevData.roles];
      const roleIndex = currentRoles.indexOf(role);

      // If role is already selected, remove it; otherwise, add it
      if (roleIndex !== -1) {
        currentRoles.splice(roleIndex, 1);
      } else {
        currentRoles.push(role);
      }

      return {
        ...prevData,
        roles: currentRoles,
      };
    });

    // Clear any validation errors for roles
    setCreateUserErrors((prevErrors) => ({
      ...prevErrors,
      roles: "",
    }));
  };

  const handleCreateUserSubmit = async () => {
    if (!validateCreateUserForm()) {
      return;
    }
    setIsSubmit(true);
    try {
      const apiUrl = `${BaseUrl}api/auth/signup`;
      const response = await axios.post(apiUrl, createUserFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setIsCreateUserModalOpen(false);
      userFetch(); // Refresh user data
      setCreateUserFormData({
        id: "",
        userName: "",
        email: "",
        empId: "",
        password: "",
        type: [],
        mttp: false,
        roles: [],
      });
      setIsDataChanged((prev) => !prev); // Refresh user data
      setSuccessMessage("User added successfully");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setIsSubmit(false);
    }
  };

  const validateCreateUserForm = () => {
    const errors = {};
    const usernameRegex = /^[a-zA-Z\s]{3,20}$/; // Alphabets and spaces only, 3-20 characters
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
    const empIdRegex = /^[0-9]{1,9}$/; // Exactly 6 digits

    if (
      !createUserFormData.userName ||
      !usernameRegex.test(createUserFormData.userName)
    ) {
      errors.userName = "User Name is required.";
    }
    if (
      !createUserFormData.email ||
      !emailRegex.test(createUserFormData.email)
    ) {
      errors.email = "Enter a valid email address.";
    }
    if (
      !createUserFormData.empId ||
      !empIdRegex.test(createUserFormData.empId)
    ) {
      errors.empId = "Employee ID must be less than 10 digits.";
    }
    if (mode !== "edit" && !createUserFormData.password) {
      errors.password = "Password is required.";
    }
    if (!createUserFormData.type || createUserFormData.type.length === 0) {
      errors.type = "User Type is required.";
    }
    if (!createUserFormData.roles || createUserFormData.roles.length === 0) {
      errors.roles = "At least one role must be selected.";
    }

    setCreateUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBudgetInputChange = (e) => {
    const { name, value } = e.target;
    setCreateBudgetFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setCreateBudgetErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };
  const handleCreatePoBudgetInputChange = (e) => {
    const { name, value } = e.target;
    setCreatePoBudgetFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setCreatePoBudgetErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const validateCreateBudgetForm = () => {
    const errors = {};

    if (!createBudgetFormData.minRange) {
      errors.minRange = "Minimum range is required";
    } else if (
      isNaN(createBudgetFormData.minRange) ||
      createBudgetFormData.minRange < 0
    ) {
      errors.minRange = "Please enter a valid minimum range";
    }

    if (!createBudgetFormData.maxRange) {
      errors.maxRange = "Maximum range is required";
    } else if (
      isNaN(createBudgetFormData.maxRange) ||
      createBudgetFormData.maxRange < 0
    ) {
      errors.maxRange = "Please enter a valid maximum range";
    } else if (
      Number(createBudgetFormData.maxRange) <=
      Number(createBudgetFormData.minRange)
    ) {
      errors.maxRange = "Maximum range must be greater than minimum range";
    }

    if (
      !createBudgetFormData.businessApprover ||
      createBudgetFormData.businessApprover.length === 0
    ) {
      errors.businessApprover =
        "At least one business approver must be selected";
    }

    setCreateBudgetErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const validateCreatePoBudgetForm = () => {
    const errors = {};

    if (!createPoBudgetFormData.minRange) {
      errors.minRange = "Minimum range is required";
    } else if (
      isNaN(createPoBudgetFormData.minRange) ||
      createPoBudgetFormData.minRange < 0
    ) {
      errors.minRange = "Please enter a valid minimum range";
    }

    if (!createPoBudgetFormData.maxRange) {
      errors.maxRange = "Maximum range is required";
    } else if (
      isNaN(createPoBudgetFormData.maxRange) ||
      createPoBudgetFormData.maxRange < 0
    ) {
      errors.maxRange = "Please enter a valid maximum range";
    } else if (
      Number(createPoBudgetFormData.maxRange) <=
      Number(createPoBudgetFormData.minRange)
    ) {
      errors.maxRange = "Maximum range must be greater than minimum range";
    }

    if (
      !createPoBudgetFormData.businessApprover ||
      createPoBudgetFormData.businessApprover.length === 0
    ) {
      errors.businessApprover =
        "At least one business approver must be selected";
    }

    setCreatePoBudgetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBudgetSubmit = async () => {
    if (!validateCreateBudgetForm()) {
      return;
    }
    setIsSubmit(true);
    const budgetData = {
      ...(mode === "edit" ? { id: createBudgetFormData.id } : {}),
      max: createBudgetFormData.maxRange,
      min: createBudgetFormData.minRange,
      userIds: createBudgetFormData.businessApprover.map((user) => user.id),
    };
    try {
      // Add your API call here
      const apiUrl = `${BaseUrl}budget`;
      const response = await axios.post(apiUrl, budgetData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      });
      setIsCreateBudgetModalOpen(false);
      fetchBudget(); // Refresh budget data
      setCreateBudgetFormData({
        minRange: "",
        maxRange: "",
        businessApprover: [],
      });
      setSuccessMessage(
        `Budget ${mode === "edit" ? "updated" : "added"} successfully`
      );
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
    } catch (error) {
      console.error("Error creating budget:", error);
    } finally {
      setIsSubmit(false);
    }
  };
  const handleCreatePoBudgetSubmit = async () => {
    if (!validateCreatePoBudgetForm()) {
      return;
    }
    setIsSubmit(true);
    const budgetData = {
      ...(mode === "edit" ? { id: createPoBudgetFormData.id } : {}),
      max: createPoBudgetFormData.maxRange,
      min: createPoBudgetFormData.minRange,
      userIds: createPoBudgetFormData.businessApprover.map((user) => user.id),
    };
    try {
      // Add your API call here
      const apiUrl = `${BaseUrl}budget/po-approver`;
      const response = await axios.post(apiUrl, budgetData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      });
      setIsCreatePoBudgetModalOpen(false);
      fetchPoBudget(); // Refresh budget data
      setCreatePoBudgetFormData({
        minRange: "",
        maxRange: "",
        businessApprover: [],
      });
      setSuccessMessage(
        `Budget ${mode === "edit" ? "updated" : "added"} successfully`
      );
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
    } catch (error) {
      console.error("Error creating budget:", error);
    } finally {
      setIsSubmit(false);
    }
  };

  const handleBusinessApproverSelection = (approverId) => {
    setCreateBudgetFormData((prevData) => {
      const currentApprovers = [...prevData.businessApprover];
      const approverIndex = currentApprovers.findIndex(
        (item) => item.id === approverId
      );

      // Find the approver object from the approvers array
      const selectedApprover = approvers.find(
        (approver) => approver.id === approverId
      );

      // If approver is already selected, remove it; otherwise, add it
      if (approverIndex !== -1) {
        currentApprovers.splice(approverIndex, 1);
      } else {
        currentApprovers.push({
          id: selectedApprover.id,
          userName: selectedApprover.userName,
          email: selectedApprover.email,
          empId: selectedApprover.empId,
        });
      }

      return {
        ...prevData,
        businessApprover: currentApprovers,
      };
    });

    // Clear any validation errors for businessApprover
    setCreateBudgetErrors((prevErrors) => ({
      ...prevErrors,
      businessApprover: "",
    }));
  };
  const handlePoApproverSelection = (approverId) => {
    setCreatePoBudgetFormData((prevData) => {
      const currentApprovers = [...prevData.businessApprover];
      const approverIndex = currentApprovers.findIndex(
        (item) => item.id === approverId
      );

      // Find the approver object from the approvers array
      const selectedApprover = poApprovers.find(
        (approver) => approver.id === approverId
      );

      // If approver is already selected, remove it; otherwise, add it
      if (approverIndex !== -1) {
        currentApprovers.splice(approverIndex, 1);
      } else {
        currentApprovers.push({
          id: selectedApprover.id,
          userName: selectedApprover.userName,
          email: selectedApprover.email,
          empId: selectedApprover.empId,
        });
      }

      return {
        ...prevData,
        businessApprover: currentApprovers,
      };
    });

    // Clear any validation errors for businessApprover
    setCreatePoBudgetErrors((prevErrors) => ({
      ...prevErrors,
      businessApprover: "",
    }));
  };

  const handleBudgetLimitSelection = (limit) => {
    setCreateBudgetFormData((prevData) => {
      const currentLimits = [...prevData.budgetLimit];
      const limitIndex = currentLimits.indexOf(limit);

      // If limit is already selected, remove it; otherwise, add it
      if (limitIndex !== -1) {
        currentLimits.splice(limitIndex, 1);
      } else {
        currentLimits.push(limit);
      }

      return {
        ...prevData,
        budgetLimit: currentLimits,
      };
    });

    // Clear any validation errors
    setCreateBudgetErrors((prevErrors) => ({
      ...prevErrors,
      budgetLimit: "",
    }));
  };

  const handleCreateBudgetModalClose = () => {
    setIsCreateBudgetModalOpen(false);
    setCreateBudgetFormData({
      minRange: "",
      maxRange: "",
      businessApprover: [],
    });
    setCreateBudgetErrors({});
    setApproverSearch(""); // Clear the search
    setMode("");
  };
  const handleCreatePoBudgetModalClose = () => {
    setIsCreatePoBudgetModalOpen(false);
    setCreatePoBudgetFormData({
      minRange: "",
      maxRange: "",
      businessApprover: [],
    });
    setCreatePoBudgetErrors({});
    setApproverSearch("");
    setMode("");
  };

  const handleCreateBrandModalClose = () => {
    setIsCreateBrandModalOpen(false);
    setCreateBrandFormData({ division: "", brand: "", brandSubCategory: "", region: "", channel: "", fundcenter: "", internalorder: "" });
    setCreateBrandErrors({});
    setMode("");
  };
  const handleCreateNonBrandModalClose = () => {
    setIsCreateNonBrandModalOpen(false);
    setCreateNonBrandFormData({ division: "", location: "", department: "", channel: "", fundcenter: "", costcenter: "" });
    setCreateNonBrandErrors({});
    setMode("");
  };
  const handleCreateNonBrandInputChange = (e) => {
    const { name, value } = e.target;
    setCreateNonBrandFormData((prev) => ({ ...prev, [name]: value }));
    setCreateNonBrandErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const validateCreateNonBrandForm = () => {
    const errors = {};
    if (!createNonBrandFormData.division) errors.division = "Division is required";
    if (!createNonBrandFormData.location) errors.location = "Location is required";
    if (!createNonBrandFormData.department) errors.department = "Department is required";
    if (!createNonBrandFormData.channel) errors.channel = "Channel is required";
    if (!createNonBrandFormData.fundcenter) errors.fundcenter = "Fund Center is required";
    if (!createNonBrandFormData.costcenter) errors.costcenter = "Cost Center is required";
    setCreateNonBrandErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleCreateNonBrandSubmit = async () => {
    if (!validateCreateNonBrandForm()) return;
    setIsSubmit(true);
    try {
      const isEdit = mode === "edit";
      const apiUrl = `${BaseUrl}api/nonbrand${isEdit ? `/${createNonBrandFormData.id}` : ""}`;
      const method = isEdit ? "put" : "post";
      await axios[method](apiUrl, createNonBrandFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}`, "Content-Type": "application/json" },
      });
      setIsCreateNonBrandModalOpen(false);
      fetchNonBrand();
      setCreateNonBrandFormData({ division: "", location: "", department: "", channel: "", fundcenter: "", costcenter: "" });
      setSuccessMessage(`Non Brand ${isEdit ? "updated" : "added"} successfully`);
      setTimeout(() => setSuccessMessage(null), 1000);
    } catch (error) { console.error("Error saving non brand:", error); }
    finally { setIsSubmit(false); }
  };

  const handleCreateBrandInputChange = (e) => {
    const { name, value } = e.target;
    setCreateBrandFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setCreateBrandErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const validateCreateBrandForm = () => {
    const errors = {};
    if (!createBrandFormData.division) errors.division = "Division is required";
    if (!createBrandFormData.brand) errors.brand = "Brand is required";
    if (!createBrandFormData.brandSubCategory)
      errors.brandSubCategory = "Brand Sub Category is required";
    if (!createBrandFormData.region) errors.region = "Region is required";
    if (!createBrandFormData.channel) errors.channel = "Channel is required";
    if (!createBrandFormData.fundcenter)
      errors.fundcenter = "Fund Center is required";
    if (!createBrandFormData.internalorder)
      errors.internalorder = "Internal Order is required";
    setCreateBrandErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBrandSubmit = async () => {
    if (!validateCreateBrandForm()) return;
    setIsSubmit(true);
    try {
      const IsEdit = mode === "edit";
      const apiUrl = `${BaseUrl}api/brand${IsEdit ? `/${createBrandFormData.id}` : ""
        }`;
      const method = IsEdit ? "put" : "post";
      const response = await axios[method](apiUrl, createBrandFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      });
      setIsCreateBrandModalOpen(false);
      fetchBrand();
      setCreateBrandFormData({
        division: "",
        brand: "",
        brandSubCategory: "",
        region: "",
        channel: "",
        fundcenter: "",
        internalorder: "",
      });
      setSuccessMessage(
        `Brand ${mode === "edit" ? "updated" : "added"} successfully`
      );
      setTimeout(() => setSuccessMessage(null), 1000);
    } catch (error) {
      console.error("Error creating brand:", error);
    } finally {
      setIsSubmit(false);
    }
  };

  // Add this function to filter approvers
  const filteredApprovers = approvers.filter((approver) =>
    approver.userName.toLowerCase().includes(approverSearch.toLowerCase())
  );
  const filteredPoApprovers = poApprovers.filter((approver) =>
    approver.userName.toLowerCase().includes(approverSearch.toLowerCase())
  );

  return (
    <div className="container-fluid main-content">
      {successMessage && (
        <div className="success-message-container">
          <div className="success-message">{successMessage}</div>
        </div>
      )}
      <Row className=" justify-content-end align-items-center gap-5">
        {/* <Col xl={7} lg={7} md={0} sm={0} /> */}
        <Col xl={4} lg={4} md={4} sm={4}>
          <Box
            className="search_box"
            component="form"
            onSubmit={(e) => e.preventDefault()}
            sx={{
              display: "flex",
              flexDirection: "row-reverse",
              "& > :not(style)": { width: "30ch" },
              marginRight: "10px",
            }}
            noValidate
            autoComplete="off"
          >
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
        </Col>
        {activeTab === "first" && (
          <Col xl={1} lg={1} md={2} sm={2} xs={2}>
            <input
              className="req_btn"
              type="button"
              onClick={handleCreateUserModalOpen}
              value="Add User"
            />
          </Col>
        )}
        {activeTab === "third" && (
          <Col xl={1} lg={1} md={2} sm={2} xs={2}>
            <input
              className="req_btn"
              type="button"
              onClick={handleCreateBudgetModalOpen}
              value="Add Budget"
            />
          </Col>
        )}
        {activeTab === "fourth" && (
          <Col xl={1} lg={1} md={2} sm={2} xs={2}>
            <input
              className="req_btn"
              type="button"
              onClick={handleCreatePoBudgetModalOpen}
              value="Add Budget"
            />
          </Col>
        )}
        {activeTab === "fifth" && (
          <Col xl={1} lg={1} md={2} sm={2} xs={2}>
            <input className="req_btn" type="button" onClick={handleCreateBrandModalOpen} value="Add Brand" />
          </Col>
        )}
        {activeTab === "sixth" && (
          <Col xl={1} lg={1} md={2} sm={2} xs={2}>
            <input className="req_btn" type="button" onClick={handleCreateNonBrandModalOpen} value="Add Non Brand" />
          </Col>
        )}
      </Row>
      <Tabs defaultActiveKey="first" onSelect={handleTabSelect}>
        <Tab eventKey="first" title="User">
          <div className="container-fluid table_bg" style={{ marginTop: "16px" }}>
            <div className="table-responsive">
              <Table
                columns={user_table}
                dataSource={filteredData}
                pagination={pagination}
                rowKey="id"
                loading={isLoading}
                onChange={handleTableChange}
                footer={(currentPageData) => {
                  return (
                    <span>
                      Showing {""}
                      {pagination.pageSize > currentPageData.length
                        ? currentPageData.length
                        : pagination.pageSize}{" "}
                      {""}of {currentPageData.length} Items.
                    </span>
                  );
                }}
              />
            </div>
          </div>
        </Tab>
        <Tab eventKey="second" title="Tickets">
          <div className="container-fluid table_bg" style={{ marginTop: "16px" }}>
            <div className="table-responsive">
              <Table
                columns={title_ticket_table}
                dataSource={filteredDatainbox}
                pagination={pagination}
                rowKey="id"
                loading={isLoading}
                onChange={handleTableChange}
                footer={(currentPageData) => {
                  return (
                    <span>
                      Showing {""}
                      {pagination.pageSize > currentPageData.length
                        ? currentPageData.length
                        : pagination.pageSize}{" "}
                      {""}of {currentPageData.length} Items.
                    </span>
                  );
                }}
              />
            </div>
          </div>
        </Tab>
        <Tab eventKey="third" title="Budget">
          <div className="container-fluid table_bg" style={{ marginTop: "16px" }}>
            <div className="table-responsive">
              <Table
                columns={budget_table}
                dataSource={filteredDataBudget}
                pagination={pagination}
                rowKey="id"
                loading={isLoading}
                onChange={handleTableChange}
                footer={(currentPageData) => {
                  return (
                    <span>
                      Showing {""}
                      {pagination.pageSize > currentPageData.length
                        ? currentPageData.length
                        : pagination.pageSize}{" "}
                      {""}of {currentPageData.length} Items.
                    </span>
                  );
                }}
              />
            </div>
          </div>
        </Tab>
        <Tab eventKey="fourth" title="Budget for Po Approver">
          <div className="container-fluid table_bg" style={{ marginTop: "16px" }}>
            <div className="table-responsive">
              <Table
                columns={po_budget_table}
                dataSource={filteredDataPoBudget}
                pagination={pagination}
                rowKey="id"
                loading={isLoading}
                onChange={handleTableChange}
                footer={(currentPageData) => {
                  return (
                    <span>
                      Showing {""}
                      {pagination.pageSize > currentPageData.length
                        ? currentPageData.length
                        : pagination.pageSize}{" "}
                      {""}of {currentPageData.length} Items.
                    </span>
                  );
                }}
              />
            </div>
          </div>
        </Tab>
        <Tab eventKey="fifth" title="Brand">
          <div className="container-fluid table_bg" style={{ marginTop: "16px" }}>
            <div className="table-responsive">
              <Table
                columns={brand_table}
                dataSource={filteredDataBrand}
                pagination={pagination}
                rowKey="id"
                loading={isLoading}
                onChange={handleTableChange}
                footer={(currentPageData) => {
                  return (
                    <span>
                      Showing {""}
                      {pagination.pageSize > currentPageData.length
                        ? currentPageData.length
                        : pagination.pageSize}{" "}
                      {""}of {currentPageData.length} Items.
                    </span>
                  );
                }}
              />
            </div>
          </div>
        </Tab>
        <Tab eventKey="sixth" title="Non Brand">
          <div className="container-fluid table_bg" style={{ marginTop: "16px" }}>
            <div className="table-responsive">
              <Table
                columns={nonbrand_table}
                dataSource={filteredDataNonBrand}
                pagination={pagination}
                rowKey="id"
                loading={isLoading}
                onChange={handleTableChange}
                footer={(currentPageData) => (
                  <span>Showing {pagination.pageSize > currentPageData.length ? currentPageData.length : pagination.pageSize} of {currentPageData.length} Items.</span>
                )}
              />
            </div>
          </div>
        </Tab>
      </Tabs>
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
      <CustomModal
        isModalOpen={isModalOpen}
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
        isBrand={localStorage.getItem("selectedTicketTab") === "Brand"}
      />
      <Modal
        show={isCreateUserModalOpen}
        onHide={handleCreateUserModalClose}
        centered
        className="adminModel"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="mb-3 adminModelHeader" style={{color: "#fff"}}>
            {mode === "edit" ? "Update User" : "Add User"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="adminModelTwo">
              <Form.Group controlId="userName" className="mb-3 adminModelBox">
                <Form.Label>User Name</Form.Label>
                <Form.Control
                  type="text"
                  name="userName"
                  placeholder="Enter User Name"
                  value={createUserFormData.userName}
                  onChange={handleCreateUserInputChange}
                  isInvalid={!!createUserErrors.userName}
                  pattern="[a-zA-Z\s]{3,20}"
                  onKeyPress={(e) => {
                    if (!/[a-zA-Z\s]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                <Form.Control.Feedback type="invalid">
                  {createUserErrors.userName}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="email" className="mb-3 adminModelBox">
                <Form.Label>User Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter User Email"
                  value={createUserFormData.email}
                  onChange={handleCreateUserInputChange}
                  isInvalid={!!createUserErrors.email}
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                />
                <Form.Control.Feedback type="invalid">
                  {createUserErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="adminModelTwo">
              <Form.Group controlId="empId" className="mb-3 adminModelBox">
                <Form.Label>Employee ID</Form.Label>
                <Form.Control
                  type="text"
                  name="empId"
                  placeholder="Enter Employee ID"
                  value={createUserFormData.empId}
                  onChange={handleCreateUserInputChange}
                  isInvalid={!!createUserErrors.empId}
                  maxLength={9}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                <Form.Control.Feedback type="invalid">
                  {createUserErrors.empId}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="password" className="mb-3 adminModelBox">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  value={createUserFormData.password}
                  onChange={handleCreateUserInputChange}
                  isInvalid={!!createUserErrors.password}
                />
                <Form.Control.Feedback type="invalid">
                  {createUserErrors.password}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="adminModelTwo">
              <Form.Group controlId="type" className="mb-3 adminModelBox">
                <Form.Label>User Type</Form.Label>
                <div className="custom-role-selector">
                  {[
                    { value: "Brand", label: "Brand" },
                    { value: "NonBrand", label: "Non Brand" },
                  ].map((type) => (
                    <div
                      key={type.value}
                      className={`role-option ${createUserFormData.type.includes(type.value)
                          ? "selected"
                          : ""
                        }`}
                      onClick={() => handleTypeSelection(type.value)}
                    >
                      {type.label}
                    </div>
                  ))}
                </div>
                {!!createUserErrors.type && (
                  <div className="invalid-feedback d-block">
                    {createUserErrors.type}
                  </div>
                )}
              </Form.Group>

              <Form.Group controlId="mttp" className="mb-3 adminModelBox">
                <Form.Label>MTTP</Form.Label>
                <div className="d-flex gap-3 mt-2">
                  <Form.Check
                    type="radio"
                    label="Yes"
                    name="mttp"
                    checked={createUserFormData.mttp === true}
                    onChange={() => {
                      setCreateUserFormData((prevData) => ({
                        ...prevData,
                        mttp: true,
                      }));
                    }}
                  />
                  <Form.Check
                    type="radio"
                    label="No"
                    name="mttp"
                    checked={createUserFormData.mttp === false}
                    onChange={() => {
                      setCreateUserFormData((prevData) => ({
                        ...prevData,
                        mttp: false,
                      }));
                    }}
                  />
                </div>
              </Form.Group>
            </div>

            <div className="adminModelTwo">
              <Form.Group controlId="roles" className="mb-3 adminModelBox">
                <Form.Label>Roles</Form.Label>
                <div className="custom-role-selector">
                  {[
                    { value: "Requestor", label: "Requestor" },
                    { value: "Business_Approver", label: "Business Approver" },
                    { value: "PO_Screening", label: "Po Screening" },
                    { value: "Business_head", label: "Business head" },
                    { value: "Budget_Team", label: "Budget Team" },
                    {
                      value: "Budget_release_team",
                      label: "Budget Release Team",
                    },
                    { value: "Po_maker", label: "Po Maker" },
                    { value: "Po_checker", label: "Po Checker" },
                    { value: "Po_release", label: "Po Release" },
                    { value: "Delivery_Planner", label: "Delivery Planner" },
                    { value: "Internal_Audit", label: "Internal Audit" },
                    { value: "admin", label: "Admin" },
                  ].map((role) => (
                    <div
                      key={role.value}
                      className={`role-option ${createUserFormData.roles.includes(role.value)
                          ? "selected"
                          : ""
                        }`}
                      onClick={() => handleRoleSelection(role.value)}
                    >
                      {role.label}
                    </div>
                  ))}
                </div>
                {!!createUserErrors.roles && (
                  <div className="invalid-feedback d-block">
                    {createUserErrors.roles}
                  </div>
                )}
              </Form.Group>

              <div className="adminModelBox"></div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="close_btn"
            onClick={handleCreateUserModalClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="req_btn"
            onClick={handleCreateUserSubmit}
            disabled={isSubmit}
          >
            {mode === "edit" ? "Update User" : "Add User"}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={isCreatePoBudgetModalOpen}
        onHide={handleCreatePoBudgetModalClose}
        centered
        className="adminModel"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="mb-3 adminModelHeader" style={{color: "#fff"}}>
            {mode === "edit" ? "Update Budget" : "Add Budget"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="adminModelTwo">
              <Form.Group controlId="minRange" className="mb-3 adminModelBox">
                <Form.Label>Min Range</Form.Label>
                <Form.Control
                  type="number"
                  name="minRange"
                  placeholder="Enter minimum range"
                  value={createPoBudgetFormData.minRange}
                  onChange={handleCreatePoBudgetInputChange}
                  isInvalid={!!createPoBudgetErrors.minRange}
                  min="0"
                />
                <Form.Control.Feedback type="invalid">
                  {createPoBudgetErrors.minRange}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="maxRange" className="mb-3 adminModelBox">
                <Form.Label>Max Range</Form.Label>
                <Form.Control
                  type="number"
                  name="maxRange"
                  placeholder="Enter maximum range"
                  value={createPoBudgetFormData.maxRange}
                  onChange={handleCreatePoBudgetInputChange}
                  isInvalid={!!createPoBudgetErrors.maxRange}
                  min="0"
                />
                <Form.Control.Feedback type="invalid">
                  {createPoBudgetErrors.maxRange}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <Form.Group
              controlId="businessApprover"
              className="mb-3 adminModelBox"
            >
              <Form.Label>Po Approver</Form.Label>

              {/* Add search input */}
              <Form.Control
                type="text"
                placeholder="Search approvers..."
                value={poApproverSearch}
                onChange={(e) => setPoApproverSearch(e.target.value)}
                className="mb-2"
              />

              <div className="custom-role-selector">
                {filteredPoApprovers.map((approver) => (
                  <div
                    key={approver.id}
                    className={`role-option ${Array.isArray(createPoBudgetFormData.businessApprover) &&
                        createPoBudgetFormData.businessApprover.some(
                          (item) => item.id === approver.id
                        )
                        ? "selected"
                        : ""
                      }`}
                    onClick={() => handlePoApproverSelection(approver.id)}
                  >
                    {approver.userName}
                  </div>
                ))}
                {filteredPoApprovers.length === 0 && (
                  <div className="no-results">No approvers found</div>
                )}
              </div>

              {/* Rest of your existing code for selected approvers */}
              <div className="selected-items-container">
                {createPoBudgetFormData.businessApprover.length > 0 && (
                  <div className="selected-items">
                    <label>Selected Approvers:</label>
                    <div className="selected-tags">
                      {createPoBudgetFormData.businessApprover.map(
                        (approver) => (
                          <span key={approver.id} className="selected-tag">
                            {approver.userName}
                            <span
                              className="remove-tag"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePoApproverSelection(approver.id);
                              }}
                            >
                              ×
                            </span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!!createPoBudgetErrors.businessApprover && (
                <div className="invalid-feedback d-block">
                  {createPoBudgetErrors.businessApprover}
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="close_btn"
            onClick={handleCreateBudgetModalClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="req_btn"
            onClick={handleCreatePoBudgetSubmit}
            disabled={isSubmit}
          >
            {mode === "edit" ? "Update Budget" : "Add Budget"}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={isCreateBudgetModalOpen}
        onHide={handleCreateBudgetModalClose}
        centered
        className="adminModel"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="mb-3 adminModelHeader" style={{color: "#fff"}}>
            {mode === "edit" ? "Update Budget" : "Add Budget"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="adminModelTwo">
              <Form.Group controlId="minRange" className="mb-3 adminModelBox">
                <Form.Label>Min Range</Form.Label>
                <Form.Control
                  type="number"
                  name="minRange"
                  placeholder="Enter minimum range"
                  value={createBudgetFormData.minRange}
                  onChange={handleCreateBudgetInputChange}
                  isInvalid={!!createBudgetErrors.minRange}
                  min="0"
                />
                <Form.Control.Feedback type="invalid">
                  {createBudgetErrors.minRange}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="maxRange" className="mb-3 adminModelBox">
                <Form.Label>Max Range</Form.Label>
                <Form.Control
                  type="number"
                  name="maxRange"
                  placeholder="Enter maximum range"
                  value={createBudgetFormData.maxRange}
                  onChange={handleCreateBudgetInputChange}
                  isInvalid={!!createBudgetErrors.maxRange}
                  min="0"
                />
                <Form.Control.Feedback type="invalid">
                  {createBudgetErrors.maxRange}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <Form.Group
              controlId="businessApprover"
              className="mb-3 adminModelBox"
            >
              <Form.Label>Business Approver</Form.Label>

              {/* Add search input */}
              <Form.Control
                type="text"
                placeholder="Search approvers..."
                value={approverSearch}
                onChange={(e) => setApproverSearch(e.target.value)}
                className="mb-2"
              />

              <div className="custom-role-selector">
                {filteredApprovers.map((approver) => (
                  <div
                    key={approver.id}
                    className={`role-option ${Array.isArray(createBudgetFormData.businessApprover) &&
                        createBudgetFormData.businessApprover.some(
                          (item) => item.id === approver.id
                        )
                        ? "selected"
                        : ""
                      }`}
                    onClick={() => handleBusinessApproverSelection(approver.id)}
                  >
                    {approver.userName}
                  </div>
                ))}
                {filteredApprovers.length === 0 && (
                  <div className="no-results">No approvers found</div>
                )}
              </div>

              {/* Rest of your existing code for selected approvers */}
              <div className="selected-items-container">
                {createBudgetFormData.businessApprover.length > 0 && (
                  <div className="selected-items">
                    <label>Selected Approvers:</label>
                    <div className="selected-tags">
                      {createBudgetFormData.businessApprover.map((approver) => (
                        <span key={approver.id} className="selected-tag">
                          {approver.userName}
                          <span
                            className="remove-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBusinessApproverSelection(approver.id);
                            }}
                          >
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!!createBudgetErrors.businessApprover && (
                <div className="invalid-feedback d-block">
                  {createBudgetErrors.businessApprover}
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="close_btn"
            onClick={handleCreateBudgetModalClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="req_btn"
            onClick={handleCreateBudgetSubmit}
            disabled={isSubmit}
          >
            {mode === "edit" ? "Update Budget" : "Add Budget"}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={isCreateBrandModalOpen}
        onHide={handleCreateBrandModalClose}
        centered
        className="adminModel"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="mb-3 adminModelHeader" style={{color: "#fff"}}>
            {mode === "edit" ? "Update Brand" : "Add Brand"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="adminModelTwo">
              <Form.Group controlId="division" className="mb-3 adminModelBox">
                <Form.Label>
                  Division<span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="division"
                  placeholder="Enter Division"
                  value={createBrandFormData.division}
                  onChange={handleCreateBrandInputChange}
                  isInvalid={!!createBrandErrors.division}
                />
                <Form.Control.Feedback type="invalid">
                  {createBrandErrors.division}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="brand" className="mb-3 adminModelBox">
                <Form.Label>
                  Brand<span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  placeholder="Enter Brand"
                  value={createBrandFormData.brand}
                  onChange={handleCreateBrandInputChange}
                  isInvalid={!!createBrandErrors.brand}
                />
                <Form.Control.Feedback type="invalid">
                  {createBrandErrors.brand}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="adminModelTwo">
              <Form.Group
                controlId="brandSubCategory"
                className="mb-3 adminModelBox"
              >
                <Form.Label>
                  Brand Sub Category<span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="brandSubCategory"
                  placeholder="Enter Brand Sub Category"
                  value={createBrandFormData.brandSubCategory}
                  onChange={handleCreateBrandInputChange}
                  isInvalid={!!createBrandErrors.brandSubCategory}
                />
                <Form.Control.Feedback type="invalid">
                  {createBrandErrors.brandSubCategory}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="region" className="mb-3 adminModelBox">
                <Form.Label>
                  Region<span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="region"
                  placeholder="Enter Region"
                  value={createBrandFormData.region}
                  onChange={handleCreateBrandInputChange}
                  isInvalid={!!createBrandErrors.region}
                />
                <Form.Control.Feedback type="invalid">
                  {createBrandErrors.region}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="adminModelTwo">
              <Form.Group controlId="channel" className="mb-3 adminModelBox">
                <Form.Label>
                  Channel<span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="channel"
                  placeholder="Enter Channel"
                  value={createBrandFormData.channel}
                  onChange={handleCreateBrandInputChange}
                  isInvalid={!!createBrandErrors.channel}
                />
                <Form.Control.Feedback type="invalid">
                  {createBrandErrors.channel}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="fundcenter" className="mb-3 adminModelBox">
                <Form.Label>
                  Fund Center<span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="fundcenter"
                  placeholder="Enter Fund Center"
                  value={createBrandFormData.fundcenter}
                  onChange={handleCreateBrandInputChange}
                  isInvalid={!!createBrandErrors.fundcenter}
                />
                <Form.Control.Feedback type="invalid">
                  {createBrandErrors.fundcenter}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="adminModelTwo">
              <Form.Group
                controlId="internalorder"
                className="mb-3 adminModelBox"
              >
                <Form.Label>
                  Internal Order<span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="internalorder"
                  placeholder="Enter Internal Order"
                  value={createBrandFormData.internalorder}
                  onChange={handleCreateBrandInputChange}
                  isInvalid={!!createBrandErrors.internalorder}
                />
                <Form.Control.Feedback type="invalid">
                  {createBrandErrors.internalorder}
                </Form.Control.Feedback>
              </Form.Group>
              <div className="adminModelBox"></div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="close_btn"
            onClick={handleCreateBrandModalClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="req_btn"
            onClick={handleCreateBrandSubmit}
            disabled={isSubmit}
          >
            {mode === "edit" ? "Update Brand" : "Add Brand"}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={isCreateNonBrandModalOpen} onHide={handleCreateNonBrandModalClose} centered className="adminModel" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="mb-3 adminModelHeader" style={{ color: "#fff" }}>
            {mode === "edit" ? "Update Non Brand" : "Add Non Brand"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="adminModelTwo">
              <Form.Group controlId="division" className="mb-3 adminModelBox">
                <Form.Label>Division<span style={{ color: "red" }}>*</span></Form.Label>
                <Form.Control type="text" name="division" placeholder="Enter Division" value={createNonBrandFormData.division} onChange={handleCreateNonBrandInputChange} isInvalid={!!createNonBrandErrors.division} />
                <Form.Control.Feedback type="invalid">{createNonBrandErrors.division}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="location" className="mb-3 adminModelBox">
                <Form.Label>Location<span style={{ color: "red" }}>*</span></Form.Label>
                <Form.Control type="text" name="location" placeholder="Enter Location" value={createNonBrandFormData.location} onChange={handleCreateNonBrandInputChange} isInvalid={!!createNonBrandErrors.location} />
                <Form.Control.Feedback type="invalid">{createNonBrandErrors.location}</Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="adminModelTwo">
              <Form.Group controlId="department" className="mb-3 adminModelBox">
                <Form.Label>Department<span style={{ color: "red" }}>*</span></Form.Label>
                <Form.Control type="text" name="department" placeholder="Enter Department" value={createNonBrandFormData.department} onChange={handleCreateNonBrandInputChange} isInvalid={!!createNonBrandErrors.department} />
                <Form.Control.Feedback type="invalid">{createNonBrandErrors.department}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="channel" className="mb-3 adminModelBox">
                <Form.Label>Channel<span style={{ color: "red" }}>*</span></Form.Label>
                <Form.Control type="text" name="channel" placeholder="Enter Channel" value={createNonBrandFormData.channel} onChange={handleCreateNonBrandInputChange} isInvalid={!!createNonBrandErrors.channel} />
                <Form.Control.Feedback type="invalid">{createNonBrandErrors.channel}</Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="adminModelTwo">
              <Form.Group controlId="fundcenter" className="mb-3 adminModelBox">
                <Form.Label>Fund Center<span style={{ color: "red" }}>*</span></Form.Label>
                <Form.Control type="text" name="fundcenter" placeholder="Enter Fund Center" value={createNonBrandFormData.fundcenter} onChange={handleCreateNonBrandInputChange} isInvalid={!!createNonBrandErrors.fundcenter} />
                <Form.Control.Feedback type="invalid">{createNonBrandErrors.fundcenter}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="costcenter" className="mb-3 adminModelBox">
                <Form.Label>Cost Center<span style={{ color: "red" }}>*</span></Form.Label>
                <Form.Control type="text" name="costcenter" placeholder="Enter Cost Center" value={createNonBrandFormData.costcenter} onChange={handleCreateNonBrandInputChange} isInvalid={!!createNonBrandErrors.costcenter} />
                <Form.Control.Feedback type="invalid">{createNonBrandErrors.costcenter}</Form.Control.Feedback>
              </Form.Group>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="close_btn" onClick={handleCreateNonBrandModalClose}>Cancel</Button>
          <Button variant="primary" className="req_btn" onClick={handleCreateNonBrandSubmit} disabled={isSubmit}>
            {mode === "edit" ? "Update Non Brand" : "Add Non Brand"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
export default Admin;

