import React, { useState, useEffect } from "react";
import { Table } from "antd";
import { Tooltip } from "antd";
import { Tab, Tabs } from "react-bootstrap";
import { LuEye } from "react-icons/lu";
import { BiMessageDots } from "react-icons/bi";
import { MdCheckCircle, MdAccessTime } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Modal from "react-bootstrap/Modal";
import moment from "moment";
import axios from "axios";
import { BaseUrl } from "../App.js";
import CustomModal from "./CustomModal.jsx";

const InternalAudit = () => {
  const role = localStorage.getItem("role");
  const [isBrandTab, setIsBrandTab] = useState(localStorage.getItem("selectedTicketTab") === "Brand");

  const [completedData, setCompletedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [stsmodal, setStsModal] = useState(false);
  const [ticket_history_data, setticket_history_data] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [brandDataArray, setBrandDataArray] = useState([]);
  const [brandDataLength, setBrandDataLength] = useState(0);
  const [tabData] = useState("Completed");
  const [poattach, setPoAttach] = useState([]);
  const [checkRes, setCheckRes] = useState("");
  const [checkAvailable, setCheckAvailable] = useState("");
  const [isRelatedCheck, setIsRelatedCheck] = useState("");
  const [isModalView] = useState(false);

  const fetchCompleted = async (page = 0, size = 10, search = "") => {
    setIsLoading(true);
    try {
      const type = isBrandTab ? "brand" : "nonbrand";
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : "";
      const res = await axios.get(
        `${BaseUrl}api/ticket/po-checker-approved-tickets?page=${page}&size=${size}&type=${type}${searchParam}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      const data = res.data?.content ?? res.data;
      const total = res.data?.totalElements ?? (Array.isArray(data) ? data.length : 0);
      setCompletedData(Array.isArray(data) ? data : []);
      setFilteredData(Array.isArray(data) ? data : []);
      setPagination((p) => ({ ...p, current: page + 1, total }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
    fetchCompleted(0, pagination.pageSize, searchQuery);
  };

  useEffect(() => {
    const handleTabChange = () => {
      const updated = localStorage.getItem("selectedTicketTab") === "Brand";
      setIsBrandTab(updated);
    };
    window.addEventListener("tabChanged", handleTabChange);
    return () => window.removeEventListener("tabChanged", handleTabChange);
  }, []);

  useEffect(() => {
    fetchCompleted(0, pagination.pageSize);
  }, [isBrandTab]);

  const formatStatus = (status) =>
    status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const statusCell = (record) => {
    const isCompleted = record.stage === "Completed";
    return (
      <span style={{ color: isCompleted ? "#52c41a" : "#faad14", fontSize: "12px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
        {isCompleted ? <MdCheckCircle size={14} /> : <MdAccessTime size={14} />}
        {isCompleted ? "Completed" : formatStatus(record.stage)}
      </span>
    );
  };

  const viewTicket = async (id) => {
    try {
      const res = await fetch(`${BaseUrl}api/ticket/getTicketById/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const record = await res.json();
      setFormData({ ...record.data });
      setCheckRes(record?.data?.budgetDetails);
      setCheckAvailable(record?.data?.reason);
      if (record?.data?.isRelated !== null)
        setIsRelatedCheck(record?.data?.isRelated ? "YES" : "NO");
      const brandData = record?.data?.brand;
      setBrandDataArray(brandData);
      if (Array.isArray(brandData) && brandData.length > 0) {
        setBrandDataLength(brandData.length);
      }
      const historyList = record?.data?.historyList;
      const approved = historyList?.filter((e) => e.status.toLowerCase() === "approved")?.slice(-1)[0];
      setPoAttach(approved?.name);
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const viewHistory = async (id) => {
    try {
      const res = await fetch(`${BaseUrl}api/ticket/getTicketById/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const record = await res.json();
      const history = record?.data?.historyList;
      setticket_history_data(Array.isArray(history) ? history : []);
      setStsModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { title: "S.No", render: (_, __, i) => <pre>{(pagination.current - 1) * pagination.pageSize + i + 1}</pre> },
    { title: "Req No", dataIndex: "reqNo", render: (t) => <pre className="pre-text">{t}</pre> },
    {
      title: "Req Date", dataIndex: "createdDate",
      render: (v) => <pre>{v || ""}</pre>,
      sorter: (a, b) => (a.createdDate || "").localeCompare(b.createdDate || ""),
    },
    { title: "Req Name", dataIndex: "username", render: (v) => <pre>{v || ""}</pre> },
    { title: "Vendor Name", dataIndex: "vendorName", render: (v) => <pre>{v || ""}</pre> },
    {
      title: isBrandTab ? "Brand and PO Description" : "PO Description",
      dataIndex: "brand",
      render: (brand) => {
        const first = brand?.[0] ? (isBrandTab ? `${brand[0].detailsBrand || ""} - ${brand[0].poDescription || ""}` : brand[0].poDescription || "") : "";
        const bullets = brand?.map((item) => isBrandTab ? `• ${item.detailsBrand || ""} - ${item.poDescription || ""}` : `• ${item.poDescription || ""}`).join("\n") || "";
        return (
          <Tooltip overlayClassName="bomb-tooltip" title={<pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{bullets}</pre>}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <pre>{first}</pre>
              {brand?.length > 1 && <span style={{ backgroundColor: "#52c41a", color: "white", borderRadius: "10px", padding: "2px 6px", fontSize: "11px", fontWeight: "bold", marginBottom: "16px" }}>{brand.length}</span>}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Total Base Value", dataIndex: "totalBaseValue",
      render: (v) => <>₹ {v ? v.toLocaleString("en-IN") : "0"}</>,
    },
    { title: "Status", render: (_, record) => statusCell(record) },
    {
      title: "Action",
      render: (_, record) => (
        <div className="action__icons__businessapprover">
          <Tooltip title="View Details">
            <a onClick={() => viewTicket(record.id)} className="eye"><LuEye /></a>
          </Tooltip>
          <Tooltip title="View History">
            <a onClick={() => viewHistory(record.id)} className="eyee"><BiMessageDots /></a>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="container-fluid main-content">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ flex: 1 }}>
            <Tabs activeKey="completed" className="mb-0">
              <Tab eventKey="completed" title="COMPLETED" />
            </Tabs>
          </div>
          <Box component="form" onSubmit={(e) => e.preventDefault()} sx={{ display: "flex", alignItems: "center", marginLeft: "20px" }} noValidate autoComplete="off">
            <TextField
              className="search_input"
              placeholder="Search"
              value={searchQuery}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              InputProps={{ endAdornment: <InputAdornment className="search_icon">{searchQuery ? <span style={{ cursor: "pointer", fontSize: "16px", lineHeight: 1 }} onClick={() => { setSearchQuery(""); fetchCompleted(0, pagination.pageSize, ""); setPagination((p) => ({ ...p, current: 1 })); }}>✕</span> : <SearchIcon />}</InputAdornment> }}
              sx={{ width: "30ch", "& .MuiOutlinedInput-root": { "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#C4C4C4", borderWidth: 1 }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#C4C4C4" } } }}
            />
          </Box>
        </div>
        <div className="container-fluid table_bg">
          <div className="table-responsive">
            <Table
              columns={columns}
              loading={isLoading}
              dataSource={filteredData}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page, pageSize) => fetchCompleted(page - 1, pageSize, searchQuery),
              }}
              footer={(data) => <span>Showing {data.length} of {pagination.total} Items.</span>}
            />
          </div>
        </div>
      </div>

      <Modal size="sm" show={stsmodal} onHide={() => setStsModal(false)} centered className="compact-remarks-modal">
        <Modal.Header closeButton className="compact-header"><Modal.Title>History</Modal.Title></Modal.Header>
        <Modal.Body className="compact-body">
          {Array.isArray(ticket_history_data) && ticket_history_data.length > 0 ? (
            <div className="compact-list">
              {ticket_history_data.map((t, i) => (
                <div className="compact-item" key={i}>
                  <div className={`compact-badge ${t.status?.toLowerCase().includes("reject") ? "badge-reject" : t.status?.toLowerCase().includes("submit") ? "badge-submit" : t.status?.toLowerCase().includes("approve") ? "badge-approved" : t.status?.toLowerCase().includes("completed") ? "badge-completed" : "badge-default"}`}>{t.status}</div>
                  <div className="compact-info">
                    <span className="compact-name">{t.name}</span>
                    <span className="compact-date">{moment(t.date).format("MMM D, YYYY HH:mm:ss")}</span>
                  </div>
                  <div className="compact-icons">
                    <Tooltip title={t.remarks || "No Remarks"}><FaEye className="compact-icon" /></Tooltip>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="compact-empty">No history</div>}
        </Modal.Body>
      </Modal>

      <CustomModal
        isModalOpen={isModalOpen}
        handleOk={() => setIsModalOpen(false)}
        handleCancel={() => setIsModalOpen(false)}
        handleFormRemarks={() => {}}
        handleFormApprove={() => {}}
        brandDataArray={brandDataArray}
        brandDataLength={brandDataLength}
        tabData={tabData}
        poattach={poattach}
        checkAvailable={checkAvailable}
        checkRes={checkRes}
        isRelatedCheck={isRelatedCheck}
        mode="completed"
        data={formData}
        isView={true}
        isModalView={isModalView}
        isBrand={isBrandTab}
      />
    </div>
  );
};

export default InternalAudit;
