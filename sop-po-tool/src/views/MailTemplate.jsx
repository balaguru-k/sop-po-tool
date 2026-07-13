import React, { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Box, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import MailTemplateList from "../components/MailTemplateList.jsx";
import TipTapEditor from "../components/TipTapEditor.jsx";
import { useMailTemplates } from "../hooks/useMailTemplates.js";

const MailTemplate = () => {
  const [showMailTemplateModal, setShowMailTemplateModal] = useState(false);
  const [mailTemplateData, setMailTemplateData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSendMode, setIsSendMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { mailTemplates, loading, refetch: refetchMailTemplates } = useMailTemplates(true);

  const filteredTemplates = mailTemplates.filter((template) => {
    const query = searchQuery.toLowerCase();
    const toMatch = template.to?.join(", ").toLowerCase().includes(query);
    const subjectMatch = template.subject?.toLowerCase().includes(query);
    const formattedDate = new Date(template.createdAt).toLocaleDateString('en-GB').toLowerCase();
    const dateMatch = formattedDate.includes(query);
    return toMatch || subjectMatch || dateMatch;
  });

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTemplateCardClick = (template) => {
    setSelectedTemplate(template);
    setMailTemplateData({
      id: template.id,
      to: template.to.join(", "),
      cc: template.cc.join(", "),
      bcc: template.bcc.join(", "),
      subject: template.subject,
      body: template.content,
    });
    setIsSendMode(false);
    setShowMailTemplateModal(true);
  };

  const handleSendClick = (template) => {
    setSelectedTemplate(template);
    setMailTemplateData({
      id: template.id,
      to: template.to.join(", "),
      cc: template.cc.join(", "),
      bcc: template.bcc.join(", "),
      subject: template.subject,
      body: template.content,
    });
    setIsSendMode(true);
    setShowMailTemplateModal(true);
  };

  return (
    <div>
      {successMessage && (
        <div className="success-message-container">
          <div className="success-message">{successMessage}</div>
        </div>
      )}
      <div className="container-fluid main-content-mail">
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
          <Box className="txt_title">
            Mail Template
          </Box>
          <Box>
            <input
              className="req_btn"
              type="button"
              onClick={() => setShowMailTemplateModal(true)}
              value="Create Mail Template"
            />
          </Box>
        </Box>
        <Box
          className="search_box"
          component="form"
          sx={{
            display: "flex",
            flexDirection: "row-reverse",
            "& > :not(style)": { width: "30ch" },
            paddingLeft: "0px",
            mb: 2,
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
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {searchQuery ? (
                    <IconButton
                      onClick={() => setSearchQuery("")}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  ):(
                  <SearchIcon className="search_icon" />
                  )}
                </InputAdornment>
              ),
            }}
            sx={{
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
        <div className="container-fluid table_bg">
          <MailTemplateList
            templates={paginatedTemplates}
            onTemplateClick={handleTemplateCardClick}
            onSendClick={handleSendClick}
            isLoading={loading}
          />
          {!loading && filteredTemplates.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "end", alignItems: "center", gap: 2, mt: 3, mb: 2 }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? '#e2e8f0' : 'linear-gradient(135deg, #1bf34a 0%, #0ec93d 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                Previous
              </button>
              <span style={{ fontWeight: '600', color: '#2d3748' }}>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? '#e2e8f0' : 'linear-gradient(135deg, #1bf34a 0%, #0ec93d 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                Next
              </button>
            </Box>
          )}
        </div>
      </div>
      <TipTapEditor
        show={showMailTemplateModal}
        onHide={() => {
          setShowMailTemplateModal(false);
          setIsSendMode(false);
        }}
        mailTemplateData={mailTemplateData}
        setMailTemplateData={setMailTemplateData}
        templateId={mailTemplateData.id}
        isSendMode={isSendMode}
        onSuccess={(message, isError) => {
          if (!isError) {
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(null), 1000);
            refetchMailTemplates();
          }
        }}
      />
    </div>
  );
};

export default MailTemplate;
