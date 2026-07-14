import React, { useState } from "react";
import { Nav } from "react-bootstrap";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import "./CollapsibleTabHeader.css";

const CollapsibleTabHeader = ({ onTabSelect, activeTab, tabKeys = [] }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const allTabs = {
    first: "INBOX",
    second: "HOLD",
    third: "DRAFT",
    fourth: "REJECTED",
    fifth: "COMPLETED",
    deleted: "DELETED",
    sixth: "MTTP",
    seventh: "MTTP HOLD",
    eighth: "MTTP DRAFT",
    ninth: "MTTP REJECTED",
    tenth: "MTTP COMPLETED",
    mailTemplate: "MAIL TEMPLATE",
    deleted: "DELETED",
  };

  const tabs = tabKeys.map((key) => ({
    key,
    title: allTabs[key],
  }));

  const half = Math.ceil(tabs.length / 2);
  const pages = [tabs.slice(0, half), tabs.slice(half)];

  const visibleTabs = pages[currentPage] || [];

  const hasNext = currentPage < pages.length - 1;
  const hasPrev = currentPage > 0;

  return (
    <div className="collapsible-tab-header">
      <div className="tab-nav">
        <Nav variant="tabs">
          {visibleTabs.map((tab) => (
            <Nav.Item key={tab.key}>
              <Nav.Link
                active={activeTab === tab.key}
                onClick={() => onTabSelect(tab.key)}
              >
                {tab.title}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        <div className="arrow-buttons">
          {hasPrev && (
            <button
              className="expand-arrow rotated"
              onClick={() => {
                const prevPage = currentPage - 1;
                setCurrentPage(prevPage);
                // If first tab becomes visible on previous page, set it as active
                const prevPageTabs = pages[prevPage] || [];
                if (prevPageTabs.some(tab => tab.key === 'first')) {
                  onTabSelect('first');
                }
              }}
            >
              <KeyboardArrowRightIcon />
            </button>
          )}

          {hasNext && (
            <button
              className="expand-arrow"
              onClick={() => {
                const nextPage = currentPage + 1;
                setCurrentPage(nextPage);
                // If sixth tab becomes visible on next page, set it as active
                const nextPageTabs = pages[nextPage] || [];
                if (nextPageTabs.some(tab => tab.key === 'sixth')) {
                  onTabSelect('sixth');
                }
              }}
            >
              <KeyboardArrowRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleTabHeader;