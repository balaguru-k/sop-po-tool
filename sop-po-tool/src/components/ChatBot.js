import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Lottie from "lottie-react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import chatbotAnimation from "../assets/images/chatbot.json";
import { BaseUrl } from "../App";
import "./ChatBot.css";
import { useTicketFlow } from "./ChatBotTicketFlow";

const QUICK_ACTIONS = [
  { label: "➕ Create Ticket", value: "create ticket" },
  { label: "📊 Summary", value: "summary" },
  { label: "📋 Pending", value: "pending" },
  { label: "✅ Completed", value: "completed" },
  { label: "🚫 Rejected", value: "rejected" },
  { label: "👤 My Role", value: "my role" },
  { label: "🔄 PO Process", value: "process" },
];

// --- Knowledge Base: project-aware context ---
const KNOWLEDGE_BASE = [
  {
    keywords: ["what is this", "about this", "what does this", "this tool", "this app", "this project", "this system", "purpose", "what is sop", "what is po tool", "sop po"],
    answer: `📌 This is the SOP PO Tool — a Purchase Order management system built for CavinKare.\n\nIt handles the complete PO lifecycle:\n• Request creation by Requestors\n• Multi-level approvals (Business Approver → Screening → Budget → Head)\n• Budget release & PO creation in SAP\n• PO checking & final release\n• Dashboard analytics & tracking\n\nType "process" to see the full workflow.`,
  },
  {
    keywords: ["feature", "features", "what can", "capabilities", "functionality"],
    answer: `🚀 Key Features:\n\n• Multi-role PO workflow (9 stages)\n• Dashboard with real-time stats & charts\n• Marketing & Non-Marketing ticket types\n• Ticket tracking by REQ number\n• Budget management & release\n• SAP integration for PO creation\n• Email notifications & templates\n• Excel file upload for bulk requests\n• Global distribution view\n• TAT (Turn Around Time) analytics\n• Role-based access control`,
  },
  {
    keywords: ["role", "roles", "user role", "who can", "access", "permission", "types of user"],
    answer: `👥 User Roles in the system:\n\n1. Requestor — Creates PO requests\n2. Business Approver — Approves/rejects requests\n3. PO Screening — Validates request details\n4. Budget Team — Checks & manages budget\n5. Business Head (Division Head) — Final approval\n6. Budget Release Team — Releases allocated budget\n7. PO Maker — Creates PO in SAP system\n8. PO Checker — Verifies PO accuracy\n9. PO Release — Final PO release\n10. Delivery Planner — Plans delivery\n11. Admin — System administration\n\nType "my role" to see your current role.`,
  },
  {
    keywords: ["how to create", "create po", "create request", "new request", "raise request", "submit request", "raise po"],
    answer: `📝 To create a new PO request:\n\n1. Log in as a Requestor\n2. Go to the Request page\n3. Fill in vendor details, items, and values\n4. Upload supporting documents if needed\n5. Submit the request\n\nThe request will then flow through the approval stages automatically.`,
  },
  {
    keywords: ["how to approve", "approve request", "approval", "reject request", "how to reject"],
    answer: `✅ To approve/reject a request:\n\n1. Log in with your approver role\n2. Check your inbox for pending tickets\n3. Review the ticket details\n4. Click Approve or Reject\n5. Add comments if needed\n\nThe ticket moves to the next stage on approval, or back to the requestor on rejection.`,
  },
  {
    keywords: ["marketing", "non marketing", "brand", "non brand", "ticket type", "nonbrand"],
    answer: `📂 Ticket Types:\n\n• Marketing (Brand) — POs related to brand/marketing activities\n• Non-Marketing (Non-Brand) — POs for non-marketing purchases\n\nYou can switch between them using the toggle on the Dashboard. Your available types depend on your user configuration.`,
  },
  {
    keywords: ["dashboard", "charts", "analytics", "graph", "report", "stats"],
    answer: `📊 Dashboard Features:\n\n• Status counts (Pending, Completed, Rejected, On Hold)\n• PO Status Distribution (Doughnut chart)\n• Monthly PO Trends (Bar chart)\n• Top 5 Tickets by value\n• TAT Analysis (Polar chart)\n• Global Distribution (Globe view)\n• Filters: Date range, Profit Centre, Vendor, Quarter\n\nType "summary" to get your current stats.`,
  },
  {
    keywords: ["tat", "turn around", "turnaround", "time taken", "how long", "processing time"],
    answer: `⏱️ TAT (Turn Around Time):\n\nTAT measures how quickly tickets are processed:\n• 0D — Completed same day\n• 1D — Completed in 1 day\n• 2-3D — Completed in 2-3 days\n• 4D+ — Took more than 4 days\n\nYou can view TAT analytics on the Dashboard.`,
  },
  {
    keywords: ["sap", "sap integration", "po number", "sap po"],
    answer: `🔗 SAP Integration:\n\nThe PO Maker creates the PO in SAP after all approvals are complete. The SAP PO number is then linked back to the ticket for tracking. The PO Checker verifies the SAP entry before final release.`,
  },
  {
    keywords: ["upload", "excel", "file upload", "bulk", "sample file", "template"],
    answer: `📁 File Upload:\n\nYou can upload Excel files for bulk PO requests. A sample template is available for download. Make sure your file follows the required format with correct column headers.`,
  },
  {
    keywords: ["notification", "email", "mail", "alert", "notify"],
    answer: `📧 Notifications:\n\nThe system sends email notifications at each stage:\n• When a ticket is assigned to you\n• When a ticket is approved/rejected\n• When action is required\n\nEmail templates can be managed by admins.`,
  },
  {
    keywords: ["filter", "search", "find ticket", "search ticket"],
    answer: `🔍 Finding Tickets:\n\n• Use the Dashboard filters (Date, Quarter, Profit Centre, Vendor)\n• Search by REQ number — just type "REQ-1234"\n• Type "my tickets" to see your inbox\n• Type "recent" for latest tickets`,
  },
  {
    keywords: ["budget", "budget team", "budget release", "budget check"],
    answer: `💰 Budget Management:\n\n• Budget Team reviews and checks available budget\n• They can put tickets on Hold if budget is insufficient\n• Budget Release Team releases the approved budget\n• Budget status is tracked throughout the workflow`,
  },
  {
    keywords: ["hold", "on hold", "why hold", "holder", "held"],
    answer: `⏸️ On Hold Tickets:\n\nTickets can be put on hold by:\n• Budget Team — when budget needs review\n• PO Maker — when SAP details need clarification\n\nHeld tickets remain in the respective team's queue until resolved. Type "hold" to see the current hold count.`,
  },
  {
    keywords: ["login", "log in", "sign in", "password", "forgot password", "reset password"],
    answer: `🔐 Login & Access:\n\n• Use your company credentials to log in\n• If you forgot your password, use the "Forgot Password" link\n• You'll receive a reset link via email\n• Contact your admin if you're locked out`,
  },
  {
    keywords: ["vendor", "vendor code", "vendor name", "supplier"],
    answer: `🏢 Vendor Information:\n\nEach PO request is linked to a vendor (supplier). Vendors are identified by:\n• Vendor Code (from SAP)\n• Vendor Name\n\nYou can filter dashboard data by vendor using the Vendor filter.`,
  },
  {
    keywords: ["division", "profit centre", "profit center", "department"],
    answer: `🏛️ Divisions & Profit Centres:\n\nTickets are organized by division/profit centre. You can filter the dashboard by profit centre to see division-specific stats. The Division Head (Business Head) approves tickets for their division.`,
  },
  {
    keywords: ["admin", "administration", "manage", "settings"],
    answer: `⚙️ Admin Features:\n\nAdmins can:\n• Manage user roles and access\n• Configure email templates\n• View all tickets across roles\n• Manage system settings\n• Access the full admin panel`,
  },
];

const INTENTS = [
  {
    keys: ["pending count", "how many pending"],
    type: "DASHBOARD_STATS",
    field: "Pending",
    reply: (c) => `📋 Pending count: ${c}`,
  },
  {
    keys: ["completed count", "how many completed", "count completed"],
    type: "DASHBOARD_STATS",
    field: "Completed",
    reply: (c) => `✅ Completed count: ${c}`,
  },
  {
    keys: ["reject count", "how many rejected", "count rejected"],
    type: "DASHBOARD_STATS",
    field: "Rejected",
    reply: (c) => `🚫 Rejected count: ${c}`,
  },
  {
    keys: ["hold count", "on hold count", "how many hold", "how many on hold"],
    type: "DASHBOARD_STATS",
    field: "Hold",
    reply: (c) => `⏸️ On Hold count: ${c}`,
  },
  {
    keys: ["all status", "overall", "summary", "stats", "total", "overview", "count"],
    type: "DASHBOARD_ALL",
  },
  {
    keys: ["rejected", "reject", "rejected tickets", "show rejected", "list rejected", "rejected by"],
    type: "REJECTED_TICKETS_LIST",
  },
  {
    keys: ["completed", "completed tickets", "done", "finished", "show completed"],
    type: "COMPLETED_TICKETS_LIST",
  },
  {
    keys: ["pending", "pending tickets", "inbox", "my tickets", "my requests", "assigned to me", "show pending"],
    type: "MY_TICKETS",
  },
  {
    keys: ["status of", "ticket status", "req status", "track", "where is", "check ticket"],
    type: "TICKET_STATUS",
  },
  {
    keys: ["my role", "what is my role", "who am i", "current role"],
    type: "MY_ROLE",
  },
  {
    keys: ["recent", "latest", "last ticket", "recent tickets", "latest tickets"],
    type: "RECENT_TICKETS",
  },
  {
    keys: ["process", "workflow", "po process", "po flow", "stages", "how it works", "flow", "steps"],
    type: "PROCESS",
  },
  {
    keys: ["hi", "hello", "hey", "hii", "good morning", "good evening", "good afternoon", "hola", "sup"],
    type: "GREETING",
  },
  {
    keys: ["help", "what can you do", "commands", "options", "menu"],
    type: "HELP",
  },
  {
    keys: ["thank", "thanks", "thank you", "ok thanks", "thx", "ty"],
    type: "THANKS",
  },
  {
    keys: ["mttp", "mttp pending", "show mttp", "mttp tickets"],
    type: "MTTP_PENDING_LIST",
  },
  {
    keys: ["mttp completed", "completed mttp", "mttp done", "done mttp"],
    type: "MTTP_COMPLETED_LIST",
  },
  {
    keys: ["mttp rejected", "rejected mttp", "mttp reject"],
    type: "MTTP_REJECTED_LIST",
  },
  {
    keys: ["create ticket", "new request", "raise request", "create po", "new po", "create"],
    type: "CREATE_TICKET"
  }
];

const WELCOME_MSG = "👋 Hello! I'm your PO Assistant.\nI can help with ticket stats, tracking, project info, and more.\nTap a quick action or ask me anything!";

const HELP_MSG = `🤖 Here's what I can do:

📊 Counts & Stats
• "summary" — Full dashboard overview
• "pending" — Pending ticket count
• "completed" — Completed count
• "rejected" — Rejected count
• "hold count" — On Hold count

🔍 Ticket Tracking
• "REQ-1234" — Track specific ticket
• "my tickets" — Your inbox tickets
• "recent" — Latest 5 tickets

👤 Info
• "my role" — Your current role
• "process" — PO workflow stages

💡 Project Questions
• "what is this tool?" — About the system
• "features" — System capabilities
• "roles" — All user roles
• "how to create a PO?" — Step-by-step guide
• Ask anything about the project!`;

const PROCESS_MSG = `🔄 PO Workflow Stages:

1️⃣ Requestor — Creates PO request
2️⃣ Business Approver — Approves/Rejects
3️⃣ PO Screening — Validates request
4️⃣ Budget Team — Checks budget
5️⃣ Business Head — Final approval
6️⃣ Budget Release Team — Releases budget
7️⃣ PO Maker — Creates PO in SAP
8️⃣ PO Checker — Verifies PO
9️⃣ PO Release — Final release
✅ Completed`;

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: WELCOME_MSG, showQuickActions: true, time: now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const conversationContext = useRef([]);
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const [fileAtt, setFileAtt] = useState(null);
  const [autocompleteSearch, setAutocompleteSearch] = useState("");
  const [datePickerVal, setDatePickerVal] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  // ── Draggable: chat window ──────────────────────────────────────────────
  const [winPos, setWinPos] = useState(null); // { x, y } or null = use CSS default
  const winDrag = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false });
  const chatWindowRef = useRef(null);

  const onWindowPointerDown = useCallback((e) => {
    // Only drag by header; ignore clicks on buttons inside header
    if (e.target.closest('button')) return;
    e.preventDefault();
    const rect = chatWindowRef.current?.getBoundingClientRect();
    if (!rect) return;
    winDrag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
    };
    chatWindowRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onWindowPointerMove = useCallback((e) => {
    if (!winDrag.current.active) return;
    const dx = e.clientX - winDrag.current.startX;
    const dy = e.clientY - winDrag.current.startY;
    if (!winDrag.current.moved && Math.hypot(dx, dy) > 4) winDrag.current.moved = true;
    if (!winDrag.current.moved) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const rect = chatWindowRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : 395;
    const h = rect ? rect.height : 450;
    const newX = Math.min(Math.max(winDrag.current.origX + dx, 0), W - w);
    const newY = Math.min(Math.max(winDrag.current.origY + dy, 0), H - h);
    setWinPos({ x: newX, y: newY });
  }, []);

  const onWindowPointerUp = useCallback(() => {
    winDrag.current.active = false;
  }, []);

  // Reset position when window closes so it reopens at default position
  useEffect(() => {
    if (!open) setWinPos(null);
  }, [open]);

  // ── Draggable: FAB button ───────────────────────────────────────────────
  const [fabPos, setFabPos] = useState(null); // { x, y } or null = use CSS default
  const fabDrag = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false });
  const fabRef = useRef(null);

  const onFabPointerDown = useCallback((e) => {
    e.preventDefault();
    const rect = fabRef.current?.getBoundingClientRect();
    if (!rect) return;
    fabDrag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
    };
    fabRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onFabPointerMove = useCallback((e) => {
    if (!fabDrag.current.active) return;
    const dx = e.clientX - fabDrag.current.startX;
    const dy = e.clientY - fabDrag.current.startY;
    if (!fabDrag.current.moved && Math.hypot(dx, dy) > 6) fabDrag.current.moved = true;
    if (!fabDrag.current.moved) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const rect = fabRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : 130;
    const h = rect ? rect.height : 130;
    const newX = Math.min(Math.max(fabDrag.current.origX + dx, 0), W - w);
    const newY = Math.min(Math.max(fabDrag.current.origY + dy, 0), H - h);
    setFabPos({ x: newX, y: newY });
  }, []);

  const onFabPointerUp = useCallback((e) => {
    if (!fabDrag.current.moved) {
      // It was a click, not a drag — open the chat
      setOpen(true);
    }
    fabDrag.current.active = false;
  }, []);

  const addBot = useCallback((text, showQuickActions = false, options = []) => {
    setMessages((prev) => [...prev, { from: "bot", text, showQuickActions, options, time: now() }]);
  }, []);

  const { isFlowActive, flowState, startFlow, processFlowInput, goBackToDateStep } = useTicketFlow(addBot, BaseUrl, () => localStorage.getItem("accessToken"));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      if (inputRef.current) inputRef.current.focus();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 0);
    }
  }, [open]);

  const handleBodyScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 60);
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const getToken = () => localStorage.getItem("accessToken");
  const getRole = () => localStorage.getItem("role");
  const getName = () => localStorage.getItem("name") || "User";

  // --- Fuzzy intent detection with scoring ---
  const detectIntent = (text) => {
    const lower = text.toLowerCase().trim();

    // Direct REQ number match
    if (/req[-\s]?\d+/i.test(lower)) return { type: "TICKET_STATUS", raw: lower };

    let bestMatch = null;
    let bestScore = 0;

    for (const intent of INTENTS) {
      for (const key of intent.keys) {
        let score = 0;
        if (lower === key) {
          score = 10; // exact match
        } else if (lower.includes(key)) {
          score = 5 + key.length / lower.length; // longer keyword match = better
        } else if (key.includes(lower) && lower.length >= 3) {
          score = 3; // partial reverse match
        } else {
          // word overlap scoring
          const inputWords = lower.split(/\s+/);
          const keyWords = key.split(/\s+/);
          const overlap = inputWords.filter((w) => keyWords.includes(w)).length;
          if (overlap > 0) score = overlap * 2;
        }
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { ...intent, raw: lower };
        }
      }
    }

    if (bestScore >= 2) return bestMatch;
    return { type: "UNKNOWN", raw: lower };
  };

  // --- Knowledge base search ---
  const searchKnowledge = (text) => {
    const lower = text.toLowerCase().trim();
    let bestEntry = null;
    let bestScore = 0;

    for (const entry of KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of entry.keywords) {
        if (lower.includes(kw)) {
          score += 5 + kw.length;
        } else {
          const inputWords = lower.split(/\s+/);
          const kwWords = kw.split(/\s+/);
          const overlap = inputWords.filter((w) => kwWords.some((k) => k.includes(w) || w.includes(k))).length;
          if (overlap > 0) score += overlap * 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    return bestScore >= 4 ? bestEntry?.answer : null;
  };

  const extractReqNo = (text) => {
    const match = text.match(/req[-\s]?(\d+)/i);
    return match ? `REQ-${match[1]}` : null;
  };

  // --- API calls with specific error handling ---
  const getTicketType = () => {
    const stored = localStorage.getItem("selectedTicketTab");
    if (stored === "Brand") return "Brand";
    if (stored === "Non Brand" || stored === "NonBrand") return "NonBrand";
    try {
      const userType = JSON.parse(localStorage.getItem("userType") || "[]");
      if (userType.includes("NonBrand") && !userType.includes("Brand")) return "NonBrand";
    } catch (e) { }
    return "Brand";
  };

  const fetchDashboardStats = async () => {
    const token = getToken();
    if (!token) throw new Error("AUTH_EXPIRED");
    const tType = getTicketType();
    const url = `${BaseUrl}dashboard/stats?startDate=&endDate=&division=&quarter=&vendorCode=&ticketType=${tType}&myself=false`;
    try {
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) throw new Error("AUTH_EXPIRED");
      if (err.code === "ECONNABORTED" || !err.response) throw new Error("NETWORK_ERROR");
      throw new Error("API_ERROR");
    }
  };

  const fetchListsFromApi = async () => {
    const token = getToken();
    if (!token) throw new Error("AUTH_EXPIRED");
    const role = getRole();
    const tType = getTicketType();

    try {
      const hdrs = { headers: { Authorization: `Bearer ${token}` } };

      const pendingReq = axios.get(`${BaseUrl}api/ticket/getAllByCommonStage/${role}?ticketType=${tType}`, hdrs).catch(() => ({ data: [] }));
      const compReq = axios.get(`${BaseUrl}api/ticket/getAllComplticketsByStage/${role}?ticketType=${tType}`, hdrs).catch(() => ({ data: [] }));
      const rejReq = role !== "Requestor"
        ? axios.get(`${BaseUrl}api/ticket/rejected-tickets?stage=${role}&ticketType=${tType}`, hdrs).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      const [pRes, cRes, rRes] = await Promise.all([pendingReq, compReq, rejReq]);

      let pending = Array.isArray(pRes.data) ? pRes.data : [];
      let completed = Array.isArray(cRes.data) ? cRes.data : [];
      let rejected = Array.isArray(rRes.data) ? rRes.data : [];

      if (role === "Requestor") {
        rejected = pending.filter(t => t.status?.toLowerCase() === "reject" || t.status?.toLowerCase() === "rejected");
        pending = pending.filter(t => t.status?.toLowerCase() !== "reject" && t.status?.toLowerCase() !== "rejected");
      }

      return { pending, completed, rejected };
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) throw new Error("AUTH_EXPIRED");
      console.error("fetchLists error:", err);
      return { pending: [], completed: [], rejected: [] };
    }
  };

  const fetchMttpListsFromApi = async () => {
    const token = getToken();
    if (!token) return { pending: [], completed: [], rejected: [] };
    const role = getRole();

    try {
      const hdrs = { headers: { Authorization: `Bearer ${token}` } };

      const pReq = axios.get(`${BaseUrl}mttp-ticket/by-stage?stage=${role}`, hdrs).catch(() => ({ data: [] }));
      const cReq = role === "Requestor"
        ? axios.get(`${BaseUrl}mttp-ticket/completed`, hdrs).catch(() => ({ data: [] }))
        : axios.get(`${BaseUrl}mttp-ticket/get-all-completed-ticket?stage=${role}`, hdrs).catch(() => ({ data: [] }));
      const rReq = role !== "Requestor"
        ? axios.get(`${BaseUrl}mttp-ticket/rejected-tickets?stage=${role}`, hdrs).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      const [pRes, cRes, rRes] = await Promise.all([pReq, cReq, rReq]);

      let pData = pRes.data?.data || pRes.data;
      let cData = cRes.data?.data || cRes.data;
      let rData = rRes.data?.data || rRes.data;

      let pending = Array.isArray(pData) ? pData : [];
      let completed = Array.isArray(cData) ? cData : [];
      let rejected = Array.isArray(rData) ? rData : [];

      if (role === "Requestor") {
        rejected = pending.filter(t => t.status?.toLowerCase() === "reject" || t.status?.toLowerCase() === "rejected");
        pending = pending.filter(t => t.status?.toLowerCase() !== "reject" && t.status?.toLowerCase() !== "rejected");
      }

      return { pending, completed, rejected };
    } catch (err) {
      console.error("fetchMttpLists error:", err);
      return { pending: [], completed: [], rejected: [] };
    }
  };

  const formatStage = (stage) =>
    stage?.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || "Unknown";

  const getErrorMessage = (err) => {
    const msg = err?.message || "";
    if (msg === "AUTH_EXPIRED") return "🔒 Your session has expired. Please log in again to continue.";
    if (msg === "NETWORK_ERROR") return "🌐 Unable to reach the server. Please check your connection and try again.";
    return "⚠️ Something went wrong while fetching data. Please try again in a moment.";
  };

  const processMessage = async (text) => {
    setLoading(true);
    conversationContext.current.push(text);

    try {
      const intent = detectIntent(text);

      switch (intent.type) {
        case "GREETING":
          addBot(`👋 Hey ${getName()}! How can I help you today?\n\nYou can ask about tickets, stats, the PO process, or anything about this tool.`, true);
          break;

        case "HELP":
          addBot(HELP_MSG);
          break;

        case "THANKS":
          addBot("😊 You're welcome! Let me know if you need anything else.", true);
          break;

        case "CREATE_TICKET":
          startFlow();
          break;

        case "PROCESS":
          addBot(PROCESS_MSG);
          break;

        case "MY_ROLE": {
          const role = getRole();
          const name = getName();
          addBot(`👤 ${name}\n• Role: ${formatStage(role)}\n• Type: ${localStorage.getItem("selectedTicketTab") || "Brand"}`);
          break;
        }

        case "DASHBOARD_STATS": {
          const lists = await fetchListsFromApi();
          let count = 0;
          if (intent.field === "Pending") count = lists.pending.length;
          else if (intent.field === "Completed") count = lists.completed.length;
          else if (intent.field === "Rejected") count = lists.rejected.length;
          else if (intent.field === "Hold") {
            const data = await fetchDashboardStats();
            count = data.statusCounts?.Hold ?? 0;
          }
          addBot(intent.reply(count));
          break;
        }

        case "DASHBOARD_ALL": {
          const lists = await fetchListsFromApi();
          const data = await fetchDashboardStats();
          const holdCnt = data.statusCounts?.Hold ?? 0;
          const total = lists.pending.length + lists.completed.length + lists.rejected.length + holdCnt;
          addBot(`📊 Dashboard (Current View Summary):\n• Pending: ${lists.pending.length}\n• Completed: ${lists.completed.length}\n• Rejected: ${lists.rejected.length}\n• On Hold: ${holdCnt}\n\n📈 Total: ${total}`);
          break;
        }

        case "REJECTED_TICKETS_LIST": {
          const lists = await fetchListsFromApi();
          const tickets = lists.rejected;
          if (tickets.length === 0) {
            addBot("📭 No rejected tickets found in your view.");
          } else {
            const result = tickets.slice(0, 5).map((t) => {
              const rejectedStatusObj = t.historyList?.filter(e => e.status?.toLowerCase() === "reject")?.slice(-1)[0];
              const displayStatus = t.status === "Reject" && rejectedStatusObj ? `Rejected by ${formatStage(rejectedStatusObj.name)}` : (t.status === "Reject" ? "Rejected" : formatStage(t.stage));
              return `• ${t.reqNo} — ${displayStatus}`;
            }).join("\n");
            addBot(`🚫 Rejected Tickets (${tickets.length} total):\n${result}${tickets.length > 5 ? `\n\n...and ${tickets.length - 5} more` : ""}`);
          }
          break;
        }

        case "COMPLETED_TICKETS_LIST": {
          const lists = await fetchListsFromApi();
          const tickets = lists.completed;
          if (tickets.length === 0) {
            addBot("📭 No completed tickets found in your view.");
          } else {
            const result = tickets.slice(0, 5).map((t) => `• ${t.reqNo} — ${formatStage(t.stage)} — ₹${t.totalBaseValue?.toLocaleString("en-IN") || "0"}`).join("\n");
            addBot(`✅ Completed Tickets (${tickets.length} total):\n${result}${tickets.length > 5 ? `\n\n...and ${tickets.length - 5} more` : ""}`);
          }
          break;
        }

        case "MY_TICKETS": {
          const lists = await fetchListsFromApi();
          const tickets = lists.pending;
          if (tickets.length === 0) {
            addBot("📭 No tickets in your pending inbox right now.");
          } else {
            const result = tickets.slice(0, 5).map((t) => `• ${t.reqNo} — ${formatStage(t.stage)} — ₹${t.totalBaseValue?.toLocaleString("en-IN") || "0"}`).join("\n");
            addBot(`📋 Your Pending Inbox (${tickets.length} total):\n${result}${tickets.length > 5 ? `\n\n...and ${tickets.length - 5} more` : ""}`);
          }
          break;
        }

        case "RECENT_TICKETS": {
          const lists = await fetchListsFromApi();
          const tickets = lists.pending;
          if (tickets.length === 0) {
            addBot("📭 No recent pending tickets found.");
          } else {
            const result = tickets.slice(0, 5).map((t) => `• ${t.reqNo} | ${t.vendorName || "-"} | ${formatStage(t.stage)}`).join("\n");
            addBot(`🕐 Recent Tickets:\n${result}`);
          }
          break;
        }

        case "MTTP_PENDING_LIST": {
          const mttpLists = await fetchMttpListsFromApi();
          const tickets = mttpLists.pending;
          if (tickets.length === 0) {
            addBot("📭 No MTTP pending tickets found.");
          } else {
            const result = tickets.slice(0, 5).map((t) => `• ${t.reqNo || "-"} — ${formatStage(t.stage)}`).join("\n");
            addBot(`📋 MTTP Pending Tickets (${tickets.length} total):\n${result}${tickets.length > 5 ? `\n\n...and ${tickets.length - 5} more` : ""}`);
          }
          break;
        }

        case "MTTP_COMPLETED_LIST": {
          const mttpLists = await fetchMttpListsFromApi();
          const tickets = mttpLists.completed;
          if (tickets.length === 0) {
            addBot("📭 No MTTP completed tickets found.");
          } else {
            const result = tickets.slice(0, 5).map((t) => `• ${t.reqNo || "-"} — ${formatStage(t.stage)}`).join("\n");
            addBot(`✅ MTTP Completed Tickets (${tickets.length} total):\n${result}${tickets.length > 5 ? `\n\n...and ${tickets.length - 5} more` : ""}`);
          }
          break;
        }

        case "MTTP_REJECTED_LIST": {
          const mttpLists = await fetchMttpListsFromApi();
          const tickets = mttpLists.rejected;
          if (tickets.length === 0) {
            addBot("📭 No MTTP rejected tickets found.");
          } else {
            const result = tickets.slice(0, 5).map((t) => {
              const rejectedStatusObj = t.historyList?.filter(e => e.status?.toLowerCase() === "reject")?.slice(-1)[0];
              const displayStatus = t.status === "Reject" && rejectedStatusObj ? `Rejected by ${formatStage(rejectedStatusObj.name)}` : (t.status === "Reject" ? "Rejected" : formatStage(t.stage));
              return `• ${t.reqNo || "-"} — ${displayStatus}`;
            }).join("\n");
            addBot(`🚫 MTTP Rejected Tickets (${tickets.length} total):\n${result}${tickets.length > 5 ? `\n\n...and ${tickets.length - 5} more` : ""}`);
          }
          break;
        }

        case "TICKET_STATUS": {
          const reqNo = extractReqNo(intent.raw);
          if (!reqNo) {
            addBot("🔍 Please provide a ticket number.\nExample: REQ-1234 or just type the number like 1234");
          } else {
            const lists = await fetchListsFromApi();
            const mttpLists = await fetchMttpListsFromApi();
            const allTickets = [
              ...lists.pending, ...lists.completed, ...lists.rejected,
              ...mttpLists.pending, ...mttpLists.completed, ...mttpLists.rejected
            ];

            const ticket = allTickets.find((t) => t.reqNo?.toUpperCase() === reqNo.toUpperCase());

            if (ticket) {
              const rejectedStatusObj = ticket.historyList?.filter(e => e.status?.toLowerCase() === "reject")?.slice(-1)[0];
              const displayStatus = ticket.status === "Reject" && rejectedStatusObj ? `Rejected by ${formatStage(rejectedStatusObj.name)}` : ticket.status || "-";

              const isMttp = !!ticket.reqName || Object.keys(ticket).some(k => k.toLowerCase().includes('mttp'));
              const typeLabel = isMttp ? "📦 MTTP" : "🎫 Normal";

              addBot(`${typeLabel}: ${ticket.reqNo}\n• Vendor: ${ticket.vendorName || "-"}\n• Stage: ${formatStage(ticket.stage)}\n• Status: ${displayStatus}\n• Value: ₹${ticket.totalBaseValue?.toLocaleString("en-IN") || "0"}\n• Date: ${ticket.createdDate || ticket.createdAt || "-"}`);
            } else {
              addBot(`❌ Ticket ${reqNo} not found in your currently accessible lists.\n\nPossible reasons:\n• It may be in a different tab (Marketing/Non-Marketing)\n• The ticket number might be incorrect`);
            }
          }
          break;
        }

        default: {
          // Search knowledge base before giving up
          const knowledgeAnswer = searchKnowledge(text);
          if (knowledgeAnswer) {
            addBot(knowledgeAnswer);
          } else {
            // Smart fallback — suggest related actions
            const lower = text.toLowerCase();
            let suggestion = "";
            if (lower.includes("how") || lower.includes("?")) {
              suggestion = "\n\n💡 Try asking:\n• \"how to create a PO?\"\n• \"what is this tool?\"\n• \"features\"\n• \"process\"";
            } else if (lower.length < 3) {
              suggestion = "\n\nPlease type a longer message so I can understand better.";
            } else {
              suggestion = "\n\n💡 I can help with:\n• Ticket stats & tracking\n• PO workflow & process\n• Project features & roles\n• How-to guides\n\nType \"help\" for all commands.";
            }
            addBot(`🤔 I'm not sure about "${text}", but I'm here to help!${suggestion}`, true);
          }
          break;
        }
      }
    } catch (err) {
      console.error("ChatBot error:", err);
      addBot(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !fileAtt) return;
    if (loading) return;
    setMessages((prev) => [...prev, { from: "user", text: text || (fileAtt ? "[File Attached]" : ""), time: now() }]);
    setInput("");
    const f = fileAtt;
    setFileAtt(null); // clear file

    if (isFlowActive) {
      setLoading(true);
      await processFlowInput(text, f);
      setLoading(false);
    } else {
      await processMessage(text);
    }
  };

  const handleDynamicOption = async (opt) => {
    if (loading) return;
    const value = typeof opt === "string" ? opt : opt.value;
    const label = typeof opt === "string" ? opt : opt.label;
    setMessages((prev) => [...prev, { from: "user", text: label, time: now() }]);
    setInput("");

    if (isFlowActive) {
      setLoading(true);
      await processFlowInput(value);
      setLoading(false);
    } else {
      await processMessage(value);
    }
  };

  const handleQuickAction = async (value) => {
    if (loading) return;
    setMessages((prev) => [...prev, { from: "user", text: value, time: now() }]);
    await processMessage(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {!open && (
        <button
          ref={fabRef}
          className="chatbot-fab"
          title="PO Assistant"
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          style={fabPos ? {
            bottom: 'auto',
            right: 'auto',
            left: fabPos.x,
            top: fabPos.y,
          } : undefined}
        >
          <Lottie animationData={chatbotAnimation} loop autoplay className="chatbot-fab-icon" />
        </button>
      )}

      {open && (
        <div
          className="chatbot-window"
          ref={chatWindowRef}
          style={winPos ? {
            bottom: 'auto',
            right: 'auto',
            left: winPos.x,
            top: winPos.y,
          } : undefined}
        >
          <div
            className="chatbot-header chatbot-header--draggable"
            onPointerDown={onWindowPointerDown}
            onPointerMove={onWindowPointerMove}
            onPointerUp={onWindowPointerUp}
          >
            <div className="chatbot-header-info">
              <div className="chatbot-header-avatar">
                <Lottie animationData={chatbotAnimation} loop autoplay className="chatbot-header-lottie" />
              </div>
              <div className="chatbot-header-text">
                <span className="chatbot-header-title">PO Assistant</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chatbot-body" ref={bodyRef} onScroll={handleBodyScroll}>
            <div className="chatbot-body-glow" />
            {messages.map((msg, i) => (
              <React.Fragment key={i}>
                <div className={`chatbot-row ${msg.from}`}>
                  {msg.from === "bot" && (
                    <div className="chatbot-avatar bot-avatar">
                      <div className="chatbot-avatar-ring" />
                      <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="bot" className="chatbot-avatar-img" />
                    </div>
                  )}
                  <div className="chatbot-bubble-wrap">
                    <div className={`chatbot-msg ${msg.from}`}>
                      <div className="chatbot-msg-inner">
                        <pre>{msg.text}</pre>
                      </div>
                    </div>
                    <div className={`chatbot-meta ${msg.from}`}>
                      <span className="chatbot-time">{msg.time}</span>
                      {msg.isDate && isFlowActive && (
                        <button
                          className="chatbot-date-edit-btn"
                          onClick={() => goBackToDateStep(msg.dateStepId)}
                          disabled={loading}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                  {msg.from === "user" && (
                    <div className="chatbot-avatar chatuser-avatar">
                      <div className="chatbot-avatar-ring" />
                      <img src="https://cdn-icons-png.flaticon.com/512/4333/4333609.png" alt="user" className="chatbot-avatar-img" />
                    </div>
                  )}
                </div>
                {msg.options && msg.options.length > 0 && msg.from === "bot" && (
                  <div className="chatbot-dynamic-options">
                    {msg.options.filter(opt => !opt?.isSkip).map((opt, oIdx) => {
                      const label = typeof opt === "string" ? opt : opt.label;
                      return (
                        <button key={oIdx} className="chatbot-option-btn" onClick={() => handleDynamicOption(opt)} disabled={loading}>
                          {label} <span>➤</span>
                        </button>
                      );
                    })}
                    {msg.options.filter(opt => opt?.isSkip).map((opt, oIdx) => (
                      <button key={`skip-${oIdx}`} className="chatbot-skip-btn" onClick={() => handleDynamicOption(opt)} disabled={loading}>
                        Skip ➜
                      </button>
                    ))}
                  </div>
                )}
                {msg.showQuickActions && msg.from === "bot" && (
                  <div className="chatbot-quick-actions">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <button
                        key={action.value}
                        className="chatbot-chip"
                        style={{ animationDelay: `${idx * 0.06}s` }}
                        onClick={() => handleQuickAction(action.value)}
                        disabled={loading}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
            {loading && (
              <div className="chatbot-row bot">
                <div className="chatbot-avatar bot-avatar">
                  <div className="chatbot-avatar-ring" />
                  <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="bot" className="chatbot-avatar-img" />
                </div>
                <div className="chatbot-bubble-wrap">
                  <div className="chatbot-msg bot">
                    <div className="chatbot-typing"><span /><span /><span /></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
            {showScrollBtn && (
              <button className="chatbot-scroll-btn" onClick={scrollToBottom}>↓</button>
            )}
          </div>
          {fileAtt && (
            <div className="chatbot-file-preview">
              <span className="chatbot-file-preview-name">📄 {fileAtt.name}</span>
              <span className="chatbot-file-remove" onClick={() => setFileAtt(null)}>✖</span>
            </div>
          )}
          {isFlowActive && flowState?.isDateStep && (
            <div className="chatbot-datepicker-popup">
              <button
                className="chatbot-datepicker-trigger"
                onClick={() => {
                  setDatePickerOpen(true);
                  setTimeout(() => datePickerRef.current?.focus(), 50);
                }}
              >
                <span className="chatbot-datepicker-icon">📅</span>
                <span className="chatbot-datepicker-text">Tap to pick a date</span>
                <span className="chatbot-datepicker-arrow">▼</span>
              </button>
              <div className="chatbot-datepicker-hidden">
                <DatePicker
                  ref={datePickerRef}
                  value={datePickerVal}
                  open={datePickerOpen}
                  onOpenChange={(o) => setDatePickerOpen(o)}
                  onChange={(date) => {
                    if (!date) return;
                    setDatePickerOpen(false);
                    setDatePickerVal(null);
                    const val = date.format("YYYY-MM-DD");
                    const display = date.format("DD-MM-YYYY");
                    const stepId = ["activityStartDate", "activityEndDate"].find(id => !flowState?.data?.[id]) || "activityStartDate";
                    setMessages((prev) => [...prev, { from: "user", text: display, time: now(), isDate: true, dateStepId: stepId }]);
                    setLoading(true);
                    processFlowInput(val).then(() => setLoading(false));
                  }}
                  format="DD-MM-YYYY"
                  size="small"
                  placement="topLeft"
                  style={{ width: 0, height: 0, opacity: 0, position: "absolute", pointerEvents: "none" }}
                  getPopupContainer={(trigger) => trigger.closest(".chatbot-datepicker-popup") || trigger.parentElement}
                  popupClassName="chatbot-antd-datepicker-dropdown"
                  inputReadOnly
                />
              </div>
            </div>
          )}
          {isFlowActive && flowState?.isAutocomplete && flowState?.currentOptions && (() => {
            const q = autocompleteSearch.trim().toLowerCase();
            const filtered = flowState.currentOptions.filter((opt) => {
              const l = typeof opt === "string" ? opt : (opt?.label || "");
              return l.toLowerCase().includes(q);
            }).slice(0, 50);
            return (
              <div className="chatbot-autocomplete-popup">
                <div className="chatbot-autocomplete-search">
                  <input
                    type="text"
                    placeholder="🔍 Search options..."
                    value={autocompleteSearch}
                    onChange={(e) => setAutocompleteSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="chatbot-autocomplete-list">
                  {filtered.map((opt, idx) => {
                    const label = typeof opt === "string" ? opt : (opt?.label || "Unknown");
                    return (
                      <button key={idx} className="chatbot-autocomplete-row" disabled={loading} onClick={() => { setAutocompleteSearch(""); handleDynamicOption(opt); }}>
                        {label}
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="chatbot-autocomplete-empty">No matching results</div>
                  )}
                  {filtered.length > 0 && filtered.length < flowState.currentOptions.length && (
                    <div className="chatbot-autocomplete-empty">Showing {filtered.length} of {flowState.currentOptions.length}</div>
                  )}
                </div>
              </div>
            );
          })()}
          <div className="chatbot-footer">
            <div className="chatbot-footer-actions">
              <div className="chatbot-file-upload">
                <label className="chatbot-file-btn" title="Attach file">
                  📎
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setFileAtt(e.target.files[0]);
                    }}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isFlowActive ? "Enter response..." : "Ask me anything..."}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || (!input.trim() && !fileAtt)}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
