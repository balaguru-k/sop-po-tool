import React, { useState } from "react";
import toast from "react-hot-toast";
import { Modal, Button, Form } from "react-bootstrap";
import { BaseUrl } from "../App.js";

const CustomExportComponent = ({ activeTab } = {}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [dateError, setDateError] = useState("");
  const [exportError, setExportError] = useState("");
  const [isModalExportOpen, setIsModalExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState("export");
  const [selectedPeriod, setSelectedPeriod] = useState(null);
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
    setSelectedPeriod(null);
  };

  const handleExportClose = () => {
    setIsModalExportOpen(false);
    setStartDate("");
    setEndDate("");
    setStartDateError("");
    setEndDateError("");
    setDateError("");
    setExportError("");
    setSelectedPeriod(null);
  };

  const getWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  };

  const getMonthDates = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  };

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    setStartDateError("");
    setEndDateError("");
    setDateError("");
    setExportError("");
    
    if (period === 'week') {
      const dates = getWeekDates();
      setStartDate(dates.start);
      setEndDate(dates.end);
    } else if (period === 'month') {
      const dates = getMonthDates();
      setStartDate(dates.start);
      setEndDate(dates.end);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleValidation = () => {
    if (!selectedPeriod) {
      setExportError("Please select a period");
      return false;
    }

    if (!startDate) {
      setStartDateError("Start date is required");
      return false;
    }

    if (!endDate) {
      setEndDateError("End date is required");
      return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setDateError("Start date cannot be later than end date");
      return false;
    }

    return true;
  };

  const handleExport = async (startDate, endDate) => {
    setIsExporting(true);
    try {
      const endpoint = exportType;
      const apiUrl = `${BaseUrl}api/ticket/${endpoint}?startDate=${encodeURIComponent(
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
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClick = async () => {
    if (handleValidation()) {
      try {
        await handleExport(startDate, endDate);
        setExportError(null);
      } catch (error) {
        toast.error("No tickets found for the selected date range.", {
          duration: 2000,
        });
      }
    }
  };

  const ExportButton = () =>
    ["first", "second", "third", "fourth", "fifth"].includes(activeTab) && (
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
    );

  return (
    <>
      <ExportButton />
      <Modal
        show={isModalExportOpen}
        onHide={!isExporting ? handleExportClose : undefined}
      >
        <Modal.Header
          closeButton={!isExporting}
          className="modal-close-outremark modal-close-out"
        >
          <Modal.Title className="mt-2 mx-3">Select Date Range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {localStorage.getItem("role") === "Budget_Team" && (
            <Form.Group className="mt-3">
              <label>
                Export Type <span className="required-field">*</span>
              </label>
              <div className="d-flex gap-3 ">
                <Form.Check
                  type="radio"
                  id="foh-export"
                  name="exportType"
                  value="foh-export"
                  checked={exportType === "foh-export"}
                  onChange={(e) => setExportType(e.target.value)}
                  label="FOH Export"
                  disabled={isExporting}
                />
                <Form.Check
                  type="radio"
                  id="export"
                  name="exportType"
                  value="export"
                  checked={exportType === "export"}
                  onChange={(e) => setExportType(e.target.value)}
                  label="Export"
                  disabled={isExporting}
                />
              </div>
            </Form.Group>
          )}
          
          <div className="mt-3">
            <label className="mb-3">
              Select Period <span className="required-field">*</span>
            </label>
            <div className="d-flex gap-3 mb-3">
              <div 
                onClick={() => !isExporting && handlePeriodSelect('week')}
                style={{
                  flex: 1,
                  padding: '20px',
                  border: selectedPeriod === 'week' ? '2px solid #4bb543' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  backgroundColor: selectedPeriod === 'week' ? '#f0f8f0' : '#fff',
                  opacity: isExporting ? 0.6 : 1
                }}
              >
                <strong>Week</strong>
              </div>
              <div 
                onClick={() => !isExporting && handlePeriodSelect('month')}
                style={{
                  flex: 1,
                  padding: '20px',
                  border: selectedPeriod === 'month' ? '2px solid #4bb543' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  backgroundColor: selectedPeriod === 'month' ? '#f0f8f0' : '#fff',
                  opacity: isExporting ? 0.6 : 1
                }}
              >
                <strong>Month</strong>
              </div>
              <div 
                onClick={() => !isExporting && handlePeriodSelect('custom')}
                style={{
                  flex: 1,
                  padding: '20px',
                  border: selectedPeriod === 'custom' ? '2px solid #4bb543' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  backgroundColor: selectedPeriod === 'custom' ? '#f0f8f0' : '#fff',
                  opacity: isExporting ? 0.6 : 1
                }}
              >
                <strong>Custom</strong>
              </div>
            </div>
          </div>

          {selectedPeriod === 'custom' && (
            <>
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
                    setStartDateError("");
                    setDateError("");
                    setEndDate("");
                    setExportError("");
                  }}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={isExporting}
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
                  disabled={!startDate || isExporting}
                  className="mb-3 mt-1"
                />
                {endDateError && <p className="text-danger">{endDateError}</p>}
              </Form.Group>
            </>
          )}
          
          {dateError && <p className="text-danger">{dateError}</p>}
          {exportError && <p className="text-danger mt-3">{exportError}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleExportClose}
            disabled={isExporting}
            className="btn_cancel mx-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="remarksbtns mx-2"
            onClick={handleExportClick}
            disabled={isExporting}
            style={{
              backgroundColor: isExporting ? "#6c757d" : "#4bb543",
              borderColor: isExporting ? "#6c757d" : "#4bb543",
              color: "#fff",
            }}
          >
            {isExporting ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></div>
                Exporting...
              </>
            ) : (
              "Export"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CustomExportComponent;
