import React, { useState, useEffect } from "react";
import Header from "../views/general/Header";
import { Outlet } from "react-router-dom";
import LinearProgress from "@mui/material/LinearProgress";
import ChatBot from "../components/ChatBot";


function MainLayout() {
  const [loading, setLoading] = useState(false);
  const [showMarquee, setShowMarquee] = useState(true);
  const [hoverBanner, setHoverBanner] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {loading && <LinearProgress />}
      <Header />
      {showMarquee && (
        <div
          onMouseEnter={() => setHoverBanner(true)}
          onMouseLeave={() => setHoverBanner(false)}
          style={{
            backgroundColor: '#d6002a',
            color: '#ffffff',
            borderBottom: '1px solid #a80021',
            whiteSpace: 'nowrap',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            height: '32px',
          }}
        >
          {/* Left Alert badge */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            margin: '0 8px',
            zIndex: 1,
          }}>
            📢 Alert
          </div>

          {/* Scrolling text area — clipped between left badge and right button */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}>
            <div
              style={{
                display: 'inline-block',
                paddingLeft: '100%',
                fontWeight: '500',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
              className="marquee-text"
            >
              ⚠️ &nbsp; Kindly change your tool password if you are still using the default password (1to8) for security reasons. Please update it immediately using the "Forgot Password" option available on the login page.
 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ⚠️ &nbsp; Kindly change your tool password if you are still using the default password (1to8) for security reasons. Please update it immediately using the "Forgot Password" option available on the login page.
            </div>
          </div>

          {/* Right close button — only on hover */}
          <div style={{ flexShrink: 0, width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hoverBanner && (
              <button
                onClick={() => setShowMarquee(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                title="Close"
              >✕</button>
            )}
          </div>

          <style>{`
            @keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
            .marquee-text { animation: marqueeScroll 20s linear infinite; }
            .marquee-text:hover { animation-play-state: paused; cursor: pointer; }
          `}</style>
        </div>
      )}

      <div>
        <Outlet />
      </div>
      <ChatBot />
    </div>
  );
}
export default MainLayout;
