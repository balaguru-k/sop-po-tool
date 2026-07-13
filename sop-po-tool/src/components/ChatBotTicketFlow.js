import { useState, useRef } from "react";
import axios from "axios";

export const useTicketFlow = (addBot, BaseUrl, getToken) => {
  const [flowState, setFlowState] = useState(null);
  const vendorCache = useRef(null);

  const hdrs = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  // Helper: fetch and cache the full vendor list
  const getVendorList = async () => {
    if (vendorCache.current) return vendorCache.current;
    try {
      const res = await axios.get(`${BaseUrl}api/sap/getVendorList`, hdrs());
      vendorCache.current = res.data?.data || [];
      return vendorCache.current;
    } catch (e) { return []; }
  };

  // ─── Step Definitions ──────────────────────────────────────────────
  // Required fields (cannot skip): Vendor Name, Vendor Mail Id, Advance,
  // PO Type, Attachment, Profit Centre, Brand, Region, District, Channel,
  // Brand Sub-Category, Amount, Nature of Expenses, PO Description,
  // Activity Start Date, Activity End Date
  // Business Approver: ONLY required for Non-Brand (Non-Marketing)
  // Material Code, ROI Description: Optional (can skip)
  const STEPS = [
    // ============ SECTION 1: Ticket Type ============
    {
      id: "ticketType",
      section: "📋 Ticket Info",
      msg: "🛠️ Let's create a new PO request!\n\nFirst, what type of ticket is this?",
      options: ["Brand", "Non Brand"],
    },

    // ============ SECTION 2: Vendor Details ============
    {
      id: "vendorName",
      section: "🏢 Vendor Details",
      msg: "🏢 Please select the Vendor Name:\n(Search and pick from the list)",
      fetchOptions: async () => {
        const vendors = await getVendorList();
        const grouped = {};
        vendors.forEach(v => { if (v.vendorName) grouped[v.vendorName] = true; });
        return Object.keys(grouped).sort();
      },
      isAutocomplete: true,
    },
    {
      id: "vendorLocation",
      section: "🏢 Vendor Details",
      msg: "📍 Select Vendor Location:",
      fetchOptions: async (q, data) => {
        const vendors = await getVendorList();
        const matched = vendors.filter(v => v.vendorName === data.vendorName);
        return [...new Set(matched.map(v => v.location || v.country))].filter(Boolean);
      },
      autoSkipIfSingle: true,
      onAutoSkip: (val) => `📍 Vendor Location auto-selected: ${val}`,
    },
    {
      id: "vendorCode",
      section: "🏢 Vendor Details",
      msg: "🔢 Select Vendor Code:",
      fetchOptions: async (q, data) => {
        const vendors = await getVendorList();
        const matched = vendors.filter(v => v.vendorName === data.vendorName && (v.location === data.vendorLocation || v.country === data.vendorLocation));
        return [...new Set(matched.map(v => v.vendorCode))].filter(Boolean);
      },
      autoSkipIfSingle: true,
      onAutoSkip: (val) => `🔢 Vendor Code auto-selected: ${val}`,
      // After vendor code is resolved, auto-fill GST, Mail, Currency, Payment Terms, Account Number
      onComplete: async (val, data) => {
        const vendors = await getVendorList();
        const v = vendors.find(vd => vd.vendorName === data.vendorName && (vd.location === data.vendorLocation || vd.country === data.vendorLocation) && vd.vendorCode === val);
        if (v) {
          return {
            gstNo: v.gstNo || "",
            _allVendorMails: v.mailId || "",
            currency: v.currency || "INR",
            paymentTerm: v.paymentTerm || "",
            accountNumber: v.accountNumber || "",
          };
        }
        return {};
      },
      onCompleteMsg: (extra) => `✅ Vendor details auto-fetched:\n• GST: ${extra.gstNo || "N/A"}\n• Currency: ${extra.currency || "N/A"}\n• Payment Term: ${extra.paymentTerm || "N/A"}\n• Account #: ${extra.accountNumber || "N/A"}`,
    },
    // Vendor Mail ID — searchable autocomplete (REQUIRED)
    {
      id: "vendorMailId",
      section: "🏢 Vendor Details",
      msg: "📧 Select Vendor Mail ID:\n(Search and pick from the list)",
      fetchOptions: async (q, data) => {
        const vendors = await getVendorList();
        const matched = vendors.filter(v => v.vendorName === data.vendorName);
        const allMails = matched.map(v => v.mailId).filter(Boolean);
        const uniqueMails = [...new Set(allMails.flatMap(m => m.split(",").map(s => s.trim())).filter(Boolean))];
        if (uniqueMails.length > 0) {
          uniqueMails.push("Other (Enter custom email)");
        }
        return uniqueMails;
      },
      isAutocomplete: true,
      autoSkipIfSingle: false,
    },
    // Custom Mail (only if user chose "Other")
    {
      id: "customMailId",
      section: "🏢 Vendor Details",
      msg: "📧 Please type the custom vendor email address:",
      skipIf: (data) => data.vendorMailId !== "Other (Enter custom email)",
      validate: (val) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(val) ? null : "⚠️ Please enter a valid email address.";
      },
    },

    // ============ SECTION 3: Financial Details ============
    // Advance — REQUIRED
    {
      id: "advance",
      section: "💰 Financial Details",
      msg: "💵 Enter Advance Amount (enter 0 if no advance):",
      validate: (val) => (!isNaN(val) && Number(val) >= 0) ? null : "Please enter a valid number.",
    },
    // PO Type — REQUIRED
    {
      id: "poType",
      section: "💰 Financial Details",
      msg: "📄 Select PO Type:",
      options: ["Yearly_PO", "Quaterly_PO", "Monthly_PO"],
    },
    // ROI Description — OPTIONAL
    {
      id: "roiDescription",
      section: "💰 Financial Details",
      msg: "📝 Enter ROI Description:",
      allowSkip: true,
    },
    // Attachment — REQUIRED
    {
      id: "attachment",
      section: "💰 Financial Details",
      msg: "📎 Please upload your attachment using the 📎 button below.\n⚠️ Attachment is required!",
      isFileStep: true,
      required: true,
    },

    // ============ SECTION 4: Item Details ============
    // Material Code — OPTIONAL (only validates max length)
    {
      id: "materialCode",
      section: "🏷️ Item Details",
      msg: "🔢 Enter Material Code:",
      allowSkip: true,
      validate: (val) => (val.length <= 100) ? null : "Material Code cannot exceed 100 characters.",
    },
    // Delivery Plant — REQUIRED only if materialCode was provided
    {
      id: "deliveryPlant",
      section: "🏷️ Item Details",
      msg: "🏭 Select Delivery Plant:",
      skipIf: (data) => !data.materialCode || data.materialCode === "skip" || data.materialCode === "",
      fetchOptions: async () => {
        try {
          const res = await axios.get(`${BaseUrl}api/delivery-plant`, hdrs());
          return (res.data || []).map(p => ({ label: `${p.plantCode} - ${p.plantName || p.description || ""}`, value: p.plantCode || p.id }));
        } catch (e) { return []; }
      },
    },
    // Division — REQUIRED (Profit Centre)
    {
      id: "division",
      section: "🏷️ Item Details",
      msg: "🏛️ Select Division / Profit Centre:",
      fetchOptions: async (q, data) => {
        try {
          const isBrand = data.ticketType === "Brand";
          const url = isBrand
            ? `${BaseUrl}api/sap/getDivisionData`
            : `${BaseUrl}api/sap/getNonBrandData?brandType=NonBrand`;
          const res = await axios.get(url, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.division))];
        } catch (e) { return []; }
      },
      isAutocomplete: true,
    },

    // ─── BRAND Cascade ───
    {
      id: "brand",
      section: "🏷️ Brand Details",
      msg: "🏷️ Select Brand:",
      skipIf: (data) => data.ticketType !== "Brand",
      fetchOptions: async (q, data) => {
        try {
          const res = await axios.get(`${BaseUrl}api/sap/getDivisionData?division=${encodeURIComponent(data.division)}`, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.brand))];
        } catch (e) { return []; }
      },
      isAutocomplete: true,
    },
    {
      id: "region",
      section: "🏷️ Brand Details",
      msg: "🌏 Select Region:",
      skipIf: (data) => data.ticketType !== "Brand",
      fetchOptions: async (q, data) => {
        try {
          const res = await axios.get(`${BaseUrl}api/sap/getDivisionData?division=${encodeURIComponent(data.division)}&brand=${encodeURIComponent(data.brand)}`, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.region))];
        } catch (e) { return []; }
      },
      autoSkipIfSingle: true,
      onAutoSkip: (val) => `🌏 Region auto-selected: ${val}`,
      isAutocomplete: true,
    },
    {
      id: "district",
      section: "🏷️ Brand Details",
      msg: "📍 Select District:",
      skipIf: (data) => data.ticketType !== "Brand",
      fetchOptions: async (q, data) => {
        try {
          const res = await axios.get(`${BaseUrl}api/district?region=${encodeURIComponent(data.region)}`, hdrs());
          return res.data?.districts || res.data || [];
        } catch (e) { return []; }
      },
      isAutocomplete: true,
    },

    // ─── NON-BRAND Cascade ───
    {
      id: "department",
      section: "🏷️ Non-Brand Details",
      msg: "🏢 Select Department:",
      skipIf: (data) => data.ticketType === "Brand",
      fetchOptions: async (q, data) => {
        try {
          const res = await axios.get(`${BaseUrl}api/sap/getNonBrandData?brandType=NonBrand&division=${encodeURIComponent(data.division)}`, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.department))];
        } catch (e) { return []; }
      },
      isAutocomplete: true,
    },
    {
      id: "location",
      section: "🏷️ Non-Brand Details",
      msg: "📍 Select Location:",
      skipIf: (data) => data.ticketType === "Brand",
      fetchOptions: async (q, data) => {
        try {
          const res = await axios.get(`${BaseUrl}api/sap/getNonBrandData?brandType=NonBrand&division=${encodeURIComponent(data.division)}&department=${encodeURIComponent(data.department)}`, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.location))];
        } catch (e) { return []; }
      },
      isAutocomplete: true,
    },

    // ─── COMMON Cascade (Channel -> SubCategory/FundCentre) ───
    {
      id: "channel",
      section: "🏷️ Item Details",
      msg: "📺 Select Channel:",
      fetchOptions: async (q, data) => {
        try {
          const isBrand = data.ticketType === "Brand";
          let url;
          if (isBrand) {
            url = `${BaseUrl}api/sap/getDivisionData?division=${encodeURIComponent(data.division)}&brand=${encodeURIComponent(data.brand)}&region=${encodeURIComponent(data.region)}`;
          } else {
            url = `${BaseUrl}api/sap/getNonBrandData?brandType=NonBrand&division=${encodeURIComponent(data.division)}&department=${encodeURIComponent(data.department)}&location=${encodeURIComponent(data.location)}`;
          }
          const res = await axios.get(url, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.channel))];
        } catch (e) { return []; }
      },
      autoSkipIfSingle: true,
      onAutoSkip: (val) => `📺 Channel auto-selected: ${val}`,
      isAutocomplete: true,
    },
    {
      id: "brandSubCategory",
      section: "🏷️ Brand Details",
      msg: "🔖 Select Brand Sub-Category:",
      skipIf: (data) => data.ticketType !== "Brand",
      fetchOptions: async (q, data) => {
        try {
          const res = await axios.get(`${BaseUrl}api/sap/getDivisionData?division=${encodeURIComponent(data.division)}&brand=${encodeURIComponent(data.brand)}&region=${encodeURIComponent(data.region)}&channel=${encodeURIComponent(data.channel)}`, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.brandSubCategory))];
        } catch (e) { return []; }
      },
      autoSkipIfSingle: true,
      onAutoSkip: (val) => `🔖 Sub-Category auto-selected: ${val}`,
      isAutocomplete: true,
    },

    // ─── Common: Fund Centre (Profit Centre) — REQUIRED ───
    {
      id: "fundCentre",
      section: "🏷️ Item Details",
      msg: "💼 Select Fund Centre / Profit Centre:",
      fetchOptions: async (q, data) => {
        try {
          const isBrand = data.ticketType === "Brand";
          let url;
          if (isBrand) {
            url = `${BaseUrl}api/sap/getDivisionData?division=${encodeURIComponent(data.division)}&brand=${encodeURIComponent(data.brand)}&region=${encodeURIComponent(data.region)}&channel=${encodeURIComponent(data.channel)}&brandSubCategory=${encodeURIComponent(data.brandSubCategory)}`;
          } else {
            url = `${BaseUrl}api/sap/getNonBrandData?brandType=NonBrand&division=${encodeURIComponent(data.division)}&department=${encodeURIComponent(data.department)}&channel=${encodeURIComponent(data.channel)}&location=${encodeURIComponent(data.location)}`;
          }
          const res = await axios.get(url, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.fundcenter))].filter(Boolean);
        } catch (e) { return []; }
      },
      autoSkipIfSingle: true,
      onAutoSkip: (val) => `💼 Fund Centre auto-selected: ${val}`,
      // After fund centre, fetch IO/CC
      onComplete: async (val, data) => {
        try {
          const isBrand = data.ticketType === "Brand";
          let url;
          if (isBrand) {
            url = `${BaseUrl}api/sap/getDivisionData?division=${encodeURIComponent(data.division)}&brand=${encodeURIComponent(data.brand)}&region=${encodeURIComponent(data.region)}&channel=${encodeURIComponent(data.channel)}&brandSubCategory=${encodeURIComponent(data.brandSubCategory)}&fundCentre=${encodeURIComponent(val)}`;
          } else {
            url = `${BaseUrl}api/sap/getNonBrandData?brandType=NonBrand&division=${encodeURIComponent(data.division)}&department=${encodeURIComponent(data.department)}&channel=${encodeURIComponent(data.channel)}&location=${encodeURIComponent(data.location)}&fundCentre=${encodeURIComponent(val)}`;
          }
          const res = await axios.get(url, hdrs());
          const matched = (res.data?.data || []).find(i => i.fundcenter === val);
          if (matched) {
            return {
              internalorder: matched.internalorder || "",
              costcenter: matched.costcenter || "",
              ioOrCostCentrePo: isBrand ? "IO1" : "CC",
            };
          }
        } catch (e) { }
        return {};
      },
      isAutocomplete: true,
    },

    // Cost Center — REQUIRED (NonBrand only)
    {
      id: "costcenter",
      section: "🏷️ Non-Brand Details",
      msg: "🏷️ Select Cost Center:",
      skipIf: (data) => data.ticketType === "Brand",
      fetchOptions: async (q, data) => {
        try {
          const res = await axios.get(`${BaseUrl}api/sap/getNonBrandData?brandType=NonBrand&division=${encodeURIComponent(data.division)}&department=${encodeURIComponent(data.department)}&channel=${encodeURIComponent(data.channel)}&location=${encodeURIComponent(data.location)}&fundCentre=${encodeURIComponent(data.fundCentre)}`, hdrs());
          return [...new Set((res.data?.data || []).map(i => i.costcenter))].filter(Boolean);
        } catch (e) { return []; }
      },
      autoSkipIfSingle: true,
      onAutoSkip: (val) => `🏷️ Cost Center auto-selected: ${val}`,
      isAutocomplete: true,
    },

    // ============ SECTION 5: Amount & Expenses — ALL REQUIRED ============
    // Amount — REQUIRED
    {
      id: "value",
      section: "💰 Amount",
      msg: "💰 Enter the Amount (Base Value):",
      validate: (val) => (!isNaN(val) && Number(val) > 0) ? null : "Please enter a valid positive number.",
    },
    // Nature of Expenses — REQUIRED
    {
      id: "natureOfExpenses",
      section: "💼 Expenses",
      msg: "💼 Select Nature of Expenses:",
      fetchOptions: async (q, data) => {
        try {
          const tType = data.ticketType === "Brand" ? "Brand" : "NonBrand";
          const res = await axios.get(`${BaseUrl}api/gldetails/getAllGlDetails?type=${tType}`, hdrs());
          const raw = Array.isArray(res.data) ? res.data[0] : res.data;
          return raw?.gldescription || [];
        } catch (e) { return []; }
      },
      isAutocomplete: true,
      // Auto-fetch GL code after selection
      onComplete: async (val, data) => {
        let results = {};
        try {
          const res = await axios.get(`${BaseUrl}api/sap/Gldescription?Gldescription=${encodeURIComponent(val)}`, hdrs());
          const glData = res.data?.[0];
          if (glData) {
            results = {
              glCode: glData.glacct || "",
              glDescription: glData.gldescription || "",
              commitmentItem: glData.cmmtitem || "",
            };
          }

          // Also check self-approval eligibility for Brand
          if (data.ticketType === "Brand") {
            const userId = localStorage.getItem("id");
            const totalVal = data.value || "0";
            const glCode = glData?.glacct || "";
            const vUrl = `${BaseUrl}budget/validate-user?limit=${totalVal}&userId=${userId}${glCode ? `&glCode=${glCode}` : ""}`;
            const vRes = await axios.get(vUrl, hdrs());
            const msg = vRes.data?.message;
            results.selfApproval = (msg === "User is eligible" || msg === "User is within budget range");
            if (results.selfApproval) {
              addBot("✨ You are eligible for Self-Approval for this request.");
            }
          }
        } catch (e) { }
        return results;
      },
      onCompleteMsg: (extra) => `✅ GL Details auto-fetched:\n• GL Code: ${extra.glCode || "N/A"}\n• Commitment Item: ${extra.commitmentItem || "N/A"}`,
    },

    // ============ SECTION 6: Description — REQUIRED ============
    {
      id: "poDescription",
      section: "📝 Description",
      msg: "📝 Enter PO Description:",
      validate: (val) => val.trim().length >= 2 ? null : "PO Description is required.",
    },

    // ============ SECTION 7: Dates — ALL REQUIRED ============
    {
      id: "activityStartDate",
      section: "📅 Dates",
      msg: "📅 Select Activity Start Date:",
      isDateStep: true,
    },
    {
      id: "activityEndDate",
      section: "📅 Dates",
      msg: "📅 Select Activity End Date:",
      isDateStep: true,
      validateDate: (val, data) => {
        if (new Date(val) < new Date(data.activityStartDate)) return "End date cannot be before start date.";
        return null;
      },
    },

    // ============ SECTION 8: CKPL & GST (Brand only) ============
    {
      id: "ckplLocation",
      section: "📍 CKPL Location",
      msg: "📍 Select CKPL Delivery Location:",
      skipIf: (data) => data.ticketType !== "Brand",
      fetchOptions: async (q, data) => {
        try {
          const res = await axios.get(`${BaseUrl}api/sap/by-region?region=${encodeURIComponent(data.region)}`, hdrs());
          const locations = res.data || [];
          return locations.map(l => {
            const label = l.region?.includes("-All India")
              ? `ISD/${l.searchTerm}`
              : `${l.searchTerm}-${l.plantSearchTerm},${l.city}`;
            return { label, value: label, city: l.city };
          });
        } catch (e) { return []; }
      },
      autoSkipIfSingle: true,
      onAutoSkip: (val) => `📍 CKPL Location auto-selected: ${typeof val === 'string' ? val : val.label || val.value}`,
      onComplete: async (val, data) => {
        // Auto-calculate GST type based on vendor location vs CKPL city
        const ckplVal = typeof val === "object" ? val : { value: val, city: "" };
        const vendorLoc = (data.vendorLocation || "").toLowerCase();
        const ckplCity = (ckplVal.city || ckplVal.value || "").toLowerCase();
        const gstType = ckplCity.includes(vendorLoc) ? "Intra" : "Inter";
        return { gstType };
      },
      onCompleteMsg: (extra) => `🧾 GST Type auto-calculated: ${extra.gstType}`,
    },

    // ============ SECTION 9: Business Approver ============
    {
      id: "businessApprover",
      section: "👤 Approver",
      msg: "👤 Select Business Approver:",
      // Required if not self-approved (Brand) or always for Non-Brand
      skipIf: (data) => data.ticketType === "Brand" && data.selfApproval === true,
      fetchOptions: async (q, data) => {
        try {
          const tType = data.ticketType === "Brand" ? "Brand" : "NonBrand";
          const totalVal = data.value || "0";
          const glCode = data.glCode || "";
          let url = `${BaseUrl}budget/by-limit-ba?limit=${totalVal}&type=${tType}`;
          if (glCode) url += `&glCode=${glCode}`;
          const res = await axios.get(url, hdrs());
          return (res.data?.users || []).map(u => ({ label: u.userName, value: u.id }));
        } catch (e) {
          try {
            const res = await axios.get(`${BaseUrl}budget/by-limit-ba?limit=${data.value || "0"}&type=${data.ticketType === "Brand" ? "Brand" : "NonBrand"}`, hdrs());
            return (res.data?.users || []).map(u => ({ label: u.userName, value: u.id }));
          } catch (e2) { return []; }
        }
      },
      isAutocomplete: true,
      onComplete: async (val, data, allOpts) => {
        const selected = (allOpts || []).find(o => String(o.value) === String(val));
        return { businessApproverName: selected?.label || "" };
      },
    },

    // ============ SECTION 10: Carbon Copy (Non-Brand only) ============
    {
      id: "carbonCopy",
      section: "📬 Carbon Copy",
      msg: "📬 Select Carbon Copy user:",
      skipIf: (data) => data.ticketType === "Brand",
      fetchOptions: async () => {
        try {
          const res = await axios.get(`${BaseUrl}api/auth/all-ba-users`, hdrs());
          return (res.data || []).map(u => ({ label: u.userName || u.name, value: u.id }));
        } catch (e) { return []; }
      },
      isAutocomplete: true,
      allowSkip: true,
    },

    // ============ FINAL: Review & Confirm ============
    {
      id: "confirm",
      section: "✅ Confirmation",
      msg: null,
      options: ["✅ Submit", "❌ Cancel"],
      buildMsg: (data) => {
        const isBrand = data.ticketType === "Brand";
        const mailDisplay = data.vendorMailId === "Other (Enter custom email)" ? data.customMailId : data.vendorMailId;
        return `📋 Review your ticket:\n\n` +
          `• Type: ${data.ticketType}\n` +
          `• Vendor: ${data.vendorName} (${data.vendorCode})\n` +
          `• Location: ${data.vendorLocation}\n` +
          `• Mail: ${mailDisplay}\n` +
          `• Currency: ${data.currency || "INR"}\n` +
          `• PO Type: ${data.poType}\n` +
          `• Advance: ${data.advance}\n` +
          `• Amount: ₹${Number(data.value || 0).toLocaleString("en-IN")}\n` +
          `• Division: ${data.division}\n` +
          (isBrand
            ? `• Brand: ${data.brand}\n• Region: ${data.region}\n• District: ${data.district}\n• Channel: ${data.channel}\n• Sub-Category: ${data.brandSubCategory}\n`
            : `• Department: ${data.department}\n• Location: ${data.location}\n• Channel: ${data.channel}\n`) +
          `• Fund Centre: ${data.fundCentre}\n` +
          `• Nature of Expenses: ${data.natureOfExpenses}\n` +
          `• PO Description: ${data.poDescription}\n` +
          `• Start: ${data.activityStartDate} → End: ${data.activityEndDate}\n` +
          (!isBrand ? `• Approver: ${data.businessApproverName || data.businessApprover}\n` : "") +
          (data._attachmentFile ? `• Attachment: ${data._attachmentFile.name}\n` : "") +
          `\nDo you want to submit this ticket?`;
      },
    },
  ];

  // ─── Flow Control ──────────────────────────────────────────────────
  const startFlow = () => {
    vendorCache.current = null;
    const step = STEPS[0];
    setFlowState({ step: 0, data: {}, currentOptions: step.options || [], isAutocomplete: false });
    addBot(step.msg, false, step.options || []);
  };

  const cancelFlow = () => {
    setFlowState(null);
    addBot("🚫 Ticket creation cancelled.", true);
  };

  const advanceToStep = async (stepIdx, data) => {
    // Find next non-skipped step
    let idx = stepIdx;
    while (idx < STEPS.length) {
      const step = STEPS[idx];
      if (step.skipIf && step.skipIf(data)) {
        idx++;
        continue;
      }
      break;
    }

    if (idx >= STEPS.length) return;

    const step = STEPS[idx];
    let options = [];
    let isAutocomplete = false;

    if (step.fetchOptions) {
      options = await step.fetchOptions("", data);
      isAutocomplete = !!step.isAutocomplete;

      // Auto-skip if single option and step allows it
      if (step.autoSkipIfSingle && options.length === 1) {
        const autoVal = typeof options[0] === "string" ? options[0] : options[0].value;
        const autoLabel = typeof options[0] === "string" ? options[0] : options[0].label;
        data[step.id] = autoVal;

        if (step.onAutoSkip) addBot(step.onAutoSkip(autoLabel));

        // Run onComplete if exists
        if (step.onComplete) {
          const extra = await step.onComplete(autoVal, data, options);
          if (extra) {
            Object.assign(data, extra);
            if (step.onCompleteMsg) addBot(step.onCompleteMsg(extra));
          }
        }

        await advanceToStep(idx + 1, data);
        return;
      }
    } else if (step.options) {
      options = step.options;
    }

    // Build message for confirm step
    const msg = step.buildMsg ? step.buildMsg(data) : step.msg;

    // Date step: show date picker in ChatBot UI
    if (step.isDateStep) {
      setFlowState({ step: idx, data, currentOptions: [], isAutocomplete: false, isDateStep: true });
      addBot(msg + "\n\nUse the 📅 date picker below to select.");
      return;
    }

    // Add Skip button for allowSkip steps
    const displayOptions = isAutocomplete ? null : options;
    const skipOption = step.allowSkip ? [{ label: "Skip", value: "skip", isSkip: true }] : [];
    const finalOptions = displayOptions ? [...displayOptions, ...skipOption] : skipOption.length > 0 ? skipOption : null;

    setFlowState({ step: idx, data, currentOptions: options, isAutocomplete });
    addBot(msg, false, finalOptions);
  };

  const processFlowInput = async (input, file = null) => {
    if (!flowState) return false;

    const lower = (input || "").toLowerCase().trim();

    // Handle cancel
    if (lower === "cancel" || lower === "exit") {
      cancelFlow();
      return true;
    }

    const currentStep = STEPS[flowState.step];
    let nextData = { ...flowState.data };

    // ─── Confirm Step ───
    if (currentStep.id === "confirm") {
      if (lower.includes("submit") || lower.includes("yes") || lower === "✅ submit") {
        addBot("⏳ Creating your ticket... please wait.");
        await submitTicket(nextData);
        setFlowState(null);
      } else {
        cancelFlow();
      }
      return true;
    }

    // ─── File Step (Attachment) ───
    if (currentStep.isFileStep) {
      if (file) {
        nextData._attachmentFile = file;
        addBot(`📄 File attached: ${file.name}`);
        await advanceToStep(flowState.step + 1, nextData);
      } else if (currentStep.required) {
        // Attachment is REQUIRED — cannot skip
        addBot("⚠️ Attachment is required! Please attach a file using the 📎 button.");
      } else {
        addBot("⚠️ Please attach a file using the 📎 button.");
      }
      return true;
    }

    // ─── Skip handling (only for allowSkip steps) ───
    if (currentStep.allowSkip && lower === "skip") {
      nextData[currentStep.id] = "";
      await advanceToStep(flowState.step + 1, nextData);
      return true;
    }

    // ─── Date Step handling ───
    if (currentStep.isDateStep) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        addBot("⚠️ Please use the 📅 date picker below to select a date.");
        return true;
      }
      if (currentStep.validateDate) {
        const err = currentStep.validateDate(input, nextData);
        if (err) {
          addBot(`⚠️ ${err}`);
          return true;
        }
      }
      nextData[currentStep.id] = input;
      await advanceToStep(flowState.step + 1, nextData);
      return true;
    }

    // ─── Validation ───
    if (currentStep.validate) {
      const err = currentStep.validate(input);
      if (err) {
        addBot(`⚠️ ${err}`);
        return true;
      }
    }

    // ─── Option matching ───
    let valueToStore = input;
    if (flowState.currentOptions && flowState.currentOptions.length > 0) {
      // Try exact match first
      const opt = flowState.currentOptions.find(o => {
        if (typeof o === "string") return o.toLowerCase() === lower;
        return o.label?.toLowerCase() === lower || String(o.value) === String(input);
      });

      if (opt) {
        valueToStore = typeof opt === "string" ? opt : opt.value;
      } else if (flowState.isAutocomplete) {
        // For autocomplete steps: user clicked from the UI list, accept value as-is
        // Also try a fuzzy match to extract the correct original value
        const fuzzy = flowState.currentOptions.find(o => {
          const val = typeof o === "string" ? o : (o.label || o.value || "");
          return String(val).trim().toLowerCase() === lower;
        });
        valueToStore = fuzzy ? (typeof fuzzy === "string" ? fuzzy : fuzzy.value) : input;
      } else if (currentStep.options) {
        // For static button options: strict match required
        addBot("⚠️ Please select a valid option from the list.", false, flowState.currentOptions);
        return true;
      }
    }

    // ─── Store value ───
    nextData[currentStep.id] = valueToStore;

    // ─── onComplete callback ───
    if (currentStep.onComplete) {
      const extra = await currentStep.onComplete(valueToStore, nextData, flowState.currentOptions);
      if (extra) {
        Object.assign(nextData, extra);
        if (currentStep.onCompleteMsg) addBot(currentStep.onCompleteMsg(extra));
      }
    }

    // ─── Advance ───
    await advanceToStep(flowState.step + 1, nextData);
    return true;
  };

  // ─── Submit Ticket ─────────────────────────────────────────────────
  const submitTicket = async (data) => {
    try {
      const isBrand = data.ticketType === "Brand";
      const apiUrl = `${BaseUrl}api/ticket/create-ticket?type=${isBrand ? "Brand" : "NonBrand"}`;

      const fd = new FormData();

      // Top-level fields
      fd.append("vendorName", data.vendorName || "");
      fd.append("vendorLocation", data.vendorLocation || "");
      fd.append("vendorCode", data.vendorCode || "");
      fd.append("gstNo", data.gstNo || "");
      fd.append("currency", data.currency || "INR");
      fd.append("paymentTerm", data.paymentTerm || "");
      fd.append("accountNumber", data.accountNumber || "");
      fd.append("advance", data.advance || "0");
      fd.append("poType", data.poType || "");
      fd.append("totalBaseValue", data.value || "0");

      if (data.roiDescription && data.roiDescription !== "skip" && data.roiDescription !== "") {
        fd.append("roiDescription", data.roiDescription);
      }

      // Vendor mail — handle custom vs selected
      if (data.vendorMailId === "Other (Enter custom email)" && data.customMailId) {
        fd.append("vendorMailId", data.customMailId);
      } else {
        fd.append("vendorMailId", data.vendorMailId || "");
      }

      // Business Approver & Self Approval
      if (data.businessApprover) {
        fd.append("businessApprover", data.businessApprover);
        fd.append("poApproverName", data.businessApproverName || "");
      }
      if (data.selfApproval) {
        fd.append("selfApprove", "true");
      }

      // Brand array item [0]
      fd.append("brand[0].brandOrNonBrand", isBrand ? "Brand" : "NonBrand");
      fd.append("brand[0].division", data.division || "");
      fd.append("brand[0].ioOrCostCentrePo", data.ioOrCostCentrePo || (isBrand ? "IO1" : "CC"));

      if (isBrand) {
        fd.append("brand[0].brand", data.brand || "");
        fd.append("brand[0].detailsBrand", data.brand || "");
        fd.append("brand[0].region", data.region || "");
        if (data.district) {
          const districts = Array.isArray(data.district) ? data.district : [data.district];
          districts.forEach((d, i) => fd.append(`brand[0].district[${i}]`, d));
        }
        fd.append("brand[0].channel", data.channel || "");
        fd.append("brand[0].brandSubCategory", data.brandSubCategory || "");
        if (data.ckplLocation) {
          const ckplVal = typeof data.ckplLocation === "object" ? data.ckplLocation.value : data.ckplLocation;
          fd.append("brand[0].ckplLocation", ckplVal || "");
        }
        fd.append("brand[0].gstType", data.gstType || "");
      } else {
        fd.append("brand[0].department", data.department || "");
        fd.append("brand[0].location", data.location || "");
        fd.append("brand[0].channel", data.channel || "");
        fd.append("brand[0].ckplLocation", data.location || "");
        if (data.costcenter) fd.append("brand[0].costcenter", data.costcenter);
      }

      fd.append("brand[0].fundCentre", data.fundCentre || "");
      if (data.internalorder) fd.append("brand[0].internalorder", data.internalorder);
      fd.append("brand[0].natureOfExpenses", data.natureOfExpenses || "");
      fd.append("brand[0].glCode", data.glCode || "");
      fd.append("brand[0].glDescription", data.glDescription || "");
      fd.append("brand[0].commitmentItem", data.commitmentItem || "");
      fd.append("brand[0].poDescription", data.poDescription || "");
      fd.append("brand[0].value", data.value || "0");
      fd.append("brand[0].activityStartDate", data.activityStartDate || "");
      fd.append("brand[0].activityEndDate", data.activityEndDate || "");

      if (data.materialCode && data.materialCode !== "skip" && data.materialCode !== "") {
        fd.append("brand[0].materialCode", data.materialCode);
      }
      if (data.deliveryPlant) {
        fd.append("brand[0].deliveryPlant", data.deliveryPlant);
      }

      // End date month/year
      if (data.activityEndDate) {
        const endD = new Date(data.activityEndDate);
        fd.append("brand[0].month", endD.toLocaleString("default", { month: "long" }));
        fd.append("brand[0].year", String(endD.getFullYear()));
      }

      // Carbon copy — only for Non-Brand
      if (!isBrand && data.carbonCopy && data.carbonCopy !== "skip" && data.carbonCopy !== "") {
        fd.append("copyMailIds[0]", data.carbonCopy);
      }

      // Attachment
      if (data._attachmentFile) {
        fd.append("attachment", data._attachmentFile);
      }

      fd.append("status", "Approved");

      const res = await axios.post(apiUrl, fd, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 200) {
        const d = res.data;
        let reqNo = d?.reqNo || d?.data?.reqNo || d?.ticket?.reqNo || null;

        // If API didn't return reqNo, fetch latest ticket to get it
        if (!reqNo) {
          try {
            const isBrand = data.ticketType === "Brand";
            const tType = isBrand ? "Brand" : "NonBrand";
            const role = localStorage.getItem("role");
            const listRes = await axios.get(
              `${BaseUrl}api/ticket/getAllByCommonStage/${role}?ticketType=${tType}`,
              hdrs()
            );
            const tickets = Array.isArray(listRes.data) ? listRes.data : [];
            if (tickets.length > 0) {
              // Sort by latest and pick the first one
              const sorted = tickets.sort((a, b) => {
                const da = new Date(a.updatedAt || a.createdAt || a.createdDate || 0);
                const db = new Date(b.updatedAt || b.createdAt || b.createdDate || 0);
                return db - da;
              });
              reqNo = sorted[0]?.reqNo;
            }
          } catch (e) { }
        }

        // Trigger table refresh in Request page
        window.dispatchEvent(new Event("chatbotTicketCreated"));

        if (reqNo) {
          addBot(`✅ Ticket created successfully!\n\n🎫 Request No: ${reqNo}\n\nType "my tickets" to track it.`, true);
        } else {
          addBot(`✅ Ticket created successfully!\n\nType "my tickets" or "recent" to see your new ticket.`, true);
        }
      } else {
        addBot("⚠️ Unexpected response. Please check your tickets list.", true);
      }
    } catch (err) {
      console.error("Ticket create error:", err);
      const errData = err.response?.data;
      let errMsg = "Server Error";
      if (typeof errData === "string") errMsg = errData;
      else if (errData?.message) errMsg = errData.message;
      else if (errData?.validationErrors) errMsg = Object.values(errData.validationErrors).join(", ");
      addBot(`❌ Error creating ticket:\n${errMsg}`, true);
    }
  };

  return {
    isFlowActive: flowState !== null,
    flowState,
    startFlow,
    processFlowInput,
    goBackToDateStep: async (stepId) => {
      if (!flowState) return;
      const idx = STEPS.findIndex(s => s.id === stepId);
      if (idx < 0) return;
      const newData = { ...flowState.data };
      delete newData[stepId];
      // If going back to start date, also clear end date
      if (stepId === "activityStartDate") delete newData.activityEndDate;
      setFlowState({ step: idx, data: newData, currentOptions: [], isAutocomplete: false, isDateStep: true });
      addBot(`✏️ Editing ${stepId === "activityStartDate" ? "Start Date" : "End Date"}. Pick a new date below.`);
    },
  };
};
