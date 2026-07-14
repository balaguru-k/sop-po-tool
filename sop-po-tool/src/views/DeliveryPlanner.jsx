import { Table, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react'
import { BaseUrl } from "../App";
import axios from "axios";
import CustomModal from "./CustomModal";
import { Col, Form, Modal, Row, Tab, Tabs } from 'react-bootstrap';
import { BiMessageDots } from 'react-icons/bi';
import { LuEye } from 'react-icons/lu';
import { Box, InputAdornment, TextField } from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import { setLoaderCallback } from '../utils/Configs';
import { FaEye } from 'react-icons/fa';
import moment from "moment";
import image from "../assets/images/time-and-date (1).png";
import VendorAvatar from '../components/VendorAvatar';


const DeliveryPlanner = () => {

const [gettrackerrTicket, setgettrackerrTicket] = useState([]);
const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: false,
    showQuickJumper: false,
  });
const [isView, setIsView] = useState(false);
const [checkRes, setCheckRes] = useState("");
const [checkAvailable, setCheckAvailable] = useState("");
const [isRelatedCheck, setIsRelatedCheck] = useState("");
const [draftData, setDraftData] = useState({});
const [formData, setFormData] = useState({});
const [ticket_history_data, setticket_history_data] = useState([]);
const [poattach, setPoAttach] = useState("");
const [tabData, setTabData] = useState("");
const [isModalOpen, setIsModalOpen] = useState(false);
const [brandDataArray, setBrandDataArray] = useState([]);
const [brandDataLength, setBrandDataLength] = useState(0);
const [stsmodal, setstsModal] = useState(false);
const [filteredDatainbox, setFilteredDatainbox] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [mode, setMode] = useState("");

 useEffect(() => {
    setLoaderCallback(setIsLoading);
  }, []);
 const showModal = () => {
    setIsModalOpen(true);
  };
  
 const handlestsShow = () => {
    setstsModal(true);
  };

const handleTableChange = (pagination) => {
    setPagination(pagination);
  };
const handleTabSelect = (tab) => {
    setSearchQuery("");
    setPagination((prevPagination) => ({
      ...prevPagination,
      current: 1,
    }));
  };

const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
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

const handlestsClose = () => setstsModal(false);

    const TrackerrTicket = async () => {
        try {
          const apiUrl = BaseUrl + `api/ticket/all-po-ticket?role=${localStorage.getItem('role')}`;
          const response = await axios.get(apiUrl, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });
          const ticketData = Array.isArray(response.data)
            ? response.data
            : response.data.tickets || [];
          setgettrackerrTicket(ticketData);
        } catch (error) {
          console.error("Error fetching data:", error);
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
            setCheckRes(record?.data?.budgetDetails);
            setCheckAvailable(record?.data?.reason);
            if (record?.data?.isRelated !== null) {
              setIsRelatedCheck(record?.data?.isRelated ? "YES" : "NO");
            }
            setDraftData(record.data);
            setFormData({
              ...record.data,
            });
            const brandData = record?.data?.brand;
            setBrandDataArray(brandData);
            if (Array.isArray(brandData) && brandData.length > 0) {
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


      const historyyticketfunction = async (id) => {
         try {
           const apiUrl = BaseUrl + "api/ticket/getTicketById/" + id;
           const response = await fetch(apiUrl, {
             headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
             },
           });
           const record = await response.json();
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
                const firstBrand = brand?.[0] ? 
                  `${brand[0].detailsBrand || ''} - ${brand[0].poDescription || ''}` : '';
                
                const bulletPoints = brand?.map(item => 
                  `• ${item.detailsBrand || ''} - ${item.poDescription || ''}`
                ).join('\n') || '';
                
                return (
                  <React.Fragment key={`brand-${index}`}>
                    <Tooltip overlayClassName="bomb-tooltip" title={<pre style={{margin: 0, whiteSpace: 'pre-wrap'}}>{bulletPoints}</pre>}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <pre>{firstBrand}</pre>
                        {brand?.length > 1 && (
                          <span style={{
                            backgroundColor: '#52c41a',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            marginBottom: '16px'
                          }}>
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
        ? `Rejected by ${formatStatus(rejectedStatus.name || "")} (${rejectedStatus.username || ""})`
        : `Waiting for ${stage ? formatStatus(stage) : "Unknown"} Approval`}
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


  useEffect(() => {
  const q = searchQuery.toLowerCase();

  const filtered = gettrackerrTicket.filter((item) => {
    const brandMatch = item.brand?.some((b) => {
      const brand = (b.detailsBrand || "").toLowerCase();
      const desc = (b.poDescription || "").toLowerCase();
      const combo = `${brand} ${desc}`; // combined

      return (
        brand.includes(q) ||
        desc.includes(q) ||
        combo.includes(q)
      );
    });

    return (
      item.reqNo?.toLowerCase().includes(q) ||
      item.createdDate?.toLowerCase().includes(q) ||
      item.username?.toLowerCase().includes(q) ||
      item.vendorName?.toLowerCase().includes(q) ||
      item.vendorCode?.toLowerCase().includes(q) ||
      (item.totalBaseValue + "").toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      brandMatch
    );
  });

  setFilteredDatainbox(filtered);
}, [gettrackerrTicket, searchQuery]);


    useEffect(() => {
        TrackerrTicket();
      }, []);

  return (
    <div className="container-fluid main-content">
    <Row>
            <Col xl={6} lg={6} md={6} sm={12} className={"txt_title"}>
            Delivery Planner
           
            </Col>

            <Box
            className="search_box"
            // component="form"
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end", // Align both items to the right
                "& > :not(style)": { mr: "16px", mt:"10px" },
            }}
            noValidate
            autoComplete="off"
            >
            {/* Search Input */}
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
        </Row>
     <Tabs defaultActiveKey="first" onSelect={handleTabSelect}>
      <Tab eventKey="first" title="Tickets">
          <div className="container-fluid table_bg">
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
      />
    </div>
  )
}

export default DeliveryPlanner
