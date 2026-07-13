import React, { useEffect, useState, useRef } from "react";
import { Button, Collapse, Modal, Tooltip, Table } from "antd";
import { Row, Col } from "react-bootstrap";
import "../assets/css/customModal.css";
import "../styles/ConfirmationModal.css";
import { DatePicker, Space } from "antd";
import CollapsePanel from "antd/es/collapse/CollapsePanel";
import CustomInput from "./Custom/CustomInput";
import { set, useForm } from "react-hook-form";
import CustomSelect from "./Custom/CustomSelect";
import CustomMultiSelect from "./Custom/CustomMultiSelect";
import axios from "axios";
import { BaseUrl } from "../App";
import dayjs, { Dayjs } from "dayjs";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  FileOutlined,
  FilePdfOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { IoCheckmark, IoReloadCircleOutline } from "react-icons/io5";
import Form from "react-bootstrap/Form";
import e from "cors";
import toast from "react-hot-toast";
import { height } from "@mui/system";
import useDebounce from "./general/debounce";
import * as XLSX from "xlsx";

const CustomModal = ({
  isModalOpen,
  handleOk,
  handleUpdate,
  handleCancel,
  mode,
  isView,
  handleFormDraft,
  data,
  brandDataLength,
  handleFormRemarks,
  isModalView,
  handleFormApprove,
  handlePoApprove,
  handlePoRemarks,
  draftData,
  checkRes,
  checkAvailable,
  Pomaker,
  handleFormHold,
  handleRetrieveTicket,
  isRelatedCheck,
  poattach,
  prattach,
  praattach,
  tabData,
  isSubmit,
  isBrand,
}) => {
  const role = localStorage.getItem("role");
  const [exceedNew, setExceedNew] = useState(false);
  const [notExceedNew, setNotExceedNew] = useState(false);
  const [availableNew, setAvailableNew] = useState(false);
  const [notAvailableNew, setNotAvailableNew] = useState(false);
  const [yesCheck, setYesCheck] = useState(false);
  const [noCheck, setNoCheck] = useState(false);
  const [selfApproval, setSelfApproval] = useState(false);
  const [budgetApproval, setBudgetApproval] = useState(false);
  const [isRelatedDisable, setIsRelatedDisable] = useState(false);
  const [showEndDateDisclaimer, setShowEndDateDisclaimer] = useState(false);
  const lastHistory = data?.historyList?.[data.historyList.length - 1];
  const thirdlastHistory = data?.historyList?.[data.historyList.length - 3];

  const canShowResubmit =
    role === "PO_Screening" &&
    data.docNum &&
    lastHistory?.name === "Budget_Team" &&
    lastHistory?.status === "Reject";

  const canShowReject = (() => {
    if (role !== "Po_maker") return false;
    if (data.stage !== "Po_maker") return false;
    if (poattach === "Po_release") return false;
    if (poattach === "PO_Screening") {
      const isCheckerOrRelease =
        thirdlastHistory?.name === "Po_checker" ||
        thirdlastHistory?.name === "Po_release";
      return isCheckerOrRelease
        ? thirdlastHistory?.status !== "Approved"
        : true;
    }
    if (poattach === "Po_maker") {
      return praattach === "Po_checker" || praattach === "Po_release";
    }
    if (poattach === "Po_checker") {
      return praattach === "Po_release";
    }
    if (poattach === "Budget_Team") {
      return poattach === "Budget_Team";
    }
    return false;
  })();
  const canShowPoReSubmit = (() => {
    if (role !== "Po_maker") return false;
    if (data.stage !== "Po_maker") return false;
    if (poattach === "Po_maker") {
      return praattach === "Po_checker" || praattach === "Po_release";
    }
    if (poattach === "Po_checker") {
      return praattach === "Po_release";
    }
    return false;
  })();

  useEffect(() => {
    if (checkRes == "Exceed") {
      setExceedNew(true);
    } else {
      setExceedNew(false);
    }
    if (checkRes == "Not Exceed") {
      setNotExceedNew(true);
    } else {
      setNotExceedNew(false);
    }
    if (checkAvailable == "Available") {
      setAvailableNew(true);
    } else {
      setAvailableNew(false);
    }
    if (checkAvailable == "Not Available") {
      setNotAvailableNew(true);
    } else {
      setNotAvailableNew(false);
    }
  }, [checkRes, checkAvailable]);

  useEffect(() => {
    setYesCheck(isRelatedCheck === "YES");
    setNoCheck(isRelatedCheck === "NO");
    setIsBusinessApproverDisabled(isRelatedCheck === "YES");
  }, [isRelatedCheck]);

  const [formData, setFormData] = useState({});
  const [exceed, setExceed] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [vendorList, setVendorList] = useState([]);

  const [locationOptions, setLocationOptions] = useState([]);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [ckplLocations, setCkplLocations] = useState([]);
  const [inputValues, setInputValues] = useState(Array(1).fill(""));
  const [brandNames, setBrandNames] = useState([]);
  const [divisionNames, setDivisionNames] = useState([]);
  const [natureOfExpenses, setNatureOfExpenses] = useState([]);
  const [nonBrandDivision, setNonBrandDivision] = useState([]);
  const [brandDivision, setBrandDivision] = useState([]);
  const [nonBrandDepartment, setNonBrandDepartment] = useState([]);
  const [nonBrandLocation, setNonBrandLocation] = useState([]);
  const [brandRegion, setBrandRegion] = useState([]);
  const [brandSubCategory, setBrandSubCategory] = useState([]);
  const [brandChannel, setBrandChannel] = useState([]);
  const [nonbrandChannel, setNonBrandChannel] = useState([]);
  const [brandFundCenter, setBrandFundCenter] = useState([]);
  const [nonBrandCostCenterOptions, setNonBrandCostCenterOptions] = useState(
    []
  );
  const [approvers, setApprovers] = useState([]);
  const [userData, setUserData] = useState([]);
  const [rejectedUser, setRejectedUser] = useState([]);
  const [approvedUser, setApprovedUser] = useState([]);
  const [carbonCopyUsers, setCarbonCopyUsers] = useState([]);
  const [error, setErrors] = useState({});
  const [isSapValueLoading, setIsSapValueLoading] = useState(false);
  const [isBusinessApproverDisabled, setIsBusinessApproverDisabled] =
    useState(false);
  const [isSapValueGenerated, setIsSapValueGenerated] = useState(false);
  const [remarkModal, setRemarkModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draftOptions, setDraftOptions] = useState({});
  const [districtOptions, setDistrictOptions] = useState([]);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [holdModal, setHoldModal] = useState("");
  const [attachmenterror, setAttachmenterror] = useState("");
  const [attachment, setAttachment] = useState("");
  const [ckplLocationMatches, setCkplLocationMatches] = useState([]);
  const [showOtherMailInput, setShowOtherMailInput] = useState(false);
  const previousRegionRef = useRef("");
  const lastFetchedRegionsRef = useRef([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [blockedVendorModal, setBlockedVendorModal] = useState(false);
  const [notInSapModal, setNotInSapModal] = useState(false);
  const [notifModal, setNotifModal] = useState("");
  const [deliveryPlants, setDeliveryPlants] = useState([]);
  const [eBriefOptions, setEBriefOptions] = useState([]);
  const [eBriefUnavailable, setEBriefUnavailable] = useState([]);
  const [eBriefErrorMessages, setEBriefErrorMessages] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewIsImage, setPreviewIsImage] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState(null);
  const [isPoFileFetching, setIsPoFileFetching] = useState(false);
  const [poCategory, setPoCategory] = useState([]); // per-brand-index: "Material PO" | "Non-Material PO" | ""

  const isBudgetAvailable =
    formData.budgetExceedAvailable === "Available" ||
    (data?.budgetDetails?.toLowerCase().trim() === "yes" &&
      !formData.budgetExceedAvailable);

  const isBudgetNotAvailable =
    formData.budgetExceedAvailable === "Not Available" ||
    (data?.budgetDetails?.toLowerCase().trim() === "no" &&
      !formData.budgetExceedAvailable);

  const isSpecialVendor =
    !isBrand && (formData.isSpecialVendor || data.vendorCode === "3704453");

  const eBriefLink = "https://ebrief.cavininfotech.com/";
  const buildEBriefMsg = (msg) => {
    const base = (msg || "No E-brief is available for this GL code.")
      .replace(/\.?\s*Please create (a new E-brief to continue PO creation|one(\.? to continue\.?)?)\.?/i, "")
      .trim();
    return base.includes(eBriefLink) ? base : `${base} - Use this link for E Brief creation - ${eBriefLink}`;
  };

  const isMarketingSpecialVendor =
    isBrand && (formData.vendorCode === "3704453" || data.vendorCode === "3704453");

  useEffect(() => {
    if (isBrand && Pomaker?.length && isModalOpen) {
      const ranjith = Pomaker?.find((item) => item.userName?.toLowerCase() === "ranjith");
      setFormData((prev) => ({
        ...prev,
        isRelated: "YES",
        poApprover: ranjith?.id || prev.poApprover,
        poApproverName: ranjith?.userName || prev.poApproverName,
      }));
      setIsBusinessApproverDisabled(true);
    }
  }, [isBrand, Pomaker?.length, isModalOpen]);
  // Email validation helper function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isApprove = Boolean(
    (formData?.poApproverName && formData.poApproverName.trim()) ||
    (data?.poApproverId && data.poApproverId.trim())
  );


  const isPoRole = role === "Po_maker" || role === "Po_release" || role === "Po_checker";
  const isInternalAudit = role === "Internal_Audit";
  const isFieldDisabled = (fieldName, index, brandType) => {
    if (isView && !isEdit) return true;

    const brandData = formData?.brand?.[index] || data?.brand?.[index] || {};

    if (isEdit) {
      return false;
    }

    // Add null check for brandData
    if (!brandData) return true;

    if (!brandType && fieldName !== "brandOrNonBrand") {
      return fieldName !== "division" ? true : !brandData.brandOrNonBrand;
    }

    if (brandType === "Brand") {
      switch (fieldName) {
        case "division":
          return !brandData.brandOrNonBrand;
        case "brand":
          return !brandData.division;
        case "region":
          return (
            !brandData.division || (!brandData.brand && !brandData.detailsBrand)
          );
        case "channel":
          return (
            !brandData.division ||
            (!brandData.brand && !brandData.detailsBrand) ||
            !brandData.region
          );
        case "brandSubCategory":
          return (
            !brandData.division ||
            (!brandData.brand && !brandData.detailsBrand) ||
            !brandData.region ||
            !brandData.channel
          );
        case "fundCentre":
          return (
            !brandData.division ||
            (!brandData.brand && !brandData.detailsBrand) ||
            !brandData.region ||
            !brandData.channel ||
            !brandData.brandSubCategory
          );
        default:
          return false;
      }
    } else if (brandType === "NonBrand") {
      switch (fieldName) {
        case "division":
          return !brandData.brandOrNonBrand;
        case "department":
          return !brandData.division;
        case "location":
          return !brandData.division || !brandData.department;
        case "channel":
          return (
            !brandData.division || !brandData.department || !brandData.location
          );
        case "fundCentre":
          return (
            !brandData.division ||
            !brandData.department ||
            !brandData.location ||
            !brandData.channel
          );
        case "costcenter":
          return (
            !brandData.division ||
            !brandData.department ||
            !brandData.location ||
            !brandData.fundCentre
          );
        default:
          return false;
      }
    }

    return false;
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files);
    setAttachment(files);
    setAttachmenterror("");
  };

  const handlepreApprovedFilesUpload = (e, isCmdOfficeUpload = false) => {
    const files = Array.from(e.target.files);

    if (!isCmdOfficeUpload) {
      const invalidFiles = files.filter(
        (file) => !file.name.toLowerCase().endsWith(".eml")
      );
      if (invalidFiles.length > 0) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          preApprovedFiles: "Only .eml files are allowed for Pre-Approved",
        }));
        e.target.value = "";
        return;
      }
    }

    setFormData({
      ...formData,
      preApprovedFiles: [...(formData.preApprovedFiles || []), ...files],
    });
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors.preApprovedFiles;
      return newErrors;
    });
    e.target.value = "";
  };

  const [lastFetchedBrandData, setLastFetchedBrandData] = useState(null);

  useEffect(() => {
    if (data?.brand?.length && role === "Requestor") {
      const currentBrandDataString = JSON.stringify(data.brand);
      if (currentBrandDataString !== lastFetchedBrandData) {
        fetchAllDraftOptions(data.brand);
        setLastFetchedBrandData(currentBrandDataString);
      }
    }
  }, [data, formData, lastFetchedBrandData]);

  useEffect(() => {
    const brands =
      formData?.brand && formData.brand.length > 0
        ? formData.brand
        : data?.brand || [];

    if (ckplLocations.length > 0 && brands.length > 0) {
      brands.forEach((brandItem, index) => {
        const currentRegion = brandItem?.region?.trim();
        if (
          currentRegion &&
          lastFetchedRegionsRef.current[index] !== currentRegion
        ) {
          fetchCkplLocations(currentRegion, index);
          fetchDistricts(currentRegion, index);
          lastFetchedRegionsRef.current[index] = currentRegion;
        }
      });
    }
  }, [
    ckplLocations,
    (formData?.brand || data?.brand)?.map((b) => b.region).join("|"),
  ]);

  useEffect(() => {
    if (!formData.brand) return;
    setErrors((prevErrors) => {
      let newErrors = { ...prevErrors };
      formData.brand.forEach((brand, idx) => {
        if (brand?.ckplLocation && newErrors[`ckplLocation-${idx}`]) {
          delete newErrors[`ckplLocation-${idx}`];
        }
        if (brand?.gstType && newErrors[`gstType-${idx}`]) {
          delete newErrors[`gstType-${idx}`];
        }
      });
      return newErrors;
    });
  }, [
    formData.brand?.map((b) => b.ckplLocation).join("|"),
    formData.brand?.map((b) => b.gstType).join("|"),
  ]);

  useEffect(() => {
    const vendorLocation = formData?.vendorLocation || data?.vendorLocation;
    const brands = formData?.brand || data?.brand;

    if (vendorLocation && brands?.length) {
      const updatedBrands = brands.map((brand, index) => {
        const gstType = calculateGstType(
          vendorLocation,
          brand.ckplLocation,
          index
        );
        return {
          ...brand,
          gstType,
        };
      });
      setFormData((prev) => ({
        ...prev,
        brand: updatedBrands,
      }));
    }
  }, [
    formData?.vendorLocation || data?.vendorLocation,
    (formData?.brand || data?.brand)?.map((b) => b.ckplLocation).join("|"),
  ]);

  const fetchDistricts = async (region, idx) => {
    const apiUrl = `${BaseUrl}api/district?region=${encodeURIComponent(
      region
    )}`;
    setIsDistrictLoading(true);
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const districts = response?.data?.districts.map((district) => ({
        value: district,
        label: district,
      }));
      setDistrictOptions((prev) => {
        const updated = [...prev];
        updated[idx] = districts;
        return updated;
      });
    } catch (error) {
      console.error("Error fetching districts:", error);
    } finally {
      setIsDistrictLoading(false);
    }
  };

  const handleFilePreview = (file) => {
    if (typeof file === "string") {
      Attachment(file, "view");
    } else {
      const fileType = file.type || file.name.split(".").pop().toLowerCase();
      if (fileType.includes("pdf") || file.name.endsWith(".pdf")) {
        const url = URL.createObjectURL(file);
        setPreviewFile(url);
        setPreviewModalOpen(true);
      } else if (fileType.includes("image") || file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
        const url = URL.createObjectURL(file);
        setPreviewFile(url);
        setPreviewModalOpen(true);
      } else if (fileType.includes("excel") || fileType.includes("spreadsheet") || file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
        parseExcelFile(file);
      }
    }
  };

  const Attachment = async (Attachment, action = "download") => {
    setPreviewLoading(true);
    setPreviewModalOpen(true);
    const apiUrl = `${BaseUrl}api/ticket/file-download/${encodeURIComponent(
      Attachment
    )}`;
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        responseType: "blob",
      });

      const isImg = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(Attachment);
      const ext = Attachment.split('.').pop().toLowerCase();
      const mimeType = Attachment.endsWith('.pdf') ? 'application/pdf'
        : Attachment.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : Attachment.endsWith('.xls') ? 'application/vnd.ms-excel'
        : isImg ? ('image/' + (ext === 'jpg' ? 'jpeg' : ext))
        : 'application/octet-stream';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.download = Attachment;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (action === "view") {
        if (Attachment.endsWith(".pdf")) {
          setPreviewIsImage(false);
          setPreviewFile(url);
          setCurrentFileName(Attachment);
          setPreviewLoading(false);
          setPreviewModalOpen(true);
        } else if (Attachment.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
          setPreviewIsImage(true);
          setPreviewFile(url);
          setCurrentFileName(Attachment);
          setPreviewLoading(false);
          setPreviewModalOpen(true);
        } else if (Attachment.endsWith(".xls") || Attachment.endsWith(".xlsx")) {
          const file = new File([response.data], Attachment);
          setCurrentFileName(Attachment);
          parseExcelFile(file);
        } else {
          setPreviewLoading(false);
          window.open(url, "_blank");
        }
      }
    } catch (error) {
      setPreviewLoading(false);
      console.error("Error handling file:", error.message);
    }
  };

  const parseExcelFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });
      setExcelData(jsonData);
      setExcelModalOpen(true);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Failed to parse Excel file");
    }
  };
  const fetchAllDraftOptions = async (brands) => {
    try {
      const draftOptionsArray = await Promise.all(
        brands.map(async (brand, index) => {
          if (brand.brandOrNonBrand === "Brand") {
            return fetchBrandOptions(brand, index);
          } else if (brand.brandOrNonBrand === "NonBrand") {
            return fetchNonBrandOptions(brand, index);
          }
          return null;
        })
      );
      const structuredDraftOptions = draftOptionsArray.reduce((acc, item) => {
        if (item) {
          acc[item.index] = item.options;
        }
        return acc;
      }, {});
      setDraftOptions(structuredDraftOptions);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchBrandOptions = async (brand, index) => {
    try {
      const options = {};

      // Step 1: Fetch divisions first
      const divisionUrl = `${BaseUrl}api/sap/getDivisionData`;
      const divisionResponse = await axios.get(divisionUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const divisionsData = divisionResponse.data.data;
      options.division = [
        ...new Set(divisionsData.map((item) => item.division)),
      ];

      // Step 2: Fetch brands based on division
      const division = encodeURIComponent(
        brand.division || options.division[0]
      );
      const brandUrl = `${BaseUrl}api/sap/getDivisionData?division=${division}`;
      const brandResponse = await axios.get(brandUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const brandsData = brandResponse.data.data;
      options.brand = [...new Set(brandsData.map((item) => item.brand))];

      // Step 3: Fetch regions based on division and brand
      const brandName = encodeURIComponent(
        brand.detailsBrand || brand.brand || options.brand[0]
      );
      const regionUrl = `${BaseUrl}api/sap/getDivisionData?division=${division}&brand=${brandName}`;
      const regionResponse = await axios.get(regionUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const regionsData = regionResponse.data.data;
      options.region = [...new Set(regionsData.map((item) => item.region))];

      // Step 4: Fetch channels based on division, brand, and region
      const region = encodeURIComponent(brand.region || options.region[0]);
      const channelUrl = `${BaseUrl}api/sap/getDivisionData?division=${division}&brand=${brandName}&region=${region}`;
      const channelResponse = await axios.get(channelUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const channelsData = channelResponse.data.data;
      options.channel = [...new Set(channelsData.map((item) => item.channel))];

      // Step 5: Fetch brandSubCategory based on division, brand, region, and channel
      const channel = encodeURIComponent(brand.channel || options.channel[0]);
      const brandSubCategoryUrl = `${BaseUrl}api/sap/getDivisionData?division=${division}&brand=${brandName}&region=${region}&channel=${channel}`;
      const brandSubCategoryResponse = await axios.get(brandSubCategoryUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const brandSubCategoryData = brandSubCategoryResponse.data.data;
      options.brandSubCategory = [
        ...new Set(brandSubCategoryData.map((item) => item.brandSubCategory)),
      ];

      // Step 6: Fetch fundCentres based on all previous selections
      const brandSubCategory = encodeURIComponent(
        brand.brandSubCategory || options.brandSubCategory[0]
      );
      const fundCentreUrl = `${BaseUrl}api/sap/getDivisionData?division=${division}&brand=${brandName}&region=${region}&channel=${channel}&brandSubCategory=${brandSubCategory}`;
      const fundCentreResponse = await axios.get(fundCentreUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const fundCentresData = fundCentreResponse.data.data;
      options.fundCentre = [
        ...new Set(fundCentresData.map((item) => item.fundcenter)),
      ];

      return { index, options };
    } catch (error) {
      console.error(`Error fetching brand options for index ${index}:`, error);
      return { index, options: {} };
    }
  };

  const fetchNonBrandOptions = async (brand, index) => {
    try {
      const options = {};

      // Step 1: Fetch divisions for NonBrand
      const brandType = "NonBrand";
      const nonBrandUrl = `${BaseUrl}api/sap/getNonBrandData?brandType=${brandType}`;
      const nonBrandResponse = await axios.get(nonBrandUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const nonBrandData = nonBrandResponse.data.data;
      options.division = [
        ...new Set(nonBrandData.map((item) => item.division)),
      ];

      // Step 2: Fetch departments
      const division = encodeURIComponent(
        brand.division || options.division[0]
      );
      const departmentUrl = `${BaseUrl}api/sap/getNonBrandData?brandType=${brandType}&division=${division}`;
      const departmentResponse = await axios.get(departmentUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const departmentsData = departmentResponse.data.data;
      options.department = [
        ...new Set(departmentsData.map((item) => item.department)),
      ];

      // Step 3: Fetch channels for NonBrand
      const department = encodeURIComponent(
        brand.department || options.department[0]
      );
      const channelUrl = `${BaseUrl}api/sap/getNonBrandData?brandType=${brandType}&division=${division}&department=${department}`;
      const channelResponse = await axios.get(channelUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const channelsData = channelResponse.data.data;
      options.channel = [
        ...new Set(channelsData.map((item) => item.channel)),
      ];

      // Step 4: Fetch locations
      const channel = encodeURIComponent(
        brand.channel || options.channel[0]
      );
      const locationUrl = `${BaseUrl}api/sap/getNonBrandData?brandType=${brandType}&division=${division}&department=${department}&channel=${channel}`;
      const locationResponse = await axios.get(locationUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const locationsData = locationResponse.data.data;
      options.location = [
        ...new Set(locationsData.map((item) => item.location)),
      ];

      // Step 5: Fetch fundCentres
      const location = encodeURIComponent(
        brand.location || options.location[0]
      );
      const fundCentreUrl = `${BaseUrl}api/sap/getNonBrandData?brandType=${brandType}&division=${division}&department=${department}&channel=${channel}&location=${location}`;
      const fundCentreResponse = await axios.get(fundCentreUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const fundCentresData = fundCentreResponse.data.data;
      options.fundCentre = [
        ...new Set(fundCentresData.map((item) => item.fundcenter)),
      ];

      return { index, options };
    } catch (error) {
      console.error(
        `Error fetching non-brand options for index ${index}:`,
        error
      );
      return { index, options: {} };
    }
  };

  const handleRCancel = () => {
    setRemarkModal(false);
    resetForm();
    setFormData({ remarks: "" });
  };
  const handleACancel = () => {
    setApproveModal(false);
    // resetForm();
    setFormData({
      ...formData,
      remarks: "",
    });
  };
  const handleCCancel = () => {
    setShowConfirm(false);
  };

  const handleHCancel = () => {
    setHoldModal(false);
    resetForm();
    setFormData({ remarks: "" });
    setErrors({});
  };

  useEffect(() => {
    handleRCancel();
    handleACancel();
  }, [isModalView]);
  const calculateGstType = (vendorLoc, ckplLoc, index) => {
    if (
      typeof index === "number" &&
      formData?.brand &&
      formData.brand[index] &&
      formData.brand[index].gstType
    ) {
      return formData.brand[index].gstType;
    }
    if (!vendorLoc || !ckplLoc) return "";
    const isIntra = ckplLoc.toLowerCase().includes(vendorLoc.toLowerCase());
    return isIntra ? "Intra" : "Inter";
  };

  const [vendorCodeOptions, setVendorCodeOptions] = useState([]);

  const { control, handleSubmit, setValue, reset } = useForm();

  const clearVendorFields = () => {
    setValue("vendorName", "");
    setFormData((prev) => ({
      ...prev,
      vendorName: "",
      vendorCode: "",
      gstNo: "",
      vendorMailId: "",
      mailId: "",
      customMailId: "",
      currency: "",
      paymentTerm: "",
      accountNumber: "",
      vendorLocation: "",
    }));
    setLocationOptions([]);
    setVendorCodeOptions([]);
    setShowOtherMailInput(false);
  };

   const handleVendorChange = (value) => {
    const all = vendorList[value] || [];
    const uniqueLocations = [...new Set(all.map((v) => v.location).filter(Boolean))];
    const clearFields = {
      vendorName: value, vendorLocation: "", vendorCode: "", gstNo: "",
      vendorMailId: "", mailId: "", customMailId: "", currency: "",
      paymentTerm: "", accountNumber: "", gstType: "", isSpecialVendor: false,
    };
    setFormData((prev) => {
      let updated = { ...prev };
      if (Array.isArray(updated.brand)) {
        updated.brand = updated.brand.map((b) => ({ ...b, gstType: "" }));
      }

      if (uniqueLocations.length === 1) {
        const activeVendors = all.filter((v) => v.status !== "Yes" && v.status !== null && v.status !== undefined);
        const blockedAll = all.every((v) => v.status === "Yes");
        const noneValid = activeVendors.length === 0;

        if (blockedAll) {
          setBlockedVendorModal(true);
          return prev;
        }
        if (noneValid) {
          setNotInSapModal(true);
          return prev;
        }

        if (activeVendors.length === 1) {
          const v = activeVendors[0];
          setLocationOptions([]);
          setVendorCodeOptions([]);
          setShowOtherMailInput(false);
          return {
            ...updated, ...clearFields,
            vendorLocation: v.location || v.country,
            vendorCode: v.vendorCode, gstNo: v.gstNo,
            vendorMailId: v.mailId, currency: v.currency,
            paymentTerm: v.paymentTerm, accountNumber: v.accountNumber,
            isSpecialVendor: v.vendorCode === "3704453",
          };
        }
        setVendorCodeOptions(activeVendors.map((v) => ({ value: v.vendorCode, label: v.vendorCode })));
        setLocationOptions([]);
        setShowOtherMailInput(false);
        return {
          ...updated, ...clearFields,
          vendorLocation: activeVendors[0].location || activeVendors[0].country,
          vendorMailId: activeVendors.map((v) => v.mailId).join(","),
        };
      }

      if (uniqueLocations.length > 1) {
        setLocationOptions(uniqueLocations.map((l) => ({ value: l, label: l })));
        setVendorCodeOptions([]);
        setShowOtherMailInput(false);
        return { ...updated, ...clearFields, ckplLocation: "" };
      }

      setLocationOptions([]);
      setVendorCodeOptions([]);
      setShowOtherMailInput(false);
      return { ...updated, ...clearFields };
    });
    setErrors((prev) => {
      const e = { ...prev };
      ["vendorName","vendorLocation","vendorCode","gstNo","vendorMailId","currency","paymentTerm"]
        .forEach((k) => delete e[k]);
      return e;
    });
  };

  const handleLocationChange = (value) => {
    const all = vendorList[formData.vendorName] || [];
    const vendorsAtLocation = all.filter((v) => v.location === value);
    const isBlocked = vendorsAtLocation.every((v) => v.status === "Yes");
    const hasValid = vendorsAtLocation.some((v) => v.status !== "Yes" && v.status !== null && v.status !== undefined);

    if (isBlocked) {
      setBlockedVendorModal(true);
      return;
    }
    if (!hasValid) {
      setNotInSapModal(true);
      setValue("vendorLocation", "");
      setFormData((prev) => ({
        ...prev,
        vendorLocation: "", vendorCode: "", gstNo: "",
        vendorMailId: "", currency: "", paymentTerm: "",
        accountNumber: "", gstType: "",
      }));
      setVendorCodeOptions([]);
      return;
    }

    const activeAtLoc = vendorsAtLocation.filter((v) => v.status !== "Yes" && v.status !== null && v.status !== undefined);

    if (activeAtLoc.length === 1) {
      const v = activeAtLoc[0];
      setVendorCodeOptions([]);
      setFormData((prev) => ({
        ...prev, vendorLocation: value,
        vendorCode: v.vendorCode, gstNo: v.gstNo,
        vendorMailId: v.mailId, currency: v.currency,
        paymentTerm: v.paymentTerm, accountNumber: v.accountNumber,
        gstType: "", isSpecialVendor: v.vendorCode === "3704453",
      }));
    } else {
      setVendorCodeOptions(activeAtLoc.map((v) => ({ value: v.vendorCode, label: v.vendorCode })));
      setFormData((prev) => ({
        ...prev, vendorLocation: value, vendorCode: "", gstNo: "",
        vendorMailId: activeAtLoc.map((v) => v.mailId).join(","),
        currency: "", paymentTerm: "", accountNumber: "",
        gstType: "", isSpecialVendor: false,
      }));
    }
    setErrors((prev) => {
      const e = { ...prev };
      delete e.vendorLocation;
      return e;
    });
  };

  const handleVendorCodeChange = (value) => {
    const all = vendorList[formData.vendorName] || [];
    const v = all.find((v) => v.vendorCode === value && v.location === formData.vendorLocation);
    if (v) {
      setFormData((prev) => ({
        ...prev, vendorCode: v.vendorCode, gstNo: v.gstNo,
        vendorMailId: v.mailId, currency: v.currency,
        paymentTerm: v.paymentTerm, accountNumber: v.accountNumber,
        gstType: "", isSpecialVendor: v.vendorCode === "3704453",
      }));
    }
  };

 const natureOfExpensesChange = async (value, name, index) => {
    try {
      const response = await axios.get(
        BaseUrl + `api/sap/Gldescription?Gldescription=${encodeURIComponent(value)}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      const responseData = response.data?.[0];

      if (!responseData) {
        console.error("No data returned from API");
        return;
      }

      setFormData((prevFormData) => {
        const updatedBrand = prevFormData.brand ? [...prevFormData.brand] : [];

        if (index === 0) {
          const maxLength = Math.max(updatedBrand.length, inputValues.length);

          for (let idx = 0; idx < maxLength; idx++) {
            if (!updatedBrand[idx]) {
              updatedBrand[idx] = {};
            }

            updatedBrand[idx] = {
              ...updatedBrand[idx],
              [name]: value,
              commitmentItem: responseData?.cmmtitem || "",
              glDescription: responseData?.gldescription || "",
              glCode: responseData?.glacct || "",
            };
          }
        } else {
          const firstIndexValue = updatedBrand[0]?.natureOfExpenses;

          if (!firstIndexValue) {
            updatedBrand[index] = {
              ...updatedBrand[index],
              [name]: value,
              commitmentItem: responseData?.cmmtitem || "",
              glDescription: responseData?.gldescription || "",
              glCode: responseData?.glacct || "",
            };
          } else if (firstIndexValue === value) {
            updatedBrand[index] = {
              ...updatedBrand[index],
              [name]: value,
              commitmentItem: responseData?.cmmtitem || "",
              glDescription: responseData?.gldescription || "",
              glCode: responseData?.glacct || "",
            };
          }
        }

        return {
          ...prevFormData,
          brand: updatedBrand,
        };
      });
    } catch (error) {
      console.error("Error fetching nature of expenses:", error);
    }
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      const fieldName = "natureOfExpenses";
      const errorKey = `${fieldName}-${index}`;
      delete newErrors[errorKey];
      return newErrors;
    });
    if (value !== "ADVERTISEMENT PRODUCTION-POP") {
      setPoCategory((prev) => {
        const updated = [...prev];
        updated[index] = "";
        return updated;
      });
      setFormData((prev) => {
        const updatedBrand = [...(prev.brand || [])];
        updatedBrand[index] = { ...updatedBrand[index], materialPo: null, materialCode: "", deliveryPlant: "" };
        return { ...prev, brand: updatedBrand };
      });
    }
  };

  const handleInputChange = async (value, name, index, l) => {
    if (name === "region") {
      fetchCkplLocations(value, index);
      fetchDistricts(value, index);
    }
    const processedValue = Array.isArray(value) ? value[0] : value;
    const isFormDataEmpty = Object.values(formData).every(
      (value) => value === ""
    );
    const currentFormData = isEdit && isFormDataEmpty ? data : formData;

    const updatedBrand = currentFormData.brand
      ? [...currentFormData.brand]
      : [];

    if (isEdit && name !== "division") {
      updatedBrand[index] = {
        ...updatedBrand[index],
        brand:
          updatedBrand[index]?.detailsBrand || updatedBrand[index]?.brand || "",
      };
    }
    updatedBrand[index] = {
      ...updatedBrand[index],
      [name]: processedValue,
      ...(name === "brand" && { detailsBrand: processedValue }),
      ...(name === "region" && { district: [] }),
    };

    const resetProperties = (keys) => {
      keys.forEach((key) => {
        updatedBrand[index][key] = "";
        if (data?.brand?.[index]) {
          data.brand[index][key] = "";
        }
      });
    };

    const nextBrandData = updatedBrand[index];
    const isBrandType = nextBrandData.brandOrNonBrand === "Brand";
    const isNonBrandType = nextBrandData.brandOrNonBrand === "NonBrand";

    // Handle Brand type dependent dropdowns: division → brand → region → channel → brandSubCategory → fundCentre
    if (isBrandType) {
      if (name === "division") {
        resetProperties([
          "brand",
          "region",
          "channel",
          "brandSubCategory",
          "detailsBrand",
          "fundCentre",
          "internalorder",
        ]);
        if (data && typeof data === "object") {
          data.ckplLocation = "";
        }
        setBrandNames([]);
        setBrandRegion([]);
        setBrandChannel([]);
        setBrandSubCategory([]);
        setBrandFundCenter([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            brand: [],
            region: [],
            channel: [],
            brandSubCategory: [],
            fundCentre: [],
          },
        }));
      } else if (name === "brand") {
        resetProperties([
          "region",
          "channel",
          "brandSubCategory",
          "fundCentre",
          "internalorder",
        ]);
        setBrandRegion([]);
        setBrandChannel([]);
        setBrandSubCategory([]);
        setBrandFundCenter([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            region: [],
            channel: [],
            brandSubCategory: [],
            fundCentre: [],
          },
        }));
      } else if (name === "region") {
        resetProperties([
          "channel",
          "brandSubCategory",
          "fundCentre",
          "internalorder",
        ]);
        setBrandChannel([]);
        setBrandSubCategory([]);
        setBrandFundCenter([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            channel: [],
            brandSubCategory: [],
            fundCentre: [],
          },
        }));
      } else if (name === "channel") {
        resetProperties(["brandSubCategory", "fundCentre", "internalorder"]);
        setBrandSubCategory([]);
        setBrandFundCenter([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            brandSubCategory: [],
            fundCentre: [],
          },
        }));
      } else if (name === "brandSubCategory") {
        resetProperties(["fundCentre", "internalorder"]);
        setBrandFundCenter([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            fundCentre: [],
          },
        }));
      } else if (name === "fundCentre") {
        resetProperties(["internalorder"]);
      }
    }

    // Handle NonBrand type dependent dropdowns: division → department → location → fundCentre
    if (isNonBrandType) {
      if (name === "division") {
        resetProperties(["department", "location", "channel", "fundCentre", "costcenter"]);
        setNonBrandDepartment([]);
        setNonBrandChannel([]);
        setNonBrandLocation([]);
        setBrandFundCenter([]);
        setNonBrandCostCenterOptions([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            department: [],
            location: [],
            channel: [],
            fundCentre: [],
            costcenter: [],
          },
        }));
      } else if (name === "department") {
        resetProperties(["location", "channel", "fundCentre", "costcenter"]);
        setNonBrandLocation([]);
        setNonBrandChannel([]);
        setBrandFundCenter([]);
        setNonBrandCostCenterOptions([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            location: [],
            channel: [],
            fundCentre: [],
            costcenter: [],
          },
        }));
      } else if (name === "location") {
        resetProperties(["fundCentre", "costcenter"]);
        setBrandFundCenter([]);
        setNonBrandCostCenterOptions([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            fundCentre: [],
            costcenter: [],
          },
        }));
      } else if (name === "fundCentre") {
        resetProperties(["costcenter"]);
        setNonBrandCostCenterOptions([]);
        setDraftOptions((prevDraftOptions) => ({
          ...prevDraftOptions,
          [index]: {
            ...(prevDraftOptions?.[index] || {}),
            costcenter: [],
          },
        }));
      }
    }

    const updatedFormData = {
      ...currentFormData,
      brand: updatedBrand,
    };

    setFormData(updatedFormData);

    // Build API URL based on brand type
    const queryParams = new URLSearchParams();
    let apiUrl = "";

    if (isBrandType) {
      // For Brand type: division → brand → region → channel → brandSubCategory → fundCentre
      const brandParams = [
        "division",
        "brand",
        "region",
        "channel",
        "brandSubCategory",
        "fundCentre",
      ];
      brandParams.forEach((param) => {
        if (nextBrandData[param]) {
          const paramValue =
            param === "brand"
              ? nextBrandData.detailsBrand || nextBrandData.brand
              : nextBrandData[param];
          if (paramValue) queryParams.append(param, paramValue);
        }
      });
      apiUrl = `${BaseUrl}api/sap/getDivisionData?${queryParams.toString()}`;
    } else if (isNonBrandType) {
      // For NonBrand type
      queryParams.set("brandType", "NonBrand");
      const nonBrandParams = ["division", "department", "channel", "location"];
      nonBrandParams.forEach((param) => {
        if (nextBrandData[param]) queryParams.append(param, nextBrandData[param]);
      });
      if (nextBrandData["fundCentre"]) queryParams.append("fundcenter", nextBrandData["fundCentre"]);
      apiUrl = `${BaseUrl}api/sap/getNonBrandData?${queryParams.toString()}`;
    }

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.data && response.data.data) {
        const responseData = response.data.data;
        const extractUnique = (key) => [
          ...new Set(responseData.map((item) => item[key])),
        ];

        // Handle Brand type responses
        if (isBrandType) {
          if (name === "division" && processedValue) {
            setBrandNames(extractUnique("brand"));
            setBrandRegion([]);
            setBrandChannel([]);
            setBrandSubCategory([]);
            setBrandFundCenter([]);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                brand: extractUnique("brand"),
                region: [],
                channel: [],
                brandSubCategory: [],
                fundCentre: [],
              };
              return updatedDraftOptions;
            });
          } else if (name === "brand" && nextBrandData.division) {
            const regionOptions = extractUnique("region");
            setBrandRegion(regionOptions);
            setBrandChannel([]);
            setBrandSubCategory([]);
            setBrandFundCenter([]);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                region: regionOptions,
                channel: [],
                brandSubCategory: [],
                fundCentre: [],
              };
              return updatedDraftOptions;
            });

            // Auto-select region if only one option
            let selectedRegion = nextBrandData.region;
            if (!selectedRegion && regionOptions.length === 1) {
              selectedRegion = regionOptions[0];
              updatedBrand[index] = {
                ...updatedBrand[index],
                region: selectedRegion,
              };
            }

            // Compute channel options based on selected region (if any)
            const filteredForRegion = selectedRegion
              ? responseData.filter((item) => item.region === selectedRegion)
              : responseData;
            const channelOptions = [
              ...new Set(filteredForRegion.map((item) => item.channel)),
            ];
            setBrandChannel(channelOptions);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                channel: channelOptions,
              };
              return updatedDraftOptions;
            });

            // Auto-select channel if only one option
            let selectedChannel =
              updatedBrand[index]?.channel || nextBrandData.channel;
            if (!selectedChannel && channelOptions.length === 1) {
              selectedChannel = channelOptions[0];
              updatedBrand[index] = {
                ...updatedBrand[index],
                channel: selectedChannel,
              };
            }

            // Populate brandSubCategory options when region and channel are available
            const filteredForChannel = selectedChannel
              ? filteredForRegion.filter(
                (item) => item.channel === selectedChannel
              )
              : filteredForRegion;
            const subCategoryOptions = [
              ...new Set(
                filteredForChannel.map((item) => item.brandSubCategory)
              ),
            ];
            setBrandSubCategory(subCategoryOptions);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                brandSubCategory: subCategoryOptions,
              };
              return updatedDraftOptions;
            });

            // Auto-select brandSubCategory if only one option is available
            let selectedSubCategory =
              updatedBrand[index]?.brandSubCategory ||
              nextBrandData.brandSubCategory;
            if (!selectedSubCategory && subCategoryOptions.length === 1) {
              selectedSubCategory = subCategoryOptions[0];
              updatedBrand[index] = {
                ...updatedBrand[index],
                brandSubCategory: selectedSubCategory,
              };
            }

            // Persist auto-selected region/channel back to formData
            setFormData({
              ...updatedFormData,
              brand: updatedBrand,
            });
          } else if (name === "region" && nextBrandData.brand) {
            setBrandChannel(extractUnique("channel"));
            setBrandSubCategory([]);
            setBrandFundCenter([]);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                channel: extractUnique("channel"),
                brandSubCategory: [],
                fundCentre: [],
              };
              return updatedDraftOptions;
            });
          } else if (name === "channel" && nextBrandData.region) {
            setBrandSubCategory(extractUnique("brandSubCategory"));
            setBrandFundCenter([]);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                brandSubCategory: extractUnique("brandSubCategory"),
                fundCentre: [],
              };
              return updatedDraftOptions;
            });
          } else if (name === "brandSubCategory" && nextBrandData.channel) {
            const fundCentreOptions = extractUnique("fundcenter");
            setBrandFundCenter(fundCentreOptions);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                fundCentre: fundCentreOptions,
              };
              return updatedDraftOptions;
            });

            // Auto-select fundCentre if only one option is available and set internalorder/costcenter if present
            let selectedFundCentre =
              updatedBrand[index]?.fundCentre || nextBrandData.fundCentre;
            if (!selectedFundCentre && fundCentreOptions.length === 1) {
              selectedFundCentre = fundCentreOptions[0];
              const matched = responseData.find(
                (i) => i.fundcenter === selectedFundCentre
              );
              updatedBrand[index] = {
                ...updatedBrand[index],
                fundCentre: selectedFundCentre,
                internalorder:
                  matched?.internalorder ||
                  updatedBrand[index]?.internalorder ||
                  "",
                costcenter:
                  matched?.costcenter || updatedBrand[index]?.costcenter || "",
              };
              setFormData({
                ...updatedFormData,
                brand: updatedBrand,
              });
            }
          }
        }

        // Handle NonBrand type responses
        if (isNonBrandType) {
          if (name === "division" && processedValue) {
            setNonBrandDepartment(extractUnique("department"));
            setNonBrandLocation([]);
            setBrandFundCenter([]);
            setNonBrandCostCenterOptions([]);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                department: extractUnique("department"),
                location: [],
                fundCentre: [],
              };
              return updatedDraftOptions;
            });
          } else if (name === "department" && nextBrandData.division) {
            const channelOptions = extractUnique("channel");
            const locationOptions = extractUnique("location");

            setNonBrandChannel(channelOptions);
            setNonBrandLocation(locationOptions);
            setBrandFundCenter([]);
            setNonBrandCostCenterOptions([]);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                channel: channelOptions,
                location: locationOptions,
                fundCentre: [],
              };
              return updatedDraftOptions;
            });
          } else if (name === "location") {
            if (responseData.length > 0) {
              updatedBrand[index] = {
                ...updatedBrand[index],
                ckplLocation: processedValue,
              };
            }
          } else if (name === "channel") {
            const fundCenterOptions = extractUnique("fundcenter");
            const costCenterOptions = extractUnique("costcenter");

            setBrandFundCenter(fundCenterOptions);
            setNonBrandCostCenterOptions(costCenterOptions);
            setDraftOptions((prevDraftOptions) => {
              const updatedDraftOptions = Array.isArray(prevDraftOptions)
                ? [...prevDraftOptions]
                : [prevDraftOptions];
              updatedDraftOptions[index] = {
                ...updatedDraftOptions[index],
                fundCentre: fundCenterOptions,
                costcenter: costCenterOptions,
              };
              return updatedDraftOptions;
            });

            // Auto-select fundCentre if only one unique option
            if (fundCenterOptions.length === 1) {
              updatedBrand[index] = {
                ...updatedBrand[index],
                fundCentre: fundCenterOptions[0],
              };
              setFormData({
                ...updatedFormData,
                brand: updatedBrand,
              });
            }
          } else if (name === "fundCentre" && nextBrandData.location) {
            if (responseData.length > 0) {
              const costCenterOptions = extractUnique("costcenter");
              setNonBrandCostCenterOptions(costCenterOptions);
              setDraftOptions((prevDraftOptions) => {
                const updatedDraftOptions = Array.isArray(prevDraftOptions)
                  ? [...prevDraftOptions]
                  : [prevDraftOptions];
                updatedDraftOptions[index] = {
                  ...updatedDraftOptions[index],
                  costcenter: costCenterOptions,
                };
                return updatedDraftOptions;
              });
              const selectedFundCentre = responseData.find(
                (item) => item.fundcenter === processedValue
              );
              if (selectedFundCentre) {
                updatedBrand[index] = {
                  ...updatedBrand[index],
                  internalorder: selectedFundCentre.internalorder || "",
                  ...(costCenterOptions.length === 1 && { costcenter: costCenterOptions[0] }),
                };
                setFormData({
                  ...updatedFormData,
                  brand: updatedBrand,
                });
              }
            }
          }
        }

        // Auto-populate if only one option is available
        if (responseData.length === 1) {
          const autoPopulateData = { ...responseData[0] };

          // Ensure fundCentre is properly mapped from fundcenter
          if (responseData[0].fundcenter) {
            autoPopulateData.fundCentre = responseData[0].fundcenter;
          }

          if (isNonBrandType && responseData[0].location) {
            autoPopulateData.ckplLocation = responseData[0].location;
          }

          updatedBrand[index] = {
            ...updatedBrand[index],
            ...autoPopulateData,
          };
          setFormData({
            ...updatedFormData,
            brand: updatedBrand,
          });
        }

        // Handle internal order and cost center for fundCentre (Brand type)
        if (name === "fundCentre" && isBrandType && responseData.length > 0) {
          const selectedFundCentre = responseData.find(
            (item) => item.fundcenter === processedValue
          );
          if (selectedFundCentre) {
            const { internalorder = "", costcenter = "" } = selectedFundCentre;
            updatedBrand[index] = {
              ...updatedBrand[index],
              internalorder,
              costcenter,
            };

            setFormData({
              ...updatedFormData,
              brand: updatedBrand,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching brand data:", error);
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleMultiFileSelectChange = (files) => {
    const selectedFiles = Array.from(files);
    setFormData((prevState) => {
      const existing = Array.isArray(prevState.attachment)
        ? prevState.attachment
        : prevState.attachment === null
          ? [] 
          : Array.isArray(data.attachment)
            ? data.attachment
            : [];
      const updatedAttachments = [...existing, ...selectedFiles];
      const filesWithNames = updatedAttachments.filter(
        (file) => typeof file === "string"
      );
      return {
        ...prevState,
        attachment: updatedAttachments,
        attachmentsPath: filesWithNames,
        ...(role === "Po_maker" && { poattachment: updatedAttachments }),
      };
    });
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors.attachment;
      return newErrors;
    });
  };

  const handleMultiPoFileSelectChange = (files) => {
    const selectedFiles = Array.from(files);
    setFormData((prevState) => {
      const updatedAttachments = [
        ...(Array.isArray(prevState.poattachment)
          ? prevState.poattachment
          : []),
        ...(Array.isArray(data.poattachment) ? data.poattachment : []),
        ...selectedFiles,
      ];
      return {
        ...prevState,
        poattachment: updatedAttachments,
      };
    });
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors.poattachment;
      return newErrors;
    });
  };
  const handleRemoveFile = (index) => {
    setFormData((prevState) => {
      const attachment = Array.isArray(prevState.attachment)
        ? [...prevState.attachment]
        : Array.isArray(data.attachment)
          ? [...data.attachment]
          : [];

      attachment.splice(index, 1);

      return {
        ...prevState,
        attachment: attachment.length > 0 ? attachment : null,
        attachmentsPath:
          attachment.length > 0
            ? attachment.filter((file) => typeof file === "string")
            : null,
      };
    });
  };
  const handleRemovePoFile = (index) => {
    setFormData((prevState) => {
      const poattachment = Array.isArray(prevState.poattachment)
        ? [...prevState.poattachment]
        : Array.isArray(data.poattachment)
          ? [...data.poattachment]
          : [];

      poattachment.splice(index, 1);

      return {
        ...prevState,
        poattachment: poattachment.length > -1 ? poattachment : null,
      };
    });
  };

  const handleMultiSelectChange = (value, name, index) => {
    setFormData((prevFormData) => {
      let updatedFormData = { ...prevFormData };

      if (
        name === "value" ||
        name === "poDescription" ||
        name === "costcenter" ||
        name === "district" ||
        name === "materialCode" ||
        name === "deliveryPlant" ||
        name === "sacHsnCode"
      ) {
        const updatedBrand = prevFormData.brand ? [...prevFormData.brand] : [];
        updatedBrand[index] = {
          ...updatedBrand[index],
          [name]: value,
        };

        updatedFormData = {
          ...updatedFormData,
          brand: updatedBrand,
        };

        if (name === "value") {
          const totalBaseValue = updatedBrand.reduce((acc, current) => {
            if (current && current.value) {
              return acc + parseFloat(current.value);
            }
            return acc;
          }, 0);
          updatedFormData.totalBaseValue = totalBaseValue;
        }
      } else {
        updatedFormData = {
          ...updatedFormData,
          [name]: value,
        };
      }

      return updatedFormData;
    });
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (newErrors[name]) {
        delete newErrors[name];
      }

      if (index !== undefined && newErrors[`${name}-${index}`]) {
        delete newErrors[`${name}-${index}`];
      }

      return newErrors;
    });
  };

  const fetchVendorList = async () => {
    try {
      const response = await axios.get(`${BaseUrl}api/sap/getVendorList`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.data && response.data.data) {
        const responseData = response.data.data;

        const groupedVendors = responseData.reduce((acc, item) => {
          if (!acc[item.vendorName]) {
            acc[item.vendorName] = [];
          }
          acc[item.vendorName].push(item);
          return acc;
        }, {});

        setVendorList(groupedVendors);
        setDataFetched(true);
      }
    } catch (error) {
      console.error("Error fetching vendor list:", error);
    }
  };

  const fetchBusinessApprovers = async (totalBaseValue, glCode) => {
    setApprovers([]);
    try {
      const url = glCode
        ? `${BaseUrl}budget/by-limit-ba?limit=${totalBaseValue}&glCode=${glCode}&type=${localStorage.getItem("selectedTicketTab") === "Brand"
          ? "Brand"
          : "NonBrand"
        }`
        : `${BaseUrl}budget/by-limit-ba?limit=${totalBaseValue}&type=${localStorage.getItem("selectedTicketTab") === "Brand"
          ? "Brand"
          : "NonBrand"
        }`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setApprovers(response.data.users);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Unknown error";
      if (
        errorMessage.includes("GL Code") &&
        errorMessage.includes("not found")
      ) {
        fetchBusinessApprovers(totalBaseValue);
      }
    }
  };
  const userFetch = async (status) => {
    try {
      let apiUrl =
        BaseUrl +
        `api/auth/nextstage-users?stage=${role}&ticketType=${localStorage.getItem("selectedTicketTab") === "Brand"
          ? "Brand"
          : "NonBrand"
        }&ticketId=${data?.id || ""}`;

      if (status && role === "Po_maker") {
        apiUrl += `&status=${status}`;
      }

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const userData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      if (!status) {
        setUserData(userData);
      } else {
        if (status === "Approved") {
          setApprovedUser(userData);
        } else if (status === "Reject") {
          setRejectedUser(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchCarbonCopyUsers = async () => {
    try {
      const response = await axios.get(`${BaseUrl}api/auth/all-ba-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setCarbonCopyUsers(response.data);
    } catch (error) {
      console.error("Error fetching carbon copy users:", error);
    }
  };
  useEffect(() => {
    if (
      (formData.totalBaseValue || data.totalBaseValue) &&
      (formData?.brand?.[0]?.glCode || data?.brand?.[0]?.glCode)
    ) {
      setSelfApproval(false);
      fetchBusinessApprovers(
        formData.totalBaseValue || data.totalBaseValue,
        formData?.brand?.[0]?.glCode || data?.brand?.[0]?.glCode
      );
    }
  }, [
    formData.totalBaseValue,
    data.totalBaseValue,
    formData?.brand?.[0]?.glCode,
    data?.brand?.[0]?.glCode,
  ]);
  const fetchBudgetValidation = async () => {
    const userId = localStorage.getItem("id");
    const isBrandTab =
      localStorage.getItem("selectedTicketTab")?.toLowerCase().trim() ===
      "brand";

    try {
      const glCodeValue =
        formData?.brand?.[0]?.glCode || data?.brand?.[0]?.glCode || "";
      const totalBaseValue = formData.totalBaseValue || data.totalBaseValue;

      // Build query parameters
      const queryParams = new URLSearchParams();

      if (totalBaseValue) {
        queryParams.append("limit", totalBaseValue);
      }
      queryParams.append("userId", userId);

      if (glCodeValue) {
        queryParams.append("glCode", glCodeValue);
      }

      const response = await axios.get(
        `${BaseUrl}budget/validate-user?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );

      const message = response.data.message;

      if (
        isBrandTab &&
        ((message === "User is eligible" && role === "Requestor") ||
          (role !== "Requestor" && data?.selfApprove))
      ) {
        setSelfApproval(true);
      } else if (message === "User is not eligible") {
        setSelfApproval(false);
      }

      if (
        isBrandTab &&
        message === "User is within budget range" &&
        role === "Requestor"
      ) {
        setSelfApproval(true);
        setBudgetApproval(true);
      }
    } catch (error) {
      setBudgetApproval(false);
      if (isBrandTab && role !== "Requestor" && data?.selfApprove) {
        setSelfApproval(true);
      }
      console.error("Error fetching business approvers:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(BaseUrl + "api/sap/getAllCkplLocation", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setCkplLocations(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };
  const fetchNatureofExpenses = async (type) => {
    try {
      const response = await axios.get(
        BaseUrl + `api/gldetails/getAllGlDetails?type=${type}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      if (response.status === 200) {
        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        setNatureOfExpenses(data?.gldescription || []);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };
  const fetchBrandNames = async () => {
    try {
      // Fetch divisions first for Brand type
      const response = await axios.get(BaseUrl + "api/sap/getDivisionData", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.status === 200) {
        const responseData = response.data.data || [];
        const uniqueDivisions = Array.from(
          new Set(responseData.map((item) => item.division))
        );
        setDivisionNames(uniqueDivisions);
        setBrandNames([]);
        setBrandSubCategory([]);
        setBrandRegion([]);
        setBrandChannel([]);
        setBrandFundCenter([]);
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };
  const fetchCkplLocations = async (selectedRegion, idx) => {
    if (!ckplLocations || ckplLocations.length === 0) {
      // Optionally, you can retry after a short delay or just return
      return;
    }
    try {
      const response = await axios.get(
        BaseUrl + `api/sap/by-region?region=${selectedRegion}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
        if (response.status === 200) {
        const responseData = response.data || [];
        const matches = responseData.filter((locationData) => {
          if (locationData.region && locationData.region.includes("-All India")) {
            return locationData.searchTerm === "HO01";
          }
          return ckplLocations.some((optionStr) =>
            optionStr.includes(locationData.plantSearchTerm)
          );
        });
        setCkplLocationMatches((prev) => {
          const updated = [...prev];
          updated[idx] = matches;
          return updated;
        });
        if (matches.length === 1) {
          const matchingLocation = matches[0];
          const ckplLocationValue = matchingLocation.region && matchingLocation.region.includes("-All India")
            ? `ISD/${matchingLocation.searchTerm}`
            : `${matchingLocation.searchTerm}-${matchingLocation.plantSearchTerm},${matchingLocation.city}`;
          setFormData((prevFormData) => {
            const updatedBrand = [...(prevFormData.brand || [])];
            updatedBrand[idx] = {
              ...updatedBrand[idx],
              ckplLocation: ckplLocationValue,
              gstType: calculateGstType(
                prevFormData.vendorLocation || data?.vendorLocation || "",
                matchingLocation.city,
                idx
              ),
            };
            return { ...prevFormData, brand: updatedBrand };
          });
        } else if (matches.length > 1) {
          setFormData((prevFormData) => {
            const updatedBrand = [...(prevFormData.brand || [])];
            updatedBrand[idx] = {
              ...updatedBrand[idx],
              ckplLocation: "",
            };
            return { ...prevFormData, brand: updatedBrand };
          });
        }
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };
  const fetchNonBrandDivisions = async () => {
    try {
      const response = await axios.get(
        BaseUrl + "api/sap/getNonBrandData?brandType=NonBrand",
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      if (response.status === 200) {
        const responseData = response.data.data || [];

        const uniqueDivisions = Array.from(
          new Set(responseData.map((item) => item.division))
        );
        setNonBrandDivision(uniqueDivisions);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };
  const generateSapValue = async () => {
    setIsSapValueLoading(true);
    const fundnew = data?.brand[0]?.fundCentre;
    const monthnew = data?.brand[0]?.month;
    const yearnew = data?.brand[0]?.year;
    const commitmemtnew = data?.brand[0]?.commitmentItem;
    try {
      const response = await axios.get(
        BaseUrl +
        `api/sap/balance?fundCenter=${fundnew}&commitmentItem=${commitmemtnew}&fiscalYear=${yearnew}&month=${monthnew}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setFormData((prevFormData) => ({
        ...prevFormData,
        sapValue: response.data,
      }));
      setIsSapValueGenerated(true);
    } catch (error) {
      console.error("Error fetching business approvers:", error);
    } finally {
      setIsSapValueLoading(false);
    }
  };

  const getDeliveryPlants = async () => {
    try {
      const response = await axios.get(BaseUrl + "api/delivery-plant", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (response.status === 200) {
        const responseData = response.data || [];
        setDeliveryPlants(responseData);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchEBrief = async (glCode, index, ticketId) => {
    if (!glCode) {
      setEBriefOptions((prev) => {
        const updated = [...prev];
        updated[index] = [];
        return updated;
      });
      setEBriefUnavailable((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
      return;
    }
    try {
      const response = await axios.get(
        BaseUrl + `api/ebrief/get-by-glcode?glCode=${glCode}${ticketId ? `&ticketId=${ticketId}` : ``}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (response.status === 200) {
        const responseData = response.data || [];
        const options = responseData.map((item) => ({
          value: item.activity_id,
          label: `${item.activity_id} - ${item.activity_gl_code}`,
        }));
        setEBriefOptions((prev) => {
          const updated = [...prev];
          updated[index] = options;
          return updated;
        });
        setEBriefUnavailable((prev) => {
          const updated = [...prev];
          updated[index] = false;
          return updated;
        });
      }
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data || "";
      if (status === 404 || status === 400 || status === 409) {
        const notifMsg = buildEBriefMsg(msg);
        setNotifModal(notifMsg);
        setEBriefUnavailable((prev) => {
          const updated = [...prev];
          updated[index] = true;
          return updated;
        });
        setEBriefErrorMessages((prev) => {
          const updated = [...prev];
          updated[index] = notifMsg;
          return updated;
        });
      }
      console.error("Error fetching eBrief:", error);
      setEBriefOptions((prev) => {
        const updated = [...prev];
        updated[index] = [];
        return updated;
      });
    }
  };

  useEffect(() => {
    if (isModalOpen && !isDataFetched) {
      fetchVendorList();
      const type = isBrand ? "Brand" : "NonBrand";
      fetchNatureofExpenses(type);
      fetchLocations();
      fetchBrandNames();
      fetchNonBrandDivisions();
      fetchCarbonCopyUsers();
      setIsDataFetched(true);
      setDistrictOptions([]);
      getDeliveryPlants();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!isBrand) return;
    if (role !== "Requestor") return;
    if (isView && !isEdit) return;
    const isFromData = data?.brand?.some((b) => b.glCode);
    const brands = formData?.brand || data?.brand || [];
    brands.forEach((brand, index) => {
      const glCode = brand?.glCode;
      if (glCode) {
        fetchEBrief(glCode, index, isFromData ? data?.id : undefined);
      }
    });
  }, [
    (formData?.brand || data?.brand)?.map((b) => b?.glCode).join("|"),isView,isEdit
  ]);

  useEffect(() => {
    if (isModalOpen && data?.id) {
      userFetch();
      userFetch("Approved");
      userFetch("Reject");
    }
  }, [isModalOpen, data?.id]);

  useEffect(() => {
    if (isModalOpen && !isView && !isEdit && isBrand !== undefined) {
      const brandType = isBrand ? "Brand" : "NonBrand";
      setFormData((prev) => ({
        ...prev,
        brand: [
          {
            brandOrNonBrand: brandType,
            ioOrCostCentrePo: isBrand ? "IO1" : "CC",
          },
        ],
      }));
      fetchNatureofExpenses(brandType);
    }
  }, [isModalOpen, isBrand, isView, isEdit]);

  useEffect(() => {
    if (data?.brand?.[0]?.brandOrNonBrand) {
      fetchNatureofExpenses(data.brand[0].brandOrNonBrand);
    }
  }, [data?.brand?.[0]?.brandOrNonBrand]);
  useEffect(() => {
    if (isView) {
      if (brandDataLength === 0) {
        setInputValues(Array(1).fill(""));
      } else {
        setInputValues(Array(brandDataLength).fill(""));
      }
        if (Array.isArray(data.attachment)) {
        setFormData((prev) => ({
          ...prev,
          attachment: prev.attachment ?? [...data.attachment],
          attachmentsPath: prev.attachmentsPath ?? data.attachment.filter((f) => typeof f === "string"),
        }));
      }
    }
  }, [brandDataLength, isView]);

  useEffect(() => {
    if (isEdit) {
      if (brandDataLength === 0) {
        setInputValues(Array(1).fill(""));
      } else {
        setInputValues(Array(brandDataLength).fill(""));
      }
      if (Array.isArray(data.attachment)) {
        setFormData((prev) => ({
          ...prev,
          attachment: prev.attachment ?? [...data.attachment],
          attachmentsPath: prev.attachmentsPath ?? data.attachment.filter((f) => typeof f === "string"),
        }));
      }
    }
  }, [brandDataLength, isEdit]);

  const options = Pomaker?.map((item) => ({
    value: item.id,
    label: item.userName,
  }));

  const onChange = (date, dateString, index, name) => {
    setFormData((prevFormData) => {
      const updatedBrand = prevFormData.brand ? [...prevFormData.brand] : [];

      if (date && dayjs.isDayjs(date)) {
        const selectedDate = date.toDate();
        const month = selectedDate.toLocaleString("default", { month: "long" });
        const year = selectedDate.getFullYear();

        const formattedDate = date.format("YYYY-MM-DD");

        if (name === "activityEndDate") {
          updatedBrand[index] = {
            ...updatedBrand[index],
            [name]: formattedDate,
            month,
            year,
          };
        } else {
          updatedBrand[index] = {
            ...updatedBrand[index],
            [name]: formattedDate,
          };
        }
      } else {
        updatedBrand[index] = {
          ...updatedBrand[index],
          [name]: null,
          ...(name === "activityEndDate" && { month: null, year: null }),
        };
      }

      return {
        ...prevFormData,
        brand: updatedBrand,
      };
    });

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[`${name}-${index}`];
      return newErrors;
    });
  };

  const handleAddForm = () => {
    setInputValues((prevValues) => [
      ...prevValues,
      `Item ${prevValues.length + 1}`,
    ]);
    setFormData((prevFormData) => {
      const updatedBrand = prevFormData.brand ? [...prevFormData.brand] : [];
      const firstBrandType =
        updatedBrand[0]?.brandOrNonBrand || (isBrand ? "Brand" : "NonBrand");
      updatedBrand.push({
        brandOrNonBrand: firstBrandType,
        ioOrCostCentrePo: firstBrandType === "Brand" ? "IO1" : "CC",
      });
      return { ...prevFormData, brand: updatedBrand };
    });
  };
  const handleRemoveForm = (index) => {
    setInputValues((prevValues) => {
      if (prevValues.length === 1) return prevValues; // Prevent removing if only one item exists

      const newInputValues = [...prevValues];
      newInputValues.splice(index, 1);
      return newInputValues;
    });

    setFormData((prevFormData) => {
      const updatedBrand = Array.isArray(prevFormData.brand)
        ? [...prevFormData.brand]
        : [];
      if (updatedBrand.length === 1) return prevFormData;

      updatedBrand.splice(index, 1);
      const totalBaseValue = updatedBrand.reduce((acc, b) => acc + (parseFloat(b?.value) || 0), 0);
      return { ...prevFormData, brand: updatedBrand, totalBaseValue };
    });
  };

  const isEmptyOrWhitespace = (value) => {
    return (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    );
  };

  const fieldValidations = [
    // Top-level form fields
    { field: "vendorName", message: "Vendor Name is required" },
    { field: "vendorLocation", message: "Vendor Location is required" },
    { field: "vendorCode", message: "Vendor Code is required" },
    { field: "vendorMailId", message: "Vendor Mail Id is required" },
    { field: "mailId", message: "Vendor Mail Id is required" },
    { field: "customMailId", message: "Custom Vendor Mail Id is required" },
    // { field: "ckplLocation", message: "CKPL Location is required" },
    { field: "currency", message: "Currency Location is required" },
    // { field: "gstType", message: "GST Type is required" },
    { field: "paymentTerm", message: "Payment Term is required" },
    { field: "advance", message: "Advance is required" },
    { field: "poType", message: "PO Type is required" },
    { field: "roiDescription", message: "ROI Description is required", condition: () => false },
    { field: "attachment", message: "Attachment is required" },
    { field: "businessApprover", message: "Business Approver is required" },

    // Nested validations for formData.brand
    {
      field: "brandOrNonBrand",
      message: "Brand is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        isEmptyOrWhitespace(formData.brand[index].brandOrNonBrand),
    },
    {
      field: "materialCode",
      message: "Material Code cannot exceed 100 characters",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].materialCode &&
        formData.brand[index].materialCode.length > 100,
    },
    {
      field: "materialCode",
      message: "Material Code is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].natureOfExpenses === "ADVERTISEMENT PRODUCTION-POP" &&
        poCategory[index] === "Material PO" &&
        isEmptyOrWhitespace(formData.brand[index].materialCode),
    },
    {
      field: "poCategory",
      message: "Please select Material PO or Non-Material PO",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].natureOfExpenses === "ADVERTISEMENT PRODUCTION-POP" &&
        isEmptyOrWhitespace(poCategory[index]),
    },
    {
      field: "brand",
      message: "Brand is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "Brand" &&
        isEmptyOrWhitespace(formData.brand[index].brand),
    },
    {
      field: "brandSubCategory",
      message: "Brand Sub-Category is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "Brand" &&
        isEmptyOrWhitespace(formData.brand[index].brandSubCategory),
    },
    {
      field: "division",
      message: "Division is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        isEmptyOrWhitespace(formData.brand[index].division),
    },
    {
      field: "department",
      message: "Department is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "NonBrand" &&
        isEmptyOrWhitespace(formData.brand[index].department),
    },
    {
      field: "region",
      message: "Region is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "Brand" &&
        isEmptyOrWhitespace(formData.brand[index].region),
    },
    {
      field: "channel",
      message: "Channel is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "Brand" &&
        isEmptyOrWhitespace(formData.brand[index].channel),
    },
    {
      field: "channel",
      message: "Channel is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "NonBrand" &&
        isEmptyOrWhitespace(formData.brand[index].channel),
    },
    {
      field: "value",
      message: "Value is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        isEmptyOrWhitespace(formData.brand[index].value),
    },
    {
      field: "location",
      message: "Location is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "NonBrand" &&
        isEmptyOrWhitespace(formData.brand[index].location),
    },
    {
      field: "natureOfExpenses",
      message: "Nature of Expenses is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        isEmptyOrWhitespace(formData.brand[index].natureOfExpenses),
    },
    {
      field: "sacHsnCode",
      message: "SAC/HSN Code is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        isEmptyOrWhitespace(formData.brand[index].sacHsnCode),
    },
    {
      field: "poDescription",
      message: "PO Description is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        isEmptyOrWhitespace(formData.brand[index].poDescription),
    },
    {
      field: "activityStartDate",
      message: "Start Date is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        isEmptyOrWhitespace(formData.brand[index].activityStartDate),
    },
    {
      field: "activityEndDate",
      message: "End Date is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        isEmptyOrWhitespace(formData.brand[index].activityEndDate),
    },
    {
      field: "ckplLocation",
      message: "CKPL Location is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "Brand" &&
        isEmptyOrWhitespace(formData.brand[index].ckplLocation),
    },
    {
      field: "gstType",
      message: "GST Type is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "Brand" &&
        isEmptyOrWhitespace(formData.brand[index].gstType),
    },
    {
      field: "fundCentre",
      message: "Fund Center is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        isEmptyOrWhitespace(formData.brand[index].fundCentre),
    },
    {
      field: "costcenter",
      message: "Cost Center is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "NonBrand" &&
        isEmptyOrWhitespace(formData.brand[index].costcenter),
    },
    {
      field: "district",
      message: "District is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "Brand" &&
        (isEmptyOrWhitespace(formData.brand[index].district) ||
          (Array.isArray(formData.brand[index].district) &&
            formData.brand[index].district.length === 0)),
    },
    {
      field: "deliveryPlant",
      message: "Delivery Plant is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand !== "" &&
        poCategory[index] !== "Non-Material PO" &&
        (formData.brand[index].materialCode ||
          (!isEdit && poCategory[index] !== "Non-Material PO" && data?.brand?.[index]?.materialCode)) &&
        isEmptyOrWhitespace(formData.brand[index].deliveryPlant),
    },
    {
      field: "ebriefId",
      message: "E Brief is required",
      condition: (formData, index) =>
        formData.brand &&
        formData.brand.length > 0 &&
        formData.brand[index].brandOrNonBrand === "Brand" &&
        formData.brand[index].glCode &&
        eBriefOptions[index]?.length > 0 &&
        isEmptyOrWhitespace(formData.brand[index].ebriefId),
    },
  ];

  const handleFormSubmitt = async () => {
    setIsSubmitted(true);
    const isSpecialVendor =
      !isBrand && (formData.isSpecialVendor || data.vendorCode === "3704453");
    const isCmdOffice = !isBrand && (formData?.brand?.some((b) => b.department === "102 CMD Office") || data?.brand?.some((b) => b.department === "102 CMD Office"));

    const formErrors = fieldValidations.reduce(
      (errors, { field, message, condition = () => true }) => {
        if (field === "businessApprover") {
          if (isBrand) {
            if (!selfApproval && isEmptyOrWhitespace(formData[field])) {
              errors[field] = message;
            }
          } else {
            if (isSpecialVendor || isCmdOffice) {
              if (
                !selfApproval &&
                formData.approvalType === "Non Pre-Approved" &&
                isEmptyOrWhitespace(formData[field])
              ) {
                errors[field] = message;
              }
            } else {
              if (!selfApproval && isEmptyOrWhitespace(formData[field])) {
                errors[field] = message;
              }
            }
          }
          return errors;
        }

        if (isSpecialVendor || isCmdOffice) {
          if (!isCmdOffice && !formData.totalBaseValue) {
            errors.totalBaseValue = "Total Base Amount is required";
          }
          if (!formData.approvalType) {
            errors.approvalType = "Please select an approval type";
          } else if (
            formData.approvalType === "Pre-Approved" &&
            (!formData.preApprovedFiles ||
              formData.preApprovedFiles.length === 0)
          ) {
            errors.preApprovedFiles =
              "Please upload at least one file for Pre-Approved";
          } else if (
            !isCmdOffice &&
            formData.approvalType === "Pre-Approved" &&
            formData.preApprovedFiles &&
            formData.preApprovedFiles.some((file) => {
              const fileName =
                typeof file === "string" ? file : file?.name || "";
              return !fileName.toLowerCase().endsWith(".eml");
            })
          ) {
            errors.preApprovedFiles =
              "Only .eml files are allowed for Pre-Approved";
          }
          if (!isCmdOffice && isEmptyOrWhitespace(formData?.brand?.[0]?.poDescription)) {
            errors.poDescription = "PO Description is required";
          }
          if (!isCmdOffice && isEmptyOrWhitespace(formData?.brand?.[0]?.sacHsnCode)) {
            errors.sacHsnCode = "SAC/HSN Code is required";
          }
        }

        if (
          [
            "vendorName",
            "vendorLocation",
            "vendorCode",
            "currency",
            "paymentTerm",
            "advance",
            "poType",
            "attachment",
            ...(isBrand ? ["roiDescription"] : []),
          ].includes(field)
        ) {
          if (isEmptyOrWhitespace(formData[field])) {
            errors[field] = message;
          }
          // } else if (field === "ckplLocation") {
          //   if (!isBrand && isEmptyOrWhitespace(formData[field])) {
          //     errors[field] = message;
          //   }
        } else if (field === "vendorMailId") {
          const hasMultipleEmails =
            formData.vendorMailId &&
            formData.vendorMailId.split(",").length > 1;
          if (!hasMultipleEmails && !showOtherMailInput) {
            if (isEmptyOrWhitespace(formData[field])) {
              errors[field] = message;
            }
          }
        } else if (field === "mailId") {
          const hasMultipleEmails =
            formData.vendorMailId &&
            formData.vendorMailId.split(",").length > 1;
          const hasNoVendorMail = isEmptyOrWhitespace(formData.vendorMailId);
          if ((hasMultipleEmails || hasNoVendorMail) && !showOtherMailInput) {
            if (isEmptyOrWhitespace(formData[field])) {
              errors[field] = message;
            }
          }
        } else if (field === "customMailId") {
          if (showOtherMailInput && isEmptyOrWhitespace(formData[field])) {
            errors[field] = message;
          }
        } else if (
          field === "brand" &&
          (!formData.brand || formData.brand.length === 0)
        ) {
          errors["brandornonbrand-0"] = "Add At least one brand.";
        } else if (
          formData.brand &&
          formData.brand.length > 0 &&
          !isSpecialVendor
        ) {
          formData.brand.forEach((_, index) => {
            if (condition(formData, index)) {
              errors[`${field}-${index}`] = message;
            }
          });
        }
        return errors;
      },
      {}
    );

    if (showOtherMailInput && formData.customMailId) {
      const customMailValue = formData.customMailId;
      if (!validateEmail(customMailValue)) {
        formErrors.customMailId = "Please enter a valid email address";
      }
    }

    if (isBrand && eBriefUnavailable.some(Boolean)) {
      const firstErrMsg = eBriefErrorMessages.find(Boolean);
      const notifMsg = buildEBriefMsg(firstErrMsg);
      setNotifModal(notifMsg);
      return;
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      console.log(formErrors,"FormErrors");
      
      setNotifModal("Please fill in all required fields.");
    } else {
      setErrors({});
      handleFormSubmit();
    }
  };

  const handleFormUpdateValidation = async () => {
    const mergedData = { ...draftData, ...formData };
    if (Array.isArray(draftData.brand) || Array.isArray(formData.brand)) {
      const draftBrands = draftData.brand || [];
      const formBrands = formData.brand || [];
      mergedData.brand = [];
      const maxLen = formBrands.length > 0 ? formBrands.length : draftBrands.length;
      for (let i = 0; i < maxLen; i++) {
        const merged = {
          ...(draftBrands[i] || {}),
          ...(formBrands[i] || {}),
          brand:
            formBrands[i]?.brand ||
            draftBrands[i]?.detailsBrand ||
            draftBrands[i]?.brand,
          fundcenter:
            formBrands[i]?.fundcenter ||
            draftBrands[i]?.fundCentre ||
            draftBrands[i]?.fundcenter,
          ebriefId:
            formBrands[i]?.ebriefId ??
            draftBrands[i]?.ebriefId ??
            draftBrands[i]?.ebrief?.activity_id,
        };
        const toLocalDate = (val) => val ? dayjs(val).format("YYYY-MM-DD") : val;
        merged.activityStartDate = toLocalDate(merged.activityStartDate);
        merged.activityEndDate = toLocalDate(merged.activityEndDate);
        mergedData.brand[i] = merged;
      }
    }

    // Validate activityEndDate for past dates
    const today = dayjs().startOf('day');
    const endDateErrors = {};
    if (mergedData.brand && mergedData.brand.length > 0) {
      mergedData.brand.forEach((brand, index) => {
        if (brand.activityEndDate) {
          const endDate = dayjs(brand.activityEndDate).startOf('day');
          if (endDate.isBefore(today)) {
            endDateErrors[`activityEndDate-${index}`] = "Activity End Date cannot be in the past. Please update the date to proceed.";
          }
        }
      });
    }

    if (Object.keys(endDateErrors).length > 0) {
      setErrors(endDateErrors);
      setNotifModal("Activity End Date cannot be in the past. Please update the date.");
      return;
    }

    setIsSubmitted(true);
    const isSpecialVendor =
      !isBrand && (formData.isSpecialVendor || data.vendorCode === "3704453");
    const isCmdOffice = !isBrand && (mergedData?.brand?.some((b) => b.department === "102 CMD Office") || data?.brand?.some((b) => b.department === "102 CMD Office"));

    const formErrors = fieldValidations.reduce(
      (errors, { field, message, condition = () => true }) => {
        if (field === "businessApprover") {
          if (isBrand) {
            if (!selfApproval && isEmptyOrWhitespace(mergedData[field])) {
              errors[field] = message;
            }
          } else {
            if (isSpecialVendor || isCmdOffice) {
              if (
                !selfApproval &&
                mergedData.approvalType === "Non Pre-Approved" &&
                isEmptyOrWhitespace(mergedData[field])
              ) {
                errors[field] = message;
              }
            } else {
              if (!selfApproval && isEmptyOrWhitespace(mergedData[field])) {
                errors[field] = message;
              }
            }
          }
          return errors;
        }

        if (isSpecialVendor || isCmdOffice) {
          if (!isCmdOffice && !mergedData.totalBaseValue) {
            errors.totalBaseValue = "Total Base Amount is required";
          }
          if (!mergedData.approvalType) {
            errors.approvalType = "Please select an approval type";
          } else if (
            mergedData.approvalType === "Pre-Approved" &&
            (!mergedData.preApprovedFiles ||
              mergedData.preApprovedFiles.length === 0)
          ) {
            errors.preApprovedFiles =
              "Please upload at least one file for Pre-Approved";
          } else if (
            !isCmdOffice &&
            mergedData.approvalType === "Pre-Approved" &&
            mergedData.preApprovedFiles &&
            mergedData.preApprovedFiles.some((file) => {
              const fileName =
                typeof file === "string" ? file : file?.name || "";
              return !fileName.toLowerCase().endsWith(".eml");
            })
          ) {
            errors.preApprovedFiles =
              "Only .eml files are allowed for Pre-Approved";
          }
          if (!isCmdOffice && isEmptyOrWhitespace(mergedData?.brand?.[0]?.poDescription)) {
            errors.poDescription = "PO Description is required";
          }
          if (!isCmdOffice && isEmptyOrWhitespace(mergedData?.brand?.[0]?.sacHsnCode)) {
            errors.sacHsnCode = "SAC/HSN Code is required";
          }
        }

        if (
          [
            "vendorName",
            "vendorLocation",
            "vendorCode",
            "currency",
            "paymentTerm",
            "advance",
            "poType",
            "attachment",
            ...(isBrand ? ["roiDescription"] : []),
          ].includes(field)
        ) {
          if (isEmptyOrWhitespace(mergedData[field])) {
            errors[field] = message;
          }
        } else if (field === "vendorMailId") {
          const hasMultipleEmails =
            mergedData.vendorMailId &&
            mergedData.vendorMailId.split(",").length > 1;
          if (!hasMultipleEmails && !showOtherMailInput) {
            if (isEmptyOrWhitespace(mergedData[field])) {
              errors[field] = message;
            }
          }
        } else if (field === "mailId") {
          const hasMultipleEmails =
            mergedData.vendorMailId &&
            mergedData.vendorMailId.split(",").length > 1;
          const hasNoVendorMail = isEmptyOrWhitespace(mergedData.vendorMailId);
          if ((hasMultipleEmails || hasNoVendorMail) && !showOtherMailInput) {
            if (isEmptyOrWhitespace(mergedData[field])) {
              errors[field] = message;
            }
          }
        } else if (field === "customMailId") {
          if (showOtherMailInput && isEmptyOrWhitespace(mergedData[field])) {
            errors[field] = message;
          }
        } else if (
          field === "brand" &&
          (!mergedData.brand || mergedData.brand.length === 0)
        ) {
          errors["brandornonbrand-0"] = "Add At least one brand.";
        } else if (
          mergedData.brand &&
          mergedData.brand.length > 0 &&
          !isSpecialVendor
        ) {
          mergedData.brand.forEach((_, index) => {
            if (condition(mergedData, index)) {
              errors[`${field}-${index}`] = message;
            }
          });
        }
        return errors;
      },
      {}
    );

    // Add email format validation for customMailId
    if (showOtherMailInput && mergedData.customMailId) {
      const customMailValue = mergedData.customMailId;
      if (!validateEmail(customMailValue)) {
        formErrors.customMailId = "Please enter a valid email address";
      }
    }

    if (isBrand && eBriefUnavailable.some(Boolean)) {
      const firstErrMsg = eBriefErrorMessages.find(Boolean);
      const notifMsg = buildEBriefMsg(firstErrMsg);
      setNotifModal(notifMsg);
      return;
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setNotifModal("Please fill in all required fields.");
    } else {
      setErrors({});
      // Pass mergedData for update
      handleFormUpdate(mergedData);
    }
  };

  const resetForm = () => {
    setFormData({});
    setExceed(false);
    setErrors({});
    setFormErrors({});
    setIsSubmitted(false);
    setApprovers([]);
    setBrandNames([]);
    setBrandSubCategory([]);
    setBrandRegion([]);
    setBrandChannel([]);
    setBrandFundCenter([]);
    setNonBrandDepartment([]);
    setNonBrandLocation([]);
    setNonBrandCostCenterOptions([]);
    setDraftOptions([]);
    setDistrictOptions([]);
    setLocationOptions([]);
    setVendorCodeOptions([]);
    setEBriefOptions([]);
    setEBriefUnavailable([]);
    setEBriefErrorMessages([]);
    setPoCategory([]);
    lastFetchedRegionsRef.current = [];
    setShowOtherMailInput(false);
    reset({});
  };


  const handleFormSubmit = async () => {
    const budgetData = mode === "view" ? data : formData;
    if (budgetApproval) {
      budgetData.budget = budgetApproval;
    }
    if (selfApproval) {
      budgetData.selfApprove = selfApproval;
    }
    if (isSpecialVendor && budgetData.brand && budgetData.brand[0]) {
      budgetData.brand[0].brandOrNonBrand = localStorage.getItem("selectedTicketTab") === "Brand" ? "Brand" : "NonBrand";
    }
    try {
      const result = await handleOk(budgetData);
      if (result && result.success === false) {
        toast.error(result.message || "Something went wrong.");
        return;
      }
      resetForm();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message;
      if (msg) toast.error(msg);
      console.error("Form submission error:", error);
    }
  };
  const handleFormUpdate = async (formData) => {
    const budgetData = formData;
    if (budgetApproval) {
      budgetData.budget = budgetApproval;
    }
    if (selfApproval) {
      budgetData.selfApprove = selfApproval;
    }
    try {
      const result = await handleUpdate(budgetData);
      if (result && result.success === false) {
        toast.error(result.message || "Something went wrong.");
        return;
      }
      resetForm();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message;
      if (msg) toast.error(msg);
      console.error("Form update error:", error);
    }
  };
  const handleDraft = () => {
    const isSpecialVendor =
      !isBrand && (formData.isSpecialVendor || data.vendorCode === "3704453");
    const isCmdOffice = !isBrand && (formData?.brand?.some((b) => b.department === "102 CMD Office") || data?.brand?.some((b) => b.department === "102 CMD Office"));

    if (isSpecialVendor || isCmdOffice) {
      if (!isCmdOffice && formData.approvalType === "Non Pre-Approved") {
        if (!formData.businessApprover && !budgetApproval && !selfApproval) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            businessApprover: "Business Approver is required",
          }));
          toast.error("Business Approver is required");
          return;
        }
      }
      if (isEmptyOrWhitespace(formData.vendorName)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          vendorName: "Vendor Name is required",
        }));
        toast.error("Vendor Name is required");
        return;
      }
    } else {
      if (!formData.businessApprover && !budgetApproval && !selfApproval) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          businessApprover: "Business Approver is required",
        }));
        toast.error("Business Approver is required");
        return;
      }
      if (selfApproval && isEmptyOrWhitespace(formData.vendorName)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          vendorName: "Vendor Name is required",
        }));
        toast.error("Vendor Name is required");
        return;
      }
    }

    handleFormDraft(formData);
    resetForm();
  };
  const handleRemarksSubmit = () => {
    if (isEmptyOrWhitespace(formData.remarks)) {
      setErrors({ remarks: "Remarks are required" });
    } else {
      setErrors("");
      handleRemarks(formData);
    }
  };
  useEffect(() => {
    if (
      (data.stage === "Po_maker" &&
        (poattach === "Po_checker" || poattach === "Po_maker") &&
        praattach === "Po_release") ||
      (data.stage === "Po_maker" &&
        poattach === "Po_maker" &&
        praattach === "Po_checker") ||
      (data.stage === "Po_maker" && poattach === "Budget_Team") ||
      (data.stage === "Po_maker" && praattach === "Budget_Team")
    ) {
      setFormData((prevFormData) => {
        return {
          ...prevFormData,
          poNumber: data.poNumber,
          isRelated: data?.isRelated === null || data?.isRelated === undefined ? "" : data?.isRelated === true ? "YES" : "NO",
          budgetExceedAvailable:
            data?.budgetDetails === null || data?.budgetDetails === undefined
              ? ""
              : data?.budgetDetails?.toLowerCase() === "yes"
                ? "Available"
                : "Not Available",
        };
      });
    }
  }, [
    data.stage,
    poattach,
    praattach,
    data.poNumber,
    data.isRelated,
    data.budgetDetails,
  ]);
  const validatePoNumbers = () => {
    const errors = { poNumber: [] };
    const poSource =
      formData.poNumber && formData.poNumber.length > 0
        ? formData.poNumber
        : data.poNumber && data.poNumber.length > 0
          ? data.poNumber
          : [""];

    const trimmed = poSource.map((po) =>
      po === null || po === undefined ? "" : String(po).trim()
    );

    trimmed.forEach((val, idx) => {
      if (!val) {
        errors.poNumber[idx] = `PO Number ${idx + 1} is required`;
      }
    });

    const freq = {};
    trimmed.forEach((val) => {
      if (val) freq[val] = (freq[val] || 0) + 1;
    });
    trimmed.forEach((val, idx) => {
      if (val && freq[val] > 1) {
        errors.poNumber[idx] = `PO Number ${idx + 1} is duplicate`;
      }
    });

    return errors;
  };

  const handleDocument = () => {
    if (role === "Budget_Team") {
      if (!(formData.documentNumber?.trim() || data.docNum?.trim())) {
        setErrors({ documentNumber: "Document Number is required" });
      } else {
        setApproveModal(true);
      }
    } else if (
      role === "Po_maker" &&
      data.stage === "Po_maker" &&
      poattach !== "Po_release" &&
      poattach !== "Po_checker" &&
      (poattach !== "Po_maker" ||
        (poattach === "Po_maker" &&
          (data.poNumber === "null" || data.poNumber === null))) &&
      (poattach !== "PO_Screening" ||
        (poattach === "PO_Screening" &&
          (data.poNumber === "null" || data.poNumber === null)))
    ) {
      const isBrandTab = localStorage.getItem("selectedTicketTab")?.toLowerCase().trim() === "brand";

      if (isBrandTab) {
        const errors = validatePoNumbers();
        if (isRelatedDisable) {
          if (!formData.isRelated?.trim()) {
            errors.isRelated = "Related is required";
          } else if (
            formData.isRelated === "YES" &&
            !formData.poApprover?.trim()
          ) {
            errors.poApprover =
              "PO Approver is required when Related is selected";
          }
        }

        const hasPoError = errors.poNumber && errors.poNumber.some((e) => !!e);
        if (hasPoError || errors.isRelated || errors.poApprover) {
          setErrors(errors);
        } else {
          formData.isRelated === "NO" ? setShowConfirm(true) : setApproveModal(true);
          setErrors({});
        }
      } else {
        if (formData.budgetExceedAvailable === "Available") {
          const errors = validatePoNumbers();
          if (isRelatedDisable) {
            if (!formData.isRelated?.trim()) {
              errors.isRelated = "Related is required";
            } else if (
              formData.isRelated === "YES" &&
              !formData.poApprover?.trim()
            ) {
              errors.poApprover =
                "PO Approver is required when Related is selected";
            } else if (
              formData.isRelated === "YES" &&
              formData.poApprover?.trim() &&
              (!formData.poApproverFile || formData.poApproverFile.length === 0) &&
              (!(data.poApproverFile?.length > 0) || (formData.deletedPoApproverFiles?.length >= data.poApproverFile?.length))
            ) {
              errors.poApproverFile = "PO Approver File is required";
            }
          }

          const hasPoError = errors.poNumber && errors.poNumber.some((e) => !!e);
          if (hasPoError || errors.isRelated || errors.poApprover || errors.poApproverFile) {
            setErrors(errors);
          } else {
            setApproveModal(true);
            setErrors({});
          }
        } else if (formData.budgetExceedAvailable === "Not Available") {
          if (
            (!formData.budgetFile || formData.budgetFile.length === 0) &&
            !data.budgetFile
          ) {
            setErrors({ budgetFile: "Budget File is required" });
          } else {
            setApproveModal(true);
            setErrors("");
          }
        } else {
          if (!formData.budgetExceedAvailable && !data.budgetDetails) {
            setErrors({ budgetExceedAvailable: "Please select an option" });
          } else {
            setApproveModal(true);
            setErrors("");
          }
        }
      }
    } else if (
      role === "Po_maker" &&
      data.stage === "Po_maker" &&
      (poattach === "Po_release" ||
        (poattach === "Po_checker" && praattach !== "Po_release") ||
        poattach === "PO_Screening")
    ) {
      if (!formData.poattachment || formData.poattachment.length === 0) {
        setErrors({ poattachment: "PO Attachment is required" });
      } else {
        setApproveModal(true);
        setErrors("");
      }
    } else if (
      (data.stage === "Po_maker" &&
        (poattach === "Po_checker" || poattach === "Po_maker") &&
        praattach === "Po_release") ||
      (data.stage === "Po_maker" &&
        poattach === "Po_maker" &&
        praattach === "Po_checker")
    ) {
      const errors = validatePoNumbers();
      if (
        canShowPoReSubmit &&
        isBusinessApproverDisabled &&
        localStorage.getItem("selectedTicketTab")?.toLowerCase().trim() ===
        "brand"
      ) {
        if (!formData.poReSubmitUser) {
          errors.poReSubmitUser = "Approved to is Required";
        }
      }
      const hasPoError = errors.poNumber && errors.poNumber.some((e) => !!e);
      if (hasPoError || errors.poReSubmitUser) {
        setErrors(errors);
      } else {
        setApproveModal(true);
        setErrors("");
      }
    } else if (role === "PO_Screening") {
      if (canShowResubmit) {
        if (!formData.reSubmitUser) {
          setErrors({ reSubmitUser: "Approved to is Required" });
          return;
        }
        setApproveModal(true);
      } else {
        setApproveModal(true);
      }
    } else if (
      role === "Business_Approver" ||
      role === "Business_head" ||
      role === "Po_checker" ||
      role === "Po_release" ||
      role === "Budget_Team" ||
      role === "Po_maker"
    ) {
      setApproveModal(true);
    }
  };

  const handleRejectValidate = () => {
    if (role === "Po_maker" && canShowReject) {
      if (!formData.rejectUser) {
        setErrors({ rejectUser: "Rejected To is Required" });
        return;
      }
      setRemarkModal(true);
    } else {
      setRemarkModal(true);
    }
  };

  const handleRemarks = () => {
    if (
      (data.stage === "Po_maker" && poattach === "Po_release") ||
      (data.stage === "Po_maker" && poattach === "Po_checker") ||
      (data.stage === "Po_maker" &&
        poattach === "PO_Screening" &&
        data.poNumber !== "null" &&
        data.poNumber !== null)
    ) {
      handlePoRemarks(formData);
      setRemarkModal(false);
    } else {
      handleFormRemarks(formData);
      setRemarkModal(false);
    }
  };

  const handleApprove = () => {
    if (
      (data.stage === "Po_maker" && poattach === "Po_release") ||
      (data.stage === "Po_maker" &&
        poattach === "Po_checker" &&
        praattach !== "Po_release") ||
      (data.stage === "Po_maker" &&
        poattach === "PO_Screening" &&
        data.poNumber !== "null" &&
        data.poNumber !== null)
    ) {
      handlePoApprove(formData);
      setApproveModal(false);
    } else {
      const updatedFormData = { ...formData };
      if (!updatedFormData.poApprover) {
        updatedFormData.poApprover = data.poApproverId;
      }
      if (!updatedFormData.isRelated) {
        updatedFormData.isRelated = data.isRelated;
      }
      if (!updatedFormData.budgetExceedAvailable) {
        updatedFormData.budgetExceedAvailable = data.budgetExceedAvailable?.toLowerCase() === "yes" ? "Available" : "Not Available"; ;
      }
      if (!updatedFormData.budgetFile) {
        updatedFormData.budgetFile = data.budgetFile;
      }
      handleFormApprove(updatedFormData);
      setApproveModal(false);
    }
  };

  const handleRetrieve = () => {
    handleRetrieveTicket();
  };
  const handleHold = () => {
    if (!formData.remarks) {
      setErrors({ remarks: "Remarks are required" });
      return;
    }
    handleFormHold(formData);
    setHoldModal(false);
  };

  useEffect(() => {
    if (isView || isEdit) {
      const brands = formData?.brand?.length ? formData.brand : data?.brand || [];
      if (brands.length) {
        setPoCategory(brands.map((b) => (b?.materialPo === true ? "Material PO" : b?.materialPo === false ? "Non-Material PO" : "")));
      }
    }
  }, [isView, isEdit, data?.brand, formData?.brand]);

  useEffect(() => {
    if (!isView) {
      setIsEdit(false);
    }
  }, [isView]);

  useEffect(() => {
    if (!isModalOpen) {
      resetForm();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen) {
      fetchBudgetValidation();
    }
  }, [isModalOpen, localStorage.getItem("selectedTicketTab")]);

  const totalBaseValue = formData?.totalBaseValue ?? data?.totalBaseValue;
  const debouncedTotalValue = useDebounce(totalBaseValue, 500);

  useEffect(() => {
    if (debouncedTotalValue && Number(debouncedTotalValue) > 0) {
      // fetchBusinessApprovers(debouncedTotalValue);
      fetchBudgetValidation();
    }
  }, [
    debouncedTotalValue,
    formData?.brand?.[0]?.glCode,
    data?.brand?.[0]?.glCode,
  ]);

  useEffect(() => {
    if (data?.totalBaseValue < 500000) {
      setIsRelatedDisable(true);
    } else {
      setIsRelatedDisable(false);
    }
  }, [data?.totalBaseValue]);

  // ...existing code...
  const displayGstNo = (gstNo) => {
    if (gstNo === "NA") return "-";
    if (!gstNo) return "";
    return gstNo;
  };
  const filteredApprovedUsers = (() => {
    if (data?.poApproverId && canShowPoReSubmit) {
      return approvedUser.filter((user) => {
        if (user.roles?.includes("Po_release")) {
          return user.id === data.poApproverId;
        }
        return true;
      });
    }
    return approvedUser;
  })();

  return (
    <>
      <Modal
        className="model_container Manrope_bold "
        title={
          isEdit
            ? "Edit Details"
            : role === "Requestor" && !isView
              ? "Create Request"
              : "View Details"
        }
        open={isModalOpen}
        onOk={handleSubmit(handleFormSubmitt)}
        onCancel={() => {
          resetForm();
          handleCancel();
          setIsSapValueGenerated(false);
          // setInputValues(["Item 1"]);
          setIsEdit(false);
          setFormData({});
          setSelfApproval(false);
        }}
        width={950}
        maskClosable={false}
        footer={[
          isEdit ? (
            <div key="edit-footer">
              <Button
                key="cancel"
                className="cancel_btn footer_btn"
                onClick={() => {
                  setIsEdit(false);
                  // setInputValues(["Item 1"]);
                  setIsSapValueGenerated(false);
                  handleCancel();
                  resetForm();
                  setSelfApproval(false);
                }}
              >
                Cancel
              </Button>
              <Button
                key="update"
                className="submit_btn footer_btn"
                type="primary"
                onClick={handleSubmit(handleFormUpdateValidation)}
              >
                Update
              </Button>
            </div>
          ) : (isView &&
            !isEdit &&
            mode === "view" &&
            role === "Business Approver") ||
            (isView && mode !== "view" && role === "Business_Approver") ||
            (isView && mode !== "view" && role === "PO_Screening") ||
            (isView && mode !== "view" && role === "Requestor") ||
            (isView && mode !== "view" && role === "admin") ||
            (isView && mode !== "view" && role === "Delivery_Planner") ||
            (isView && mode !== "view" && role === "Internal_Audit") ||
            (isView &&
              mode !== "view" &&
              role === "Budget_Team" &&
              mode !== "retrieve") ||
            (isView && mode !== "view" && role === "Budget_release_team") ||
            (isView &&
              !isEdit &&
              role === "Requestor" &&
              mode === "editticket") ||
            (isView && mode !== "view" && role === "Business_head") ||
            (isView &&
              mode !== "maker" &&
              mode !== "retrieve" &&
              role === "Po_maker") ||
            (isView && mode !== "checker" && role === "Po_checker") ||
            (isView && mode !== "checker" && role === "Po_release") ? (
            <div key="view-footer">
              <Button
                key="cancel"
                className="cancel_btn footer_btn"
                onClick={() => {
                  setIsEdit(false);
                  // setInputValues(["Item 1"]);
                  setIsSapValueGenerated(false);
                  handleCancel();
                  resetForm();
                }}
              >
                Cancel
              </Button>
              {mode === "editticket" && data.stage === "Requestor" && (
                <Button
                  key="edit"
                  className="submit_btn footer_btn"
                  type="primary"
                  onClick={() => {
                    setIsEdit(true);
                    // fetchDistricts(data?.brand?.[0]?.region);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          ) : role === "PO_Screening" ||
            role === "Business_Approver" ||
            role === "Business_head" ||
            role === "Po_checker" ||
            (isView && mode === "view" && role === "Budget_release_team") ||
            (isView && (mode === "checker" || role === "Po_checker")) ||
            (isView && mode === "checker" && role === "Po_release") ||
            (role === "Budget_Team" && isView && mode === "view") ? (
            <div key="approver-footer">
              <Button
                key="reject"
                className="reject_btn footer_btn"
                onClick={() => setRemarkModal(true)}
              >
                Reject
              </Button>

              {role === "Budget_Team" && (
                <Button
                  key="hold"
                  className="hold_btn footer_btn"
                  onClick={() => setHoldModal(true)}
                >
                  Hold
                </Button>
              )}

              <Button
                key="approvalStatus"
                className="approve_btn footer_btn"
                type="primary"
                onClick={() => handleDocument()}
              >
                Approve
              </Button>
            </div>
          ) : (data.stage === "Po_maker" && poattach === "Po_release") ||
            (data.stage === "Po_maker" &&
              poattach === "Po_checker" &&
              praattach !== "Po_release") ||
            (data.stage === "Po_maker" &&
              poattach === "PO_Screening" &&
              data.poNumber !== "null" &&
              data.poNumber !== null) ? (
            <div key="screening-footer">
              <Button
                key="cancel"
                className="cancel_btn footer_btn"
                onClick={() => {
                  setIsEdit(false);
                  // setInputValues(["Item 1"]);
                  handleCancel();
                  setIsSapValueGenerated(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                key="reject"
                className="submit_btn footer_btn"
                type="primary"
                onClick={() => setRemarkModal(true)}
              >
                Reject
              </Button>
              <Button
                key="approve"
                className="approve_btn footer_btn"
                type="primary"
                onClick={() => {
                  handleDocument();
                }}
              >
                Approve
              </Button>
            </div>
          ) : (isView && mode === "maker" && role === "Po_maker") ||
            role === "Po_checker" ? (
            <div key="screening-footer">
              <Button
                key="reject"
                className="reject_btn footer_btn"
                onClick={() => {
                  handleRejectValidate();
                }}
              >
                Reject
              </Button>
              <Button
                key="hold"
                className="hold_btn footer_btn"
                onClick={() => {
                  setHoldModal(true);
                }}
              >
                Hold
              </Button>

              <Button
                key="approve"
                className="approve_btn footer_btn"
                type="primary"
                onClick={() => {
                  handleDocument();
                }}
              >
                Approve
              </Button>
            </div>
          ) : (isView &&
            mode === "retrieve" &&
            (role === "Po_maker" || role === "Budget_Team")) ||
            role === "Po_checker" ? (
            <div key="screening-footer">
              <Button
                key="cancel"
                className="cancel_btn footer_btn"
                onClick={() => {
                  setIsEdit(false);
                  // setInputValues(["Item 1"]);
                  handleCancel();
                  setIsSapValueGenerated(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                key="approve"
                className="approve_btn footer_btn"
                type="primary"
                onClick={() => {
                  handleRetrieve();
                }}
              >
                Retrieve
              </Button>
            </div>
          ) : (
            <div key="default-footer">
              <Button
                key="cancel"
                className="cancel_btn footer_btn"
                onClick={() => {
                  resetForm();
                  handleCancel();
                  setIsSapValueGenerated(false);
                  // setInputValues(["Item 1"]);
                  resetForm();
                  setSelfApproval(false);
                }}
              >
                Cancel
              </Button>
              <Button
                key="draft"
                className="draft_btn footer_btn"
                onClick={handleSubmit(handleDraft)}
                disabled={isSubmit}
              >
                Draft
              </Button>
              <Button
                key="submit"
                className="submit_btn footer_btn"
                type="primary"
                disabled={isSubmit}
                onClick={handleSubmit(handleFormSubmitt)}
              >
                {/* {isSubmit ? "Submitting.." : "Submit" } */}
                {selfApproval ? "Self Approval" : "Submit"}
              </Button>
            </div>
          ),
        ]}
      >
        {/* form 1 start*/}
        <div className="model_form">
          <div>
            <h6 className="body_title">Vendor Details</h6>
          </div>
          <div className="model_body">
            <div className="model_input_field">
              <CustomSelect
                name="vendorName"
                label="Vendor Name"
                placeholder="Choose Vendor Name"
                options={Object.keys(vendorList).map((vendorName) => ({
                  value: vendorName,
                  label: vendorName,
                }))}
                control={control}
                onChange={handleVendorChange}
                required={!isView || isEdit}
                value={
                  isEdit
                    ? formData.vendorName || data.vendorName
                    : isView
                      ? data.vendorName
                      : formData.vendorName
                }
                disabled={isView && !isEdit}
                tooltip={isView ? data.vendorName : formData.vendorName}
                loading={!dataFetched}
              />
              {error.vendorName && (
                <span className="error_msg_color">{error.vendorName}</span>
              )}
            </div>
            <div className="model_input_field">
              {locationOptions && locationOptions.length > 0 ? (
                <CustomSelect
                  name="vendorLocation"
                  placeholder="Vendor Location"
                  label="Vendor Location"
                  value={
                    isEdit
                      ? formData.vendorLocation || data.vendorLocation
                      : isView
                        ? data.vendorLocation
                        : formData.vendorLocation
                  }
                  tooltip={
                    isView ? data.vendorLocation : formData.vendorLocation
                  }
                  options={locationOptions}
                  control={control}
                  disabled={isView && !isEdit}
                  // labelStyle={{ color: "limegreen" }}
                  labelStyle={{ color: "#EB043C" }}
                  required={
                    !(formData.vendorLocation || data.vendorLocation)
                      ? !isView || isEdit
                      : false
                  }
                  onChange={handleLocationChange}
                />
              ) : (
                <CustomInput
                  name="vendorLocation"
                  placeholder="Vendor Location"
                  label="Vendor Location"
                  // labelStyle={{ color: "limegreen" }}
                  labelStyle={{ color: "#EB043C" }}
                  value={
                    isEdit
                      ? formData.vendorLocation || data.vendorLocation
                      : isView
                        ? data.vendorLocation
                        : formData.vendorLocation
                  }
                  tooltip={
                    isView ? data.vendorLocation : formData.vendorLocation
                  }
                  control={control}
                  readonly
                />
              )}
              {error.vendorLocation && (
                <span className="error_msg_color">{error.vendorLocation}</span>
              )}
            </div>
            <div className="model_input_field">
              {formData.gstNo && formData.gstNo.split(",").length > 1 ? (
                <CustomSelect
                  name="vendorGstNo"
                  placeholder="Choose GST NO"
                  label="GST No"
                  // labelStyle={{ color: "limegreen" }}
                  labelStyle={{ color: "#EB043C" }}
                  value={
                    isEdit
                      ? (formData.gstNo || data.gstNo) ?? "-"
                      : isView
                        ? data.gstNo ?? "-"
                        : formData.gstNo ?? "-"
                  }
                  tooltip={isView ? data.gstNo : formData.gstNo}
                  options={
                    formData.gstNo
                      ? formData.gstNo
                        .split(",")
                        .map((gstNo) => ({ value: gstNo, label: gstNo }))
                      : []
                  }
                  control={control}
                  onChange={(value) => handleMultiSelectChange(value, "gstNo")}
                />
              ) : (
                <CustomInput
                  name="vendorGstNo"
                  placeholder="GST No"
                  label="GST No"
                  labelStyle={{ color: "#EB043C" }}
                  control={control}
                  value={
                    isEdit
                      ? displayGstNo(formData.gstNo || data.gstNo)
                      : isView
                        ? displayGstNo(data.gstNo)
                        : displayGstNo(formData?.gstNo)
                  }
                  tooltip={isView ? data.gstNo : formData.gstNo}
                  readonly
                />
              )}
            </div>

            <div className="model_input_field">
              {vendorCodeOptions.length > 0 ? (
                <CustomSelect
                  name="vendorCode"
                  placeholder="Choose Vendor Code"
                  label="Vendor Code"
                  labelStyle={{ color: "#EB043C" }}
                  value={
                    isEdit
                      ? formData.vendorCode || data.vendorCode
                      : isView
                      ? data.vendorCode
                      : formData.vendorCode
                  }
                  options={vendorCodeOptions}
                  control={control}
                  onChange={handleVendorCodeChange}
                  disabled={isView && !isEdit}
                  tooltip={isView ? data.vendorCode : formData.vendorCode}
                  required={!(formData.vendorCode || data.vendorCode) ? !isView || isEdit : false}
                />
              ) : (
                <CustomInput
                  name="vendorCode"
                  placeholder="Vendor Code"
                  label="Vendor Code"
                  control={control}
                  labelStyle={{ color: "#EB043C" }}
                  value={
                    isEdit
                      ? formData.vendorCode || data.vendorCode
                      : isView
                      ? data.vendorCode
                      : formData.vendorCode
                  }
                  tooltip={isView ? data.vendorCode : formData.vendorCode}
                  readonly
                />
              )}
            </div>

            <div className="model_input_field">
              {/* {formData.vendorMailId &&
              formData.vendorMailId.split(",").length > 1 ? ( */}
              <CustomSelect
                name="mailId"
                placeholder="Choose Vendor Mail Id"
                label="Vendor Mail Id"
                value={
                  isEdit
                    ? formData.mailId || data.vendorMailId
                    : isView
                      ? data.vendorMailId || data.mailId
                      : formData.mailId
                }
                options={
                  formData.vendorMailId || data.vendorMailId
                    ? [
                      ...(formData.vendorMailId || data.vendorMailId)
                        .split(",")
                        .map((mailId) => ({
                          value: mailId.trim(),
                          label: mailId.trim(),
                        })),
                      { value: "Other", label: "Other" },
                    ]
                    : [{ value: "Other", label: "Other" }]
                }
                control={control}
                required={
                  !(formData.mailId || data.mailId) ? !isView || isEdit : false
                }
                onChange={(value) => {
                  if (value === "Other") {
                    setShowOtherMailInput(true);
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      mailId: value,
                      customMailId: "",
                    }));
                  } else {
                    setShowOtherMailInput(false);
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      mailId: value,
                      customMailId: "",
                    }));
                  }
                  setErrors((prevErrors) => {
                    const newErrors = { ...prevErrors };
                    delete newErrors.mailId;
                    delete newErrors.customMailId;
                    return newErrors;
                  });
                }}
                tooltip={
                  isView
                    ? data.mailId && data.mailId.length > 1 && data.vendorMailId
                      ? data.vendorMailId.split(",")
                      : undefined
                    : formData.mailId
                }
                disabled={isView && !isEdit}
              />

              {/* Custom input field for "Other" option */}
              {/* {showOtherMailInput && (
                <CustomInput
                  name="customMailId"
                  placeholder="Enter custom vendor mail id"
                  label="Other"
                  type="email"
                  control={control}
                  value={formData.customMailId || ""}
                  onChange={(e) => {
                    const customMailValue = e.target.value;
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      customMailId: customMailValue,
                      mailId: customMailValue, // Set mailId to the custom value
                    }));

                    // Validate email format
                    setErrors((prevErrors) => {
                      const newErrors = { ...prevErrors };
                      delete newErrors.mailId;
                      delete newErrors.customMailId;

                      // Add email format validation
                      if (customMailValue && !validateEmail(customMailValue)) {
                        newErrors.customMailId =
                          "Please enter a valid email address";
                      }

                      return newErrors;
                    });
                  }}
                  required={!isView || isEdit}
                />
              )} */}

              {/* ) : ( */}
              {/* <CustomInput
                  name="vendorMailId"
                  placeholder="Vendor Mail Id"
                  label="Vendor Mail Id"
                  control={control}
                  value={
                    isEdit
                      ? formData.vendorMailId || data.vendorMailId
                      : isView
                      ? data.vendorMailId
                      : formData.vendorMailId
                  }
                  tooltip={isView & !isEdit ? data.mailId : formData.mailId}
                  readonly
                /> */}
              {/* )} */}
              {/* Show appropriate error message based on email scenario */}
              {
                // showOtherMailInput
                //   ? // Show custom mail error when "Other" is selected
                //     error.customMailId && (
                //       <span className="error_msg_color">
                //         {error.customMailId}
                //       </span>
                //     )
                //   :
                formData.vendorMailId &&
                  formData.vendorMailId.split(",").length > 1
                  ? // Multiple emails - show mailId error
                  error.mailId && (
                    <span className="error_msg_color">{error.mailId}</span>
                  )
                  : // Single email - show vendorMailId error
                  error.vendorMailId && (
                    <span className="error_msg_color">
                      {error.vendorMailId}
                    </span>
                  )
              }
            </div>
            {showOtherMailInput && (
              <div className="model_input_field">
                <CustomInput
                  name="customMailId"
                  placeholder="Enter mail id"
                  label="Other(mail id)"
                  type="email"
                  control={control}
                  value={formData.customMailId || ""}
                  onChange={(e) => {
                    const customMailValue = e.target.value;
                    setFormData((prevFormData) => ({
                      ...prevFormData,
                      customMailId: customMailValue,
                      mailId: "Other", // Set mailId to the custom value
                    }));

                    // Validate email format
                    setErrors((prevErrors) => {
                      const newErrors = { ...prevErrors };
                      delete newErrors.mailId;
                      delete newErrors.customMailId;

                      // Add email format validation
                      if (customMailValue && !validateEmail(customMailValue)) {
                        newErrors.customMailId =
                          "Please enter a valid email address";
                      }

                      return newErrors;
                    });
                  }}
                  required={!isView || isEdit}
                />
                {error.customMailId && (
                  <span className="error_msg_color">{error.customMailId}</span>
                )}
              </div>
            )}
            {/* <div className="model_input_field">
                  {ckplLocationMatches.length > 1 ? (
                    <CustomSelect
                      name="ckplLocation"
                      placeholder="Choose CKPL Delivery Location"
                      label="CKPL Delivery Location"
                      // labelStyle={{ color: "limegreen" }}
                      labelStyle={{ color: "#EB043C" }}
                      value={
                        isEdit
                          ? formData.ckplLocation || data.ckplLocation
                          : isView
                          ? data.ckplLocation
                          : formData.ckplLocation
                      }
                      options={ckplLocationMatches.map((loc) => ({
                        value: loc.id,
                        label: loc.plantSearchTerm,
                      }))}
                      control={control}
                      onChange={(value) => {
                        // Find the selected object
                        const selected = ckplLocationMatches.find(
                          (loc) => loc.id === value
                        );
                        setFormData((prevFormData) => {
                          const updatedFormData = {
                            ...prevFormData,
                            ckplLocation: `${selected.searchTerm}-${selected.plantSearchTerm},${selected.city}`,
                          };
                          const vendorLocation =
                            updatedFormData.vendorLocation || data?.vendorLocation || "";
                          const gstType = calculateGstType(
                            vendorLocation,
                            selected.city
                          );
                          return {
                            ...updatedFormData,
                            gstType: gstType,
                          };
                        });
                        setErrors((prevErrors) => {
                          const newErrors = { ...prevErrors };
                          delete newErrors.ckplLocation;
                          return newErrors;
                        });
                      }}
                      disabled={isView && !isEdit}
                      tooltip={
                        isView & !isEdit
                          ? data.ckplLocation
                          : formData.ckplLocation
                      }
                    />
                  ) : (
                    <CustomInput
                      name="ckplLocation"
                      placeholder="Choose CKPL Delivery Location"
                      label="CKPL Delivery Location"
                      // labelStyle={{ color: "limegreen" }}
                      labelStyle={{ color: "#EB043C" }}
                      value={
                        isEdit
                          ? formData.ckplLocation || data.ckplLocation
                          : isView
                          ? data.ckplLocation
                          : formData.ckplLocation
                      }
                      tooltip={
                        isView && !isEdit
                          ? data.ckplLocation
                          : formData.ckplLocation
                      }
                      control={control}
                      readonly
                    />
                  )}
                  {error.ckplLocation && (
                    <span className="error_msg_color">
                      {error.ckplLocation}
                    </span>
                  )}
                </div>
              </>
            ) : ( */}

            <div className="model_input_field">
              <CustomInput
                name="currency"
                placeholder="Currency"
                label="Currency"
                control={control}
                // labelStyle={{ color: "limegreen" }}
                labelStyle={{ color: "#EB043C" }}
                value={
                  isEdit
                    ? formData.currency || data.currency
                    : isView
                      ? data.currency
                      : formData.currency
                }
                tooltip={isView ? data.currency : formData.currency}
                readonly
              />
              {/* {error.currency && (
                <span className="error_msg_color">{error.currency}</span>
              )} */}
            </div>

            <div className="model_input_field">
              <CustomInput
                name="accountNumber"
                placeholder="Account Number"
                label="Account Number"
                control={control}
                labelStyle={{ color: "#EB043C" }}
                value={
                  isEdit
                    ? formData.accountNumber || data.accountNumber
                    : isView
                    ? data.accountNumber
                    : formData.accountNumber
                }
                tooltip={isView ? data.accountNumber : formData.accountNumber}
                readonly
              />
            </div>

            <div className="model_input_field">
              <CustomInput
                name="paymentTerm"
                placeholder="Payment Terms"
                label={"Payment Terms"}
                control={control}
                // labelStyle={{ color: "limegreen" }}
                labelStyle={{ color: "#EB043C" }}
                // inputStyle={{ border: "1px solid #EB043C" }}
                value={
                  isEdit
                    ? formData.paymentTerm || data.paymentTerm
                    : isView
                      ? data.paymentTerm
                      : formData.paymentTerm
                }
                tooltip={isView ? data.paymentTerm : formData.paymentTerm}
                readonly
              />
              {/* {error.paymentTerm && (
                <span className="error_msg_color">{error.paymentTerm}</span>
              )} */}
            </div>
            <div className="model_input_field">
              <CustomInput
                name="advance"
                placeholder="Type"
                label="Advance"
                type="alphanumeric"
                control={control}
                required={!isView || isEdit}
                onChange={(event) => {
                  setFormData({ ...formData, advance: event.target.value });
                  setErrors((prevErrors) => {
                    const newErrors = { ...prevErrors };
                    delete newErrors.advance;
                    return newErrors;
                  });
                }}
                value={
                  isEdit
                    ? formData?.advance ?? data?.advance ?? ""
                    : isView
                      ? data?.advance ?? ""
                      : formData?.advance ?? ""
                }
                tooltip={isView ? data.advance : formData.advance}
                readonly={isView && !isEdit}
              />
              {error.advance && (
                <span className="error_msg_color">{error.advance}</span>
              )}
            </div>
            <div className="model_input_field">
              <CustomSelect
                name="poType"
                placeholder="Choose PO Type"
                label="PO Type"
                value={
                  isEdit
                    ? formData.poType || data.poType
                    : isView
                      ? data.poType
                      : formData.poType
                }
                options={[
                  { value: "Yearly_PO", label: "Yearly_PO" },
                  { value: "Quaterly_PO", label: "Quaterly_PO" },
                  { value: "Monthly_PO", label: "Monthly_PO" },
                ]}
                control={control}
                required={!isView || isEdit}
                onChange={(value) => handleMultiSelectChange(value, "poType")}
                disabled={isView && !isEdit}
              />
              {error.poType && (
                <span className="error_msg_color">{error.poType}</span>
              )}
            </div>
            <div className="model_input_field">
              <CustomInput
                name="Total Base Value"
                label="Total Base Amount"
                placeholder="Total Base Amount"
                type="number"
                control={control}
                value={
                  isEdit
                    ? formData.totalBaseValue || data.totalBaseValue
                    : isView
                      ? data.totalBaseValue
                      : formData?.totalBaseValue
                }
                tooltip={
                  isView ? data.totalBaseValue : formData?.totalBaseValue
                }
                required={
                  isSpecialVendor
                }
                onChange={(event) => {
                  setFormData({
                    ...formData,
                    totalBaseValue: event.target.value,
                  });
                  setErrors((prevErrors) => {
                    const newErrors = { ...prevErrors };
                    delete newErrors.totalBaseValue;
                    return newErrors;
                  });
                }}
                readonly={
                  !(
                    !isBrand &&
                    ((formData && formData.vendorCode === "3704453") ||
                      data.vendorCode === "3704453")
                  )
                }
              />
              {error.totalBaseValue && (
                <span className="error_msg_color">{error.totalBaseValue}</span>
              )}
            </div>
            {isBrand && (
              <div className="model_input_field">
                <CustomInput
                  name="roidescription"
                  placeholder="ROI Description"
                  label="ROI Description"
                  required={!isView || isEdit}
                  control={control}
                  value={
                    isEdit
                      ? formData.roiDescription || data.roiDescription
                      : isView
                        ? data.roiDescription
                        : formData.roiDescription
                  }
                  onChange={(event) => {
                    setFormData({
                      ...formData,
                      roiDescription: event.target.value,
                    });
                    setErrors((prevErrors) => {
                      const newErrors = { ...prevErrors };
                      delete newErrors.roiDescription;
                      return newErrors;
                    });
                  }}
                  type="alphanumeric"
                  tooltip={
                    isView ? data.roiDescription : formData.roiDescription
                  }
                  readonly={isView && !isEdit}
                />
                {error.roiDescription && (
                  <span className="error_msg_color">
                    {error.roiDescription}
                  </span>
                )}
              </div>
            )}
            {isSpecialVendor && (
              <div className="model_input_field">
                <CustomInput
                  name="poDescription"
                  placeholder="Enter Po Description"
                  label="Po Description"
                  required={!isView || isEdit}
                  control={control}
                  value={
                    isEdit
                      ? formData?.brand?.[0]?.poDescription ??
                      data?.brand?.[0]?.poDescription ??
                      ""
                      : isView
                        ? data?.brand?.[0]?.poDescription ?? ""
                        : formData?.brand?.[0]?.poDescription ?? ""
                  }
                  tooltip={
                    isEdit
                      ? formData?.brand?.[0]?.poDescription ??
                      data?.brand?.[0]?.poDescription ??
                      ""
                      : isView
                        ? data?.brand?.[0]?.poDescription ?? ""
                        : formData?.brand?.[0]?.poDescription ?? ""
                  }
                  onChange={(event) =>
                    handleMultiSelectChange(
                      event.target.value,
                      "poDescription",
                      0
                    )
                  }
                  readonly={isView && !isEdit}
                />
                {error.poDescription && (
                  <span className="error_msg_color">{error.poDescription}</span>
                )}
              </div>
            )}
            {isSpecialVendor && (
              <div className="model_input_field">
                <CustomInput
                  name="sacHsnCode"
                  placeholder="Enter SAC/HSN Code"
                  label="SAC/HSN Code"
                  required={!isView || isEdit}
                  control={control}
                  type="alphanumeric"
                  maxLength={15}
                  value={
                    isEdit
                      ? formData?.brand?.[0]?.sacHsnCode ??
                      data?.brand?.[0]?.sacHsnCode ??
                      ""
                      : isView
                        ? data?.brand?.[0]?.sacHsnCode ?? ""
                        : formData?.brand?.[0]?.sacHsnCode ?? ""
                  }
                  tooltip={
                    isEdit
                      ? formData?.brand?.[0]?.sacHsnCode ??
                      data?.brand?.[0]?.sacHsnCode ??
                      ""
                      : isView
                        ? data?.brand?.[0]?.sacHsnCode ?? ""
                        : formData?.brand?.[0]?.sacHsnCode ?? ""
                  }
                  onChange={(event) => {
                    const val = event.target.value.replace(/[^0-9]/g, "").slice(0, 15);
                    handleMultiSelectChange(val, "sacHsnCode", 0);
                  }}
                  readonly={isView && !isEdit}
                />
                {error.sacHsnCode && (
                  <span className="error_msg_color">{error.sacHsnCode}</span>
                )}
              </div>
            )}
            {/* {(!isBrand || data.brandOrNonBrand === "Non-Brand") && (
              <div className="model_input_field">
                <CustomSelect
                  name="ckplLocation"
                  placeholder="Choose CKPL Delivery Location"
                  label="CKPL Delivery Location"
                  value={
                    isEdit
                      ? formData.ckplLocation || data.ckplLocation
                      : isView
                      ? data.ckplLocation
                      : formData.ckplLocation
                  }
                  options={ckplLocations.map((loc) => ({
                    value: loc,
                    label: loc,
                  }))}
                  control={control}
                  required={!isBrand && (!isView || isEdit)}
                  onChange={(value) =>
                    handleMultiSelectChange(value, "ckplLocation")
                  }
                  disabled={isView && !isEdit}
                />

                {error.ckplLocation && (
                  <span className="error_msg_color">{error.ckplLocation}</span>
                )}
              </div>
            )} */}
            <div className="model_input_field">
              <label className="model_label">
                Attachment
                {!(
                  (isEdit
                    ? (formData.attachment !== undefined ? formData.attachment : data.attachment)
                    : data.attachment || formData.attachment
                  )?.length > 0
                ) && <span className="required-field">*</span>}
              </label>
              <div className="file-input-container">
                <label className="file_input_class he-50">
                  Choose File
                  <input
                    type="file"
                    accept=".pdf, .xls, .xlsx"
                    name="attachment"
                    multiple
                    disabled={isView && !isEdit}
                    onChange={(event) => {
                      handleMultiFileSelectChange(event.target.files);
                      event.target.value = "";
                    }}
                    className="d-none"
                  />
                </label>
                {error.attachment && (
                  <span className="error_msg_color">{error.attachment}</span>
                )}
                <div className="file-list he-60 ms-0 scroll_visible w-[80%]">
                  {(isEdit
                    ? (formData.attachment !== undefined ? formData.attachment : data.attachment)
                    : data.attachment || formData.attachment
                  )?.length > 0 ? (
                    (isEdit
                      ? (formData.attachment !== undefined ? formData.attachment : data.attachment)
                      : data.attachment || formData.attachment
                    )?.map((file, index) => {
                      const fileName =
                        typeof file === "string"
                          ? file
                          : file?.name || "Unnamed File";
                      const displayName =
                        fileName.length > 12
                          ? `${fileName.substring(0, 15)}...`
                          : fileName;

                      const isFromDataAttachment = data.attachment?.some((f) =>
                        typeof f === "string"
                          ? f === file
                          : f?.name ===
                          (typeof file === "string" ? file : file?.name)
                      );

                      return (
                        <div key={index} className="file-item">
                          <Tooltip title={fileName}>
                            {isFromDataAttachment ? (
                              <span
                                className="file-name"
                                style={{
                                  cursor: "pointer",
                                  color: "blue",
                                }}
                                onClick={() => handleFilePreview(file)}
                              >
                                {fileName.endsWith(".pdf") ? (
                                  <FilePdfOutlined
                                    style={{ color: "red", marginRight: "5px" }}
                                  />
                                ) : fileName.endsWith(".xls") ||
                                  fileName.endsWith(".xlsx") ? (
                                  <FileExcelOutlined
                                    style={{
                                      color: "green",
                                      marginRight: "5px",
                                    }}
                                  />
                                ) : (
                                  <FileOutlined
                                    style={{
                                      color: "gray",
                                      marginRight: "5px",
                                    }}
                                  />
                                )}
                                {displayName}
                              </span>
                            ) : (
                              <span
                                className="file-name"
                                style={{
                                  cursor: "pointer",
                                  color: "blue",
                                }}
                                onClick={() => handleFilePreview(file)}
                              >
                                {fileName.endsWith(".pdf") ? (
                                  <FilePdfOutlined
                                    style={{ color: "red", marginRight: "5px" }}
                                  />
                                ) : fileName.endsWith(".xls") ||
                                  fileName.endsWith(".xlsx") ? (
                                  <FileExcelOutlined
                                    style={{
                                      color: "green",
                                      marginRight: "5px",
                                    }}
                                  />
                                ) : (
                                  <FileOutlined
                                    style={{
                                      color: "gray",
                                      marginRight: "5px",
                                    }}
                                  />
                                )}
                                {displayName}
                              </span>
                            )}
                          </Tooltip>
                          {(isEdit || !isView) && (
                            <CloseCircleOutlined
                              onClick={() => handleRemoveFile(index)}
                              className="circle_outline"
                            />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="file-chosen">No file chosen</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {!(
          !isBrand &&
          ((formData && formData.isSpecialVendor) ||
            (data && data.vendorCode === "3704453"))
        ) && (
            <Collapse accordion>
              {inputValues.map((value, index, idx) => (
                <CollapsePanel
                  key={index}
                  header={`Basic Details ${index + 1}`}
                  className="basic_container"
                  extra={
                    (!isView || isEdit) ? (
                      <div className="button-container" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                        <Button className="add_Btn" onClick={handleAddForm}>
                          + <span>Add</span>
                        </Button>
                        <Button
                          className="add_Btn"
                          onClick={() => handleRemoveForm(index)}
                          style={{ marginRight: 0 }}
                        >
                          {" "}
                          - <span>Remove</span>
                        </Button>
                      </div>
                    ) : null
                  }
                >
                  <>
                    <div key={index} className="model_contain1">
                      <div className="model_body">
                        <div className="model_input_field">
                          <CustomInput
                            name={`brandOrNonBrand-${index}`}
                            placeholder="Brand/Non Brand"
                            label="Brand/Non Brand"
                            value={
                              index > 0 && formData?.brand?.[0]?.brandOrNonBrand
                                ? formData.brand[0].brandOrNonBrand === "Brand"
                                  ? "Brand"
                                  : "Non Brand"
                                : isEdit
                                  ? (formData?.brand?.[index]?.brandOrNonBrand ||
                                    data?.brand?.[index]?.brandOrNonBrand) ===
                                    "Brand"
                                    ? "Brand"
                                    : "Non Brand"
                                  : isView
                                    ? data?.brand?.[index]?.brandOrNonBrand ===
                                      "Brand"
                                      ? "Brand"
                                      : "Non Brand"
                                    : (formData?.brand?.[index]?.brandOrNonBrand ||
                                      (isBrand ? "Brand" : "NonBrand")) === "Brand"
                                      ? "Brand"
                                      : "Non Brand"
                            }
                            control={control}
                            readonly
                          />
                          {error[`brandornonbrand-${index}`] && (
                            <span className="error_msg_color">
                              {error[`brandornonbrand-${index}`]}
                            </span>
                          )}
                        </div>
                        {(formData?.brand?.[index]?.brandOrNonBrand !== "NonBrand" && data?.brand?.[index]?.brandOrNonBrand !== "NonBrand") && (
                            <div className="model_input_field">
                              <CustomInput
                                name={`materialCode-${index}`}
                                placeholder="Enter Material Code"
                                label="Material Code"
                                type="alphanumeric"
                                control={control}
                                required={
                                  (!isView || isEdit) &&
                                  (
                                    (formData?.brand?.[index]?.natureOfExpenses || data?.brand?.[index]?.natureOfExpenses) === "ADVERTISEMENT PRODUCTION-POP"
                                      ? poCategory[index] === "Material PO"
                                      : false
                                  )
                                }
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.materialCode ??
                                    data?.brand?.[index]?.materialCode ??
                                    ""
                                    : isView
                                      ? data?.brand?.[index]?.materialCode ?? ""
                                      : formData?.brand?.[index]?.materialCode ?? ""
                                }
                                tooltip={
                                  isEdit
                                    ? formData?.brand?.[index]?.materialCode ??
                                    data?.brand?.[index]?.materialCode ??
                                    ""
                                    : isView
                                      ? data?.brand?.[index]?.materialCode ?? ""
                                      : formData?.brand?.[index]?.materialCode ?? ""
                                }
                                onChange={(event) =>
                                  handleMultiSelectChange(
                                    event.target.value,
                                    "materialCode",
                                    index
                                  )
                                }
                                readonly={isView && !isEdit}
                              />
                              {error[`materialCode-${index}`] && (
                                <span className="error_msg_color">
                                  {error[`materialCode-${index}`]}
                                </span>
                              )}
                            </div>
                          )}
                        {poCategory[index] !== "Non-Material PO" &&
                          (formData?.brand?.[index]?.materialCode ||
                          (!isEdit && poCategory[index] !== "Non-Material PO" && data?.brand?.[index]?.materialCode)) && (
                            <div className="model_input_field">
                              <CustomSelect
                                name={`deliveryPlant-${index}`}
                                placeholder="Choose Delivery Plant"
                                label="Delivery Plant"
                                control={control}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.deliveryPlant ??
                                    data?.brand?.[index]?.deliveryPlant ??
                                    ""
                                    : isView
                                      ? data?.brand?.[index]?.deliveryPlant ?? ""
                                      : formData?.brand?.[index]?.deliveryPlant ?? ""
                                }
                                options={deliveryPlants.map((plant) => ({
                                  value: plant.name || plant,
                                  label: plant.name || plant,
                                }))}
                                onChange={(value) =>
                                  handleMultiSelectChange(
                                    value,
                                    "deliveryPlant",
                                    index
                                  )
                                }
                                required={!isView || isEdit}
                                disabled={isView && !isEdit}
                              />
                              {error[`deliveryPlant-${index}`] && (
                                <span className="error_msg_color">
                                  {error[`deliveryPlant-${index}`]}
                                </span>
                              )}
                            </div>
                          )}
                            <div className="model_input_field">
                              <CustomSelect
                                name={`division-${index}`}
                            placeholder="Choose Profit Centre"
                            label="Profit Centre"
                            required={!isView || isEdit}
                            value={
                              isEdit
                                ? formData?.brand?.[index]?.division ||
                                data?.brand?.[index]?.division
                                : isView
                                  ? data?.brand?.[index]?.division
                                  : formData?.brand?.[index]?.division
                            }
                            options={(() => {
                              const brandOrNonBrand =
                                formData?.brand?.[index]?.brandOrNonBrand ||
                                data?.brand?.[index]?.brandOrNonBrand;

                              // if (isEdit && brandOrNonBrand === "Brand") {
                              //   // Prefer brandDivision, fallback to draftOptions[index].division
                              //   const divisions = brandDivision.length
                              //     ? brandDivision
                              //     : draftOptions[index]?.division || [];
                              //   return divisions.map((name) => ({
                              //     value: name,
                              //     label: name,
                              //   }));
                              // }

                              if (brandOrNonBrand === "Brand") {
                                return divisionNames.map((name) => ({
                                  value: name,
                                  label: name,
                                }));
                              }

                              if (brandOrNonBrand === "NonBrand") {
                                return nonBrandDivision.map((name) => ({
                                  value: name,
                                  label: name,
                                }));
                              }

                              return [];
                            })()}
                            // ...existing code...
                            control={control}
                            onChange={(value) => {
                              handleInputChange(value, "division", index);
                              setErrors((prevErrors) => {
                                const newErrors = { ...prevErrors };
                                delete newErrors[`division-${index}`];
                                return newErrors;
                              });
                            }}
                            disabled={isFieldDisabled(
                              "division",
                              index,
                              formData?.brand?.[index]?.brandOrNonBrand ||
                              data?.brand?.[index]?.brandOrNonBrand
                            )}
                          />

                        </div>
                        {(formData?.brand?.[index]?.brandOrNonBrand !== "NonBrand" && data?.brand?.[index]?.brandOrNonBrand !== "NonBrand") && (
                            <div className="model_input_field">
                              <CustomSelect
                                name={`Brand-${index}`}
                                placeholder="Choose Brand"
                                label="Brand"
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.brand ||
                                    data?.brand?.[index]?.detailsBrand
                                    : isView
                                      ? data?.brand?.[index]?.detailsBrand
                                      : formData?.brand?.[index]?.brand
                                }
                                options={
                                  isEdit
                                    ? (brandNames.length
                                      ? brandNames
                                      : draftOptions[index]?.brand || []
                                    )?.map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                    : brandNames?.map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                }
                                required={!isView || isEdit}
                                control={control}
                                disabled={isFieldDisabled(
                                  "brand",
                                  index,
                                  "Brand"
                                )}
                                onChange={(value) => {
                                  handleInputChange(value, "brand", index);
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[`brand-${index}`];
                                    return newErrors;
                                  });
                                }}
                              />
                              {formData?.brand?.[index]?.brandOrNonBrand !==
                                "NonBrand" &&
                                !formData?.brand?.[index]?.brand &&
                                error[`brand-${index}`] && (
                                  <span className="error_msg_color">
                                    {error[`brand-${index}`]}
                                  </span>
                                )}
                            </div>
                          )}
                        {(formData?.brand?.[index]?.brandOrNonBrand !== "Brand" && data?.brand?.[index]?.brandOrNonBrand !== "Brand") && (
                            <div className="model_input_field">
                              <CustomSelect
                                name={`department-${index}`}
                                required={!isView || isEdit}
                                placeholder="Choose Department"
                                label="Department"
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.department ||
                                    data?.brand?.[index]?.department
                                    : isView
                                      ? data?.brand?.[index]?.department
                                      : formData?.brand?.[index]?.department
                                }
                                options={
                                  isEdit
                                    ? (nonBrandDepartment.length
                                      ? nonBrandDepartment
                                      : draftOptions[index]?.department || []
                                    ).map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                    : nonBrandDepartment.map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                }
                                control={control}
                                disabled={isFieldDisabled(
                                  "department",
                                  index,
                                  "NonBrand"
                                )}
                                onChange={(value) => {
                                  handleInputChange(value, "department", index);
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[`department-${index}`]; // Fixed this line
                                    return newErrors;
                                  });
                                }}
                              />
                              {formData?.brand?.[index]?.brandOrNonBrand ===
                                "NonBrand" &&
                                !formData?.brand?.[index]?.department &&
                                error[`department-${index}`] && (
                                  <span className="error_msg_color">
                                    {error[`department-${index}`]}
                                  </span>
                                )}
                            </div>
                          )}
                        {(formData?.brand?.[index]?.brandOrNonBrand !== "NonBrand" && data?.brand?.[index]?.brandOrNonBrand !== "NonBrand") && (
                            <div className="model_input_field">
                              <CustomSelect
                                name={`region-${index}`}
                                required={!isView || isEdit}
                                placeholder="Choose Region"
                                label="Region"
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.region ||
                                    data?.brand?.[index]?.region
                                    : isView
                                      ? data?.brand?.[index]?.region
                                      : formData?.brand?.[index]?.region
                                }
                                options={
                                  isEdit
                                    ? (brandRegion.length
                                      ? brandRegion
                                      : draftOptions[index]?.region || []
                                    ).map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                    : brandRegion.map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                }
                                control={control}
                                onChange={(value) => {
                                  handleInputChange(value, "region", index);
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[`region-${index}`];
                                    return newErrors;
                                  });
                                }}
                                disabled={isFieldDisabled(
                                  "region",
                                  index,
                                  "Brand"
                                )}
                              />
                              {formData?.brand?.[index]?.brandOrNonBrand !==
                                "NonBrand" &&
                                !formData?.brand?.[index]?.region &&
                                error[`region-${index}`] && (
                                  <span className="error_msg_color">
                                    {error[`region-${index}`]}
                                  </span>
                                )}
                            </div>
                          )}
                        {(formData?.brand?.[index]?.brandOrNonBrand !== "NonBrand" && data?.brand?.[index]?.brandOrNonBrand !== "NonBrand") && (
                            <div className="model_input_field">
                              <CustomMultiSelect
                                name={`district-${index}`}
                                required={!isView || isEdit}
                                placeholder="Choose Districts"
                                label="District"
                                value={
                                  isEdit
                                    ? formData.brand?.[index]?.district ||
                                    data.brand?.[index]?.district
                                    : isView
                                      ? data.brand?.[index]?.district
                                      : formData.brand?.[index]?.district
                                }
                                options={districtOptions[index] || []}
                                control={control}
                                onChange={(value) =>
                                  handleMultiSelectChange(
                                    value,
                                    "district",
                                    index
                                  )
                                }
                                showSelectAll={true}
                                disabled={isView && !isEdit}
                                loading={isDistrictLoading}
                              />
                              {(!formData?.brand?.[index]?.district ||
                                (Array.isArray(
                                  formData?.brand?.[index]?.district
                                ) &&
                                  formData?.brand?.[index]?.district.length ===
                                  0)) &&
                                error[`district-${index}`] && (
                                  <span className="error_msg_color">
                                    {error[`district-${index}`]}
                                  </span>
                                )}
                            </div>
                          )}
                        {(formData?.brand?.[index]?.brandOrNonBrand !== "NonBrand" && data?.brand?.[index]?.brandOrNonBrand !== "NonBrand") && (
                            <div className="model_input_field">
                              <CustomSelect
                                name={`channel-brand-${index}`}
                                required={!isView || isEdit}
                                placeholder="Choose Channel"
                                label="Channel"
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.channel ||
                                    data?.brand?.[index]?.channel
                                    : isView
                                      ? data?.brand?.[index]?.channel
                                      : formData?.brand?.[index]?.channel
                                }
                                options={
                                  isEdit
                                    ? (brandChannel.length
                                      ? brandChannel
                                      : draftOptions[index]?.channel || []
                                    ).map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                    : brandChannel.map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                }
                                control={control}
                                onChange={(value) => {
                                  handleInputChange(value, "channel", index);
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[`channel-${index}`];
                                    return newErrors;
                                  });
                                }}
                                disabled={isFieldDisabled(
                                  "channel",
                                  index,
                                  "Brand"
                                )}
                              />
                              {formData?.brand?.[index]?.brandOrNonBrand !==
                                "NonBrand" &&
                                !formData?.brand?.[index]?.channel &&
                                error[`channel-${index}`] && (
                                  <span className="error_msg_color">
                                    {error[`channel-${index}`]}
                                  </span>
                                )}
                              {/* )} */}
                            </div>
                          )}
                        {(formData?.brand?.[index]?.brandOrNonBrand !== "NonBrand" && data?.brand?.[index]?.brandOrNonBrand !== "NonBrand") && (
                            <div className="model_input_field">
                              <CustomSelect
                                name={`brandSubCategory-${index}`}
                                placeholder="Choose Brand Sub-Category"
                                label="Brand Sub-Category"
                                required={!isView || isEdit}
                                control={control}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]
                                      ?.brandSubCategory ||
                                    data?.brand?.[index]?.brandSubCategory
                                    : isView
                                      ? data?.brand?.[index]?.brandSubCategory
                                      : formData?.brand?.[index]?.brandSubCategory
                                }
                                onChange={(value) => {
                                  handleInputChange(
                                    value,
                                    "brandSubCategory",
                                    index
                                  );
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[`brandSubCategory-${index}`];
                                    return newErrors;
                                  });
                                }}
                                options={
                                  isEdit
                                    ? (brandSubCategory.length
                                      ? brandSubCategory
                                      : draftOptions[index]?.brandSubCategory ||
                                      []
                                    ).map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                    : brandSubCategory.map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                }
                                disabled={isFieldDisabled(
                                  "brandSubCategory",
                                  index,
                                  "Brand"
                                )}
                              />
                              {formData?.brand?.[index]?.brandOrNonBrand !==
                                "NonBrand" &&
                                !formData?.brand?.[index]?.brandSubCategory &&
                                error[`brandSubCategory-${index}`] && (
                                  <span className="error_msg_color">
                                    {error[`brandSubCategory-${index}`]}
                                  </span>
                                )}
                            </div>
                          )}
                        <div className="model_input_field">
                          <CustomInput
                            name={`Amount-${index}`}
                            placeholder="Enter Amount"
                            label="Amount"
                            required={!isView || isEdit}
                            control={control}
                            readonly={isView && !isEdit}
                            type="number"
                            min={1}
                            value={
                              isEdit
                                ? formData?.brand?.[index]?.value ??
                                data?.brand?.[index]?.value ??
                                ""
                                : isView
                                  ? data?.brand?.[index]?.value ?? ""
                                  : formData?.brand?.[index]?.value ?? ""
                            }
                            onChange={(event) =>
                              handleMultiSelectChange(
                                event.target.value,
                                "value",
                                index
                              )
                            }
                          />
                          {error[`value-${index}`] && (
                            <span className="error_msg_color">
                              {error[`value-${index}`]}
                            </span>
                          )}
                        </div>
                        {/* {formData?.brand?.[index]?.brandOrNonBrand !== "Brand" &&
                      data?.brand?.[index]?.brandOrNonBrand !== "Brand" && (
                        <div className="model_input_field">
                          <CustomInput
                            name="Sap Value"
                            placeholder="Enter Sap Value"
                            label={"Sap Value"}
                            required={!isView || isEdit}
                            readonly
                            control={control}
                            // disabled={
                            //   formData?.brand?.[index]?.brandOrNonBrand !==
                            //     "NonBrand" ||
                            //   !(
                            //     formData?.brand?.[index]?.fundCentre &&
                            //     formData?.brand?.[index]?.month &&
                            //     formData?.brand?.[index]?.year &&
                            //     formData?.brand?.[index]?.commitmentItem
                            //   )
                            // }
                            value={formData?.brand?.[index]?.sapvalue}
                            icon={
                              isSapValueGenerated ? (
                                <IoCheckmark
                                  className="valid_color"
                                  onClick={() => setIsSapValueGenerated(false)}
                                />
                              ) : isSapValueLoading ? (
                                <IoReloadCircleOutline className="valid_orange" />
                              ) : (
                                <IoReloadCircleOutline
                                  className="valid_orange"
                                  onClick={() => generateSapValue(index)}
                                />
                              )
                            }
                          />
                        </div>
                      )} */}
                        {(formData?.brand?.[index]?.brandOrNonBrand !== "Brand" && data?.brand?.[index]?.brandOrNonBrand !== "Brand") && (
                            <div className="model_input_field">
                              <CustomSelect
                                name={`location-${index}`}
                                placeholder="Choose Location"
                                label="Location"
                                required={!isView || isEdit}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.location ||
                                    data?.brand?.[index]?.location
                                    : isView
                                      ? data?.brand?.[index]?.location
                                      : formData?.brand?.[index]?.location
                                }
                                options={
                                  isEdit
                                    ? (nonBrandLocation.length
                                      ? nonBrandLocation
                                      : draftOptions[index]?.location || []
                                    ).map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                    : nonBrandLocation.map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                }
                                control={control}
                                disabled={isFieldDisabled(
                                  "location",
                                  index,
                                  "NonBrand"
                                )}
                                onChange={(value) => {
                                  handleInputChange(value, "location", index);
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[`location-${index}`];
                                    return newErrors;
                                  });
                                }}
                              />
                              {formData?.brand?.[index]?.brandOrNonBrand ===
                                "NonBrand" &&
                                !formData?.brand?.[index]?.location &&
                                error[`location-${index}`] && (
                                  <span className="error_msg_color">
                                    {error[`location-${index}`]}
                                  </span>
                                )}
                            </div>
                          )}
                        {(formData?.brand?.[index]?.brandOrNonBrand ===
                          "NonBrand" ||
                          data?.brand?.[index]?.brandOrNonBrand ===
                          "NonBrand") && (
                            <div className="model_input_field">
                              <CustomSelect
                                name={`channel-nonbrand-${index}`}
                                required={!isView || isEdit}
                                placeholder="Choose Channel"
                                label="Channel"
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.channel ||
                                    data?.brand?.[index]?.channel
                                    : isView
                                      ? data?.brand?.[index]?.channel
                                      : formData?.brand?.[index]?.channel
                                }
                                options={
                                  isEdit
                                    ? (nonbrandChannel.length
                                      ? nonbrandChannel
                                      : draftOptions[index]?.channel || []
                                    ).map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                    : (nonbrandChannel.length
                                      ? nonbrandChannel
                                      : draftOptions[index]?.channel || []
                                    ).map((name) => ({
                                      value: name,
                                      label: name,
                                    }))
                                }
                                control={control}
                                onChange={(value) => {
                                  handleInputChange(value, "channel", index);
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[`channel-${index}`];
                                    return newErrors;
                                  });
                                }}
                                disabled={isFieldDisabled(
                                  "channel",
                                  index,
                                  "NonBrand"
                                )}
                              />
                              {formData?.brand?.[index]?.brandOrNonBrand ===
                                "NonBrand" &&
                                !formData?.brand?.[index]?.channel &&
                                error[`channel-${index}`] && (
                                  <span className="error_msg_color">
                                    {error[`channel-${index}`]}
                                  </span>
                                )}
                            </div>
                          )}
                        <div className="model_input_field">
                          <CustomSelect
                            name={`natureOfExpenses-${index}`}
                            placeholder="Choose Nature of Expenses"
                            label="Nature of Expenses"
                            required={!isView || isEdit}
                            value={
                              isEdit
                                ? formData?.brand?.[index]?.natureOfExpenses ||
                                data?.brand?.[index]?.natureOfExpenses
                                : isView
                                  ? data?.brand?.[index]?.natureOfExpenses
                                  : formData?.brand?.[index]?.natureOfExpenses
                            }
                            options={(() => {
                              const firstIndexValue = isEdit
                                ? formData?.brand?.[0]?.natureOfExpenses ||
                                data?.brand?.[0]?.natureOfExpenses
                                : isView
                                  ? data?.brand?.[0]?.natureOfExpenses
                                  : formData?.brand?.[0]?.natureOfExpenses;

                              if (index === 0 || !firstIndexValue) {
                                return natureOfExpenses.map((name) => ({
                                  value: name,
                                  label: name,
                                }));
                              }

                              return [
                                {
                                  value: firstIndexValue,
                                  label: firstIndexValue,
                                },
                              ];
                            })()}
                            control={control}
                            onChange={(value) =>
                              natureOfExpensesChange(
                                value,
                                "natureOfExpenses",
                                index
                              )
                            }
                            disabled={isView && !isEdit}
                          />
                          {error[`natureOfExpenses-${index}`] && (
                            <span className="error_msg_color">
                              {error[`natureOfExpenses-${index}`]}
                            </span>
                          )}
                        </div>
                        {/* PO Category prompt for ADVERTISEMENT PRODUCTION-POP */}
                        {((
                          isEdit
                            ? formData?.brand?.[index]?.natureOfExpenses || data?.brand?.[index]?.natureOfExpenses
                            : isView
                              ? data?.brand?.[index]?.natureOfExpenses
                              : formData?.brand?.[index]?.natureOfExpenses
                        ) === "ADVERTISEMENT PRODUCTION-POP") && (
                          <div className="model_input_field">
                            <label className="model_label">
                              PO Category <span className="required-field">*</span>
                            </label>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: "8px",
                                height: "42px",
                                background: "#f5f5f5",
                                border: "1px solid #e9e9e9",
                                borderRadius: "8px",
                                padding: "0 10px",
                                width: "180px",
                              }}
                            >
                              {["Material PO", "Non-Material PO"].map((opt) => (
                                <label
                                  key={opt}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    cursor: "pointer",
                                    fontSize: "2px",
                                    fontWeight: 600,
                                    color: "#333",
                                    margin: 0,
                                    lineHeight: 1,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`poCategory-${index}`}
                                    value={opt}
                                    checked={poCategory[index] === opt}
                                    style={{ accentColor: "#EB043C", width: "14px", height: "14px", cursor: isView && !isEdit ? "not-allowed" : "pointer" }}
                                    disabled={isView && !isEdit}
                                    onChange={() => {
                                      setPoCategory((prev) => {
                                        const updated = [...prev];
                                        updated[index] = opt;
                                        return updated;
                                      });
                                      setFormData((prev) => {
                                        const updatedBrand = [...(prev.brand || [])];
                                        updatedBrand[index] = { ...updatedBrand[index], materialPo: opt === "Material PO", ...(opt === "Non-Material PO" && { materialCode: "", deliveryPlant: "" }) };
                                        return { ...prev, brand: updatedBrand };
                                      });
                                      setErrors((prev) => {
                                        const e = { ...prev };
                                        delete e[`poCategory-${index}`];
                                        delete e[`materialCode-${index}`];
                                        return e;
                                      });
                                    }}
                                  />
                                  <span style={{ fontSize: "9px", fontWeight: 600, color: "#333", fontFamily: "Manrope-Regular, sans-serif" }}>{opt}</span>
                                </label>
                              ))}
                            </div>
                            {error[`poCategory-${index}`] && (
                              <span className="error_msg_color">{error[`poCategory-${index}`]}</span>
                            )}
                          </div>
                        )}

                        <div className="model_input_field">
                          <CustomInput
                            name={`poDescription-${index}`}
                            placeholder="Enter Po Description"
                            label="Po Description"
                            required={!isView || isEdit}
                            control={control}
                            value={
                              isEdit
                                ? formData?.brand?.[index]?.poDescription ??
                                data?.brand?.[index]?.poDescription ??
                                ""
                                : isView
                                  ? data?.brand?.[index]?.poDescription ?? ""
                                  : formData?.brand?.[index]?.poDescription ?? ""
                            }
                            tooltip={
                              isEdit
                                ? formData?.brand?.[index]?.poDescription ??
                                data?.brand?.[index]?.poDescription ??
                                ""
                                : isView
                                  ? data?.brand?.[index]?.poDescription ?? ""
                                  : formData?.brand?.[index]?.poDescription ?? ""
                            }
                            onChange={(event) =>
                              handleMultiSelectChange(
                                event.target.value,
                                "poDescription",
                                index
                              )
                            }
                            readonly={isView && !isEdit}
                          />
                          {error[`poDescription-${index}`] && (
                            <span className="error_msg_color">
                              {error[`poDescription-${index}`]}
                            </span>
                          )}
                        </div>
                        <div className="model_input_field">
                          <label className="model_label">
                            Activity Start Date
                            {!(isEdit
                              ? formData?.brand?.[index]?.activityStartDate
                              : data?.brand?.[index]?.activityStartDate) && (
                                <span className="required-field">*</span>
                              )}
                          </label>
                          <div className="startpointer">
                            <Space direction="vertical">
                              <DatePicker
                                name="activityStartDate"
                                required={!isView || isEdit}
                                disabled={isView && !isEdit}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.activityStartDate
                                      ? dayjs(
                                        formData.brand[index].activityStartDate
                                      )
                                      : data?.brand?.[index]?.activityStartDate
                                        ? dayjs(data.brand[index].activityStartDate)
                                        : null
                                    : isView
                                      ? data?.brand?.[index]?.activityStartDate
                                        ? dayjs(data.brand[index].activityStartDate)
                                        : null
                                      : formData?.brand?.[index]?.activityStartDate
                                        ? dayjs(
                                          formData.brand[index].activityStartDate
                                        )
                                        : null
                                }
                                maxDate={
                                  formData?.brand?.[index]?.activityEndDate
                                    ? dayjs(formData.brand[index].activityEndDate)
                                    : null
                                }
                                onChange={(date, dateString) =>
                                  onChange(
                                    date,
                                    dateString,
                                    index,
                                    "activityStartDate"
                                  )
                                }
                                readOnly={isView}
                              />
                            </Space>
                          </div>
                          {error[`activityStartDate-${index}`] && (
                            <span className="error_msg_color">
                              {error[`activityStartDate-${index}`]}
                            </span>
                          )}
                        </div>
                        <div
                          className="model_input_field datepicker-wrapper"
                          style={{ position: "relative" }}
                        >
                          <label className="model_label">
                            Activity End Date
                            {!(isEdit
                              ? formData?.brand?.[index]?.activityEndDate
                              : data?.brand?.[index]?.activityEndDate) && (
                                <span className="required-field">*</span>
                              )}
                          </label>
                          <div>
                            <Space
                              direction="vertical"
                              size={4}
                              style={{ width: "100%" }}
                            >
                              <DatePicker
                                name="activityEndDate"
                                required={!isView || isEdit}
                                placement="topLeft"
                                getPopupContainer={(trigger) =>
                                  trigger.parentElement || document.body
                                }
                                dropdownClassName="end-date-dropdown"
                                disabled={
                                  isView && !isEdit
                                    ? true
                                    : !formData?.brand?.[index]?.activityStartDate
                                }
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.activityEndDate
                                      ? dayjs(
                                        formData.brand[index].activityEndDate
                                      )
                                      : data?.brand?.[index]?.activityEndDate
                                        ? dayjs(data.brand[index].activityEndDate)
                                        : null
                                    : isView
                                      ? data?.brand?.[index]?.activityEndDate
                                        ? dayjs(data.brand[index].activityEndDate)
                                        : null
                                      : formData?.brand?.[index]?.activityEndDate
                                        ? dayjs(formData.brand[index].activityEndDate)
                                        : null
                                }
                                minDate={
                                  formData?.brand?.[index]?.activityStartDate
                                    ? dayjs(
                                      formData.brand[index].activityStartDate
                                    )
                                    : null
                                }
                                disabledDate={(current) => {
                                  if (!current) return false;
                                  const today = dayjs();
                                  const start = formData?.brand?.[index]
                                    ?.activityStartDate
                                    ? dayjs(
                                      formData.brand[index].activityStartDate
                                    )
                                    : null;
                                  if (current.isBefore(today, "day")) return true;
                                  if (start && current.isBefore(start, "day"))
                                    return true;
                                  const todayDate = today.date();
                                  const isCurrentMonth = current.isSame(
                                    today,
                                    "month"
                                  );
                                  const daysInMonth = today.daysInMonth();
                                  const cutoffDate = daysInMonth - 4;
                                  if (
                                    todayDate >= cutoffDate &&
                                    isCurrentMonth &&
                                    current.date() >= cutoffDate
                                  ) {
                                    return true;
                                  }
                                  return false;
                                }}
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setShowEndDateDisclaimer((prev) => ({
                                      ...prev,
                                      [index]: false,
                                    }));
                                  } else {
                                    setTimeout(() => {
                                      const calendarCells =
                                        document.querySelectorAll(
                                          ".ant-picker-cell-disabled"
                                        );
                                      calendarCells.forEach((cell) => {
                                        cell.addEventListener("click", () => {
                                          setShowEndDateDisclaimer((prev) => ({
                                            ...prev,
                                            [index]: true,
                                          }));
                                        });
                                      });
                                    }, 100);
                                  }
                                }}
                                onChange={(date, dateString) =>
                                  onChange(
                                    date,
                                    dateString,
                                    index,
                                    "activityEndDate"
                                  )
                                }
                                readOnly={isView}
                              />
                              {showEndDateDisclaimer[index] && (
                                <div className="end-date-disclaimer">
                                  <div
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      top: "100%",
                                      marginTop: 8,
                                      zIndex: 2000,
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 4,
                                      color: "#F3901B",
                                      fontSize: 12,
                                      maxWidth: 220,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <InfoCircleOutlined
                                      style={{ marginTop: "4px" }}
                                    />
                                    <span>
                                      Period closed – please select next month for
                                      Activity End Date
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Space>
                          </div>
                          {error[`activityEndDate-${index}`] && (
                            <span className="error_msg_color">
                              {error[`activityEndDate-${index}`]}
                            </span>
                          )}
                        </div>

                        {formData?.brand?.[index]?.brandOrNonBrand !==
                          "NonBrand" &&
                          data?.brand?.[index]?.brandOrNonBrand !== "NonBrand" && (
                          <div className="model_input_field">
                            {ckplLocationMatches[index] &&
                              ckplLocationMatches[index].length > 1 ? (
                              <CustomSelect
                                name="ckplLocation"
                                placeholder="Choose CKPL Delivery Location"
                                label="CKPL Delivery Location"
                                value={
                                  isEdit
                                    ? formData.brand?.[index]?.ckplLocation ||
                                    data.brand?.[index]?.ckplLocation
                                    : isView
                                      ? data.brand?.[index]?.ckplLocation
                                      : formData.brand?.[index]?.ckplLocation
                                }
                                options={ckplLocationMatches[index].map(
                                  (loc) => ({
                                    value: loc.id,
                                    label: loc.plantSearchTerm,
                                  })
                                )}
                                control={control}
                                onChange={(value) => {
                                  const selected = ckplLocationMatches[
                                    index
                                  ].find((loc) => loc.id === value);
                                  setFormData((prevFormData) => {
                                    const updatedBrand = [
                                      ...(prevFormData.brand || []),
                                    ];
                                    updatedBrand[index] = {
                                      ...updatedBrand[index],
                                      ckplLocation: `${selected.searchTerm}-${selected.plantSearchTerm},${selected.city}`,
                                      gstType: calculateGstType(
                                        prevFormData.vendorLocation ||
                                        data?.vendorLocation ||
                                        "",
                                        selected.city,
                                        index
                                      ),
                                    };
                                    return {
                                      ...prevFormData,
                                      brand: updatedBrand,
                                    };
                                  });
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors.ckplLocation;
                                    return newErrors;
                                  });
                                }}
                                disabled={isView && !isEdit}
                                tooltip={
                                  isView && !isEdit
                                    ? data.brand?.[index]?.ckplLocation
                                    : formData.brand?.[index]?.ckplLocation
                                }
                              />
                            ) : (
                              <CustomInput
                                name="ckplLocation"
                                placeholder="Choose CKPL Delivery Location"
                                label="CKPL Delivery Location"
                                value={
                                  isEdit
                                    ? formData.brand?.[index]?.ckplLocation ||
                                    data.brand?.[index]?.ckplLocation
                                    : isView
                                      ? data.brand?.[index]?.ckplLocation
                                      : formData.brand?.[index]?.ckplLocation
                                }
                                tooltip={
                                  isView && !isEdit
                                    ? data.brand?.[index]?.ckplLocation
                                    : formData.brand?.[index]?.ckplLocation
                                }
                                control={control}
                                readonly
                              />
                            )}
                            {error[`ckplLocation-${index}`] && (
                              <span className="error_msg_color">
                                {error[`ckplLocation-${index}`]}
                              </span>
                            )}
                          </div>
                        )}

                        {formData?.brand?.[index]?.brandOrNonBrand !==
                          "NonBrand" &&
                          data?.brand?.[index]?.brandOrNonBrand !==
                          "NonBrand" && (
                            <div className="model_input_field">
                              <CustomInput
                                name="gstType"
                                placeholder="Choose GST"
                                label="GST"
                                value={
                                  isEdit
                                    ? formData.brand?.[index]?.gstType ||
                                    data.brand?.[index]?.gstType
                                    : isView
                                      ? data.brand?.[index]?.gstType
                                      : formData.brand?.[index]?.gstType
                                }
                                control={control}
                                readonly
                              />
                              {error[`gstType-${index}`] && (
                                <span className="error_msg_color">
                                  {error[`gstType-${index}`]}
                                </span>
                              )}
                            </div>
                          )}
                        {((!isView && formData?.brand?.[index]?.brandOrNonBrand === "Brand" && formData?.brand?.[index]?.glCode && eBriefOptions[index]?.length > 0) || (isEdit && data?.brand?.[index]?.brandOrNonBrand === "Brand" && data?.brand?.[index]?.glCode && eBriefOptions[index]?.length > 0) || (isView && !isEdit && data?.brand?.[index]?.brandOrNonBrand === "Brand" && data?.brand?.[index]?.glCode && data?.brand?.[index]?.ebrief !== null && data?.brand?.[index]?.ebrief !== undefined)) && (
                          <div className="model_input_field">
                            <CustomSelect
                              name="ebriefId"
                              placeholder="Choose E Brief"
                              label="E Brief"
                              required={!isView || isEdit}
                              control={control}
                              value={
                                isEdit
                                  ? formData?.brand?.[index]?.ebriefId ?? data?.brand?.[index]?.ebrief?.activity_id ?? ""
                                  : isView
                                    ? data?.brand?.[index]?.ebrief?.activity_id ?? ""
                                    : formData?.brand?.[index]?.ebriefId ?? ""
                              }
                              options={eBriefOptions[index] || []}
                              onChange={(value) => {
                                const updatedBrand = [...(formData.brand || [])];
                                updatedBrand[index] = { ...updatedBrand[index], ebriefId: parseInt(value) };
                                setFormData({ ...formData, brand: updatedBrand });
                                setErrors((prevErrors) => {
                                  const newErrors = { ...prevErrors };
                                  delete newErrors.ebriefId;
                                  return newErrors;
                                });
                              }}
                              disabled={isView && !isEdit}
                            />
                            {error[`ebriefId-${index}`] && (
                              <span className="error_msg_color">
                                {error[`ebriefId-${index}`]}
                              </span>
                            )}
                          </div>
                        )}
                          <div className="model_input_field">
                          <CustomInput
                            name={`sacHsnCode-${index}`}
                            placeholder="Enter SAC/HSN Code"
                            label="SAC/HSN Code"
                            required={!isView || isEdit}
                            control={control}
                            type="alphanumeric"
                            maxLength={15}
                            value={
                              isEdit
                                ? formData?.brand?.[index]?.sacHsnCode ??
                                data?.brand?.[index]?.sacHsnCode ??
                                ""
                                : isView
                                  ? data?.brand?.[index]?.sacHsnCode ?? ""
                                  : formData?.brand?.[index]?.sacHsnCode ?? ""
                            }
                            onChange={(event) => {
                              const val = event.target.value.replace(/[^0-9]/g, "").slice(0, 15);
                              handleMultiSelectChange(val, "sacHsnCode", index);
                            }}
                            readonly={isView && !isEdit}
                          />
                          {error[`sacHsnCode-${index}`] && (
                            <span className="error_msg_color">
                              {error[`sacHsnCode-${index}`]}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Brand Details Section */}
                      <div className="model_form3">
                        <div className="model_form3_body">
                          <div>
                            <h6 className="body_title">Brand Details</h6>
                          </div>
                          <div className="model_body3">
                            <div className="model_input_field">
                              <label className="model_label">I/O or CC PO</label>
                              <span className="required-field"></span>
                              <CustomInput
                                name={`ioOrCostCentrePo-${index}`}
                                placeholder="I/O or CC PO"
                                control={control}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]
                                      ?.ioOrCostCentrePo ||
                                    data?.brand?.[index]?.ioOrCostCentrePo
                                    : isView
                                      ? data?.brand?.[index]?.ioOrCostCentrePo
                                      : formData?.brand?.[index]?.ioOrCostCentrePo
                                }
                                tooltip={
                                  isView
                                    ? data?.brand?.[index]?.ioOrCostCentrePo
                                    : formData?.brand?.[index]?.ioOrCostCentrePo
                                }
                                readonly
                              />
                            </div>
                            <div className="model_input_field">
                              <label className="model_label">Fund Center</label>
                              {(() => {
                                // Get the fund center options array based on your logic
                                const fundCentreOptions = isEdit
                                  ? brandFundCenter.length
                                    ? brandFundCenter
                                    : draftOptions[index]?.fundCentre || []
                                  : brandFundCenter;

                                // Always show input field when in view mode or when required dependencies are not met
                                const isBrandType =
                                  formData?.brand?.[index]?.brandOrNonBrand ===
                                  "Brand" ||
                                  data?.brand?.[index]?.brandOrNonBrand ===
                                  "Brand";
                                const isNonBrandType =
                                  formData?.brand?.[index]?.brandOrNonBrand ===
                                  "NonBrand" ||
                                  data?.brand?.[index]?.brandOrNonBrand ===
                                  "NonBrand";

                                const shouldShowReadonlyInput =
                                  (isView && !isEdit) ||
                                  (isBrandType &&
                                    !formData?.brand?.[index]?.channel) ||
                                  (isNonBrandType &&
                                    !formData?.brand?.[index]?.location);

                                if (shouldShowReadonlyInput) {
                                  return (
                                    <CustomInput
                                      name={`fundcenter-readonly-${index}`}
                                      placeholder="Fund Center"
                                      control={control}
                                      value={
                                        data?.brand?.[index]?.fundCentre || ""
                                      }
                                      readonly
                                      tooltip={data?.brand?.[index]?.fundCentre}
                                    />
                                  );
                                }

                                // For edit/create mode, use the existing logic
                                if (
                                  fundCentreOptions.length === 1 ||
                                  (fundCentreOptions.length === 0 &&
                                    formData?.brand?.[index]?.fundCentre)
                                ) {
                                  return (
                                    <CustomInput
                                      name={`fundcenter-auto-${index}`}
                                      placeholder="Fund Center"
                                      control={control}
                                      value={
                                        isEdit
                                          ? formData?.brand?.[index]
                                            ?.fundCentre ||
                                          data?.brand?.[index]?.fundCentre ||
                                          fundCentreOptions[0]
                                          : formData?.brand?.[index]
                                            ?.fundCentre || fundCentreOptions[0]
                                      }
                                      readonly
                                    />
                                  );
                                } else {
                                  return (
                                    <CustomSelect
                                      name={`fundcenter-${index}`}
                                      placeholder="Choose Fund Center"
                                      control={control}
                                      options={fundCentreOptions.map((name) => ({
                                        value: name,
                                        label: name,
                                      }))}
                                      value={
                                        isEdit
                                          ? formData?.brand?.[index]
                                            ?.fundCentre ||
                                          data?.brand?.[index]?.fundCentre
                                          : formData?.brand?.[index]?.fundCentre
                                      }
                                      disabled={isFieldDisabled(
                                        "fundCentre",
                                        index,
                                        formData?.brand?.[index]
                                          ?.brandOrNonBrand ||
                                        data?.brand?.[index]?.brandOrNonBrand
                                      )}
                                      onChange={(value) => {
                                        handleInputChange(
                                          value,
                                          "fundCentre",
                                          index
                                        );
                                        setErrors((prevErrors) => {
                                          const newErrors = { ...prevErrors };
                                          delete newErrors[`fundCentre-${index}`];
                                          return newErrors;
                                        });
                                      }}
                                    />
                                  );
                                }
                              })()}
                              {error[`fundCentre-${index}`] &&
                                !formData?.brand?.[index]?.fundCentre && (
                                  <span className="error_msg_color">
                                    {error[`fundCentre-${index}`]}
                                  </span>
                                )}
                            </div>
                            {formData?.brand?.[index]?.brandOrNonBrand !==
                              "NonBrand" &&
                              data?.brand?.[index]?.brandOrNonBrand !==
                              "NonBrand" && (
                                <div className="model_input_field">
                                  <label className="model_label">
                                    Internal Order
                                  </label>
                                  <CustomInput
                                    name={`internalorder-${index}`}
                                    placeholder="Internal Order"
                                    control={control}
                                    value={
                                      isEdit
                                        ? formData?.brand?.[index]
                                          ?.internalorder ||
                                        data?.brand?.[index]?.internalorder
                                        : isView
                                          ? data?.brand?.[index]?.internalorder
                                          : formData?.brand?.[index]?.internalorder
                                    }
                                    readonly
                                  // disabled={
                                  //   formData?.brand?.[index]?.brandOrNonBrand !==
                                  //   "Brand"
                                  // }
                                  />
                                </div>
                              )}
                            {formData?.brand?.[index]?.brandOrNonBrand !==
                              "Brand" &&
                              data?.brand?.[index]?.brandOrNonBrand !==
                              "Brand" && (
                                <div className="model_input_field">
                                  <label className="model_label">
                                    Cost Center
                                  </label>
                                  <CustomSelect
                                    name={`costcenter-${index}`}
                                    placeholder="Cost Center"
                                    control={control}
                                    options={nonBrandCostCenterOptions.map(
                                      (name) => ({
                                        value: name,
                                        label: name,
                                      })
                                    )}
                                    value={
                                      isEdit
                                        ? formData?.brand?.[index]?.costcenter ||
                                        data?.brand?.[index]?.costcenter
                                        : isView
                                          ? data?.brand?.[index]?.costcenter
                                          : formData?.brand?.[index]?.costcenter
                                    }
                                    disabled={
                                      formData?.brand?.[index]
                                        ?.brandOrNonBrand !== "NonBrand" ||
                                      isFieldDisabled(
                                        "costcenter",
                                        index,
                                        "NonBrand"
                                      )
                                    }
                                    onChange={(value) =>
                                      handleMultiSelectChange(
                                        value,
                                        "costcenter",
                                        index
                                      )
                                    }
                                  />
                                  {formData?.brand?.[index]?.brandOrNonBrand ===
                                    "NonBrand" &&
                                    error.costcenter && (
                                      <span className="error_msg_color">
                                        {error.costcenter}
                                      </span>
                                    )}
                                </div>
                              )}
                            <div className="model_input_field">
                              <label className="model_label">
                                Commitment Item
                              </label>
                              <CustomInput
                                name={`commitmentItem-${index}`}
                                placeholder=" Commitment Item"
                                control={control}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.commitmentItem ||
                                    data?.brand?.[index]?.commitmentItem
                                    : isView
                                      ? data?.brand?.[index]?.commitmentItem
                                      : formData?.brand?.[index]?.commitmentItem
                                }
                                readonly
                              />
                            </div>
                            <div className="model_input_field">
                              <label className="model_label">
                                GL Description
                              </label>
                              <CustomInput
                                name={`glDescription-${index}`}
                                placeholder="GL Description"
                                control={control}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.glDescription ||
                                    data?.brand?.[index]?.glDescription
                                    : isView
                                      ? data?.brand?.[index]?.glDescription
                                      : formData?.brand?.[index]?.glDescription
                                }
                                tooltip={
                                  isView
                                    ? data?.brand?.[index]?.glDescription
                                    : formData?.brand?.[index]?.glDescription
                                }
                                readonly
                              />
                            </div>
                            <div className="model_input_field">
                              <label className="model_label">
                                GL Code
                              </label>
                              <CustomInput
                                name={`glCode-${index}`}
                                placeholder=" Gl Code"
                                control={control}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.glCode ||
                                    data?.brand?.[index]?.glCode
                                    : isView
                                      ? data?.brand?.[index]?.glCode
                                      : formData?.brand?.[index]?.glCode
                                }
                                tooltip={
                                  isView
                                    ? data?.brand?.[index]?.glCode
                                    : formData?.brand?.[index]?.glCode
                                }
                                readonly
                              />
                            </div>

                            <div className="model_input_field">
                              <label className="model_label">
                                Total Base Amount
                              </label>
                              <CustomInput
                                name={`totalBaseAmount-${index}`}
                                placeholder="Total Base Amount"
                                control={control}
                                readonly
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.value ||
                                    data?.brand?.[index]?.value
                                    : isView
                                      ? data?.brand?.[index]?.value
                                      : formData?.brand?.[index]?.value
                                }
                              />
                            </div>
                            <div className="model_input_field">
                              <label className="model_label">
                                {isBrand ? "Month and Year" : "Delivery Month"}
                              </label>
                              <CustomInput
                                name={`monthYear-${index}`}
                                placeholder={
                                  isBrand ? "Month and Year" : "Delivery Month"
                                }
                                control={control}
                                value={
                                  isEdit
                                    ? formData?.brand?.[index]?.month &&
                                      formData?.brand?.[index]?.year
                                      ? `${formData?.brand?.[index]?.month}-${formData?.brand?.[index]?.year}`
                                      : data?.brand?.[index]?.month &&
                                        data?.brand?.[index]?.year
                                        ? `${data?.brand?.[index]?.month}-${data?.brand?.[index]?.year}`
                                        : ""
                                    : isView
                                      ? data?.brand?.[index]?.month &&
                                        data?.brand?.[index]?.year
                                        ? `${data?.brand?.[index]?.month}-${data?.brand?.[index]?.year}`
                                        : ""
                                      : formData?.brand?.[index]?.month &&
                                        formData?.brand?.[index]?.year
                                        ? `${formData?.brand?.[index]?.month}-${formData?.brand?.[index]?.year}`
                                        : ""
                                }
                                tooltip={
                                  isEdit
                                    ? formData?.brand?.[index]?.month &&
                                      formData?.brand?.[index]?.year
                                      ? `${formData?.brand?.[index]?.month}-${formData?.brand?.[index]?.year}`
                                      : data?.brand?.[index]?.month &&
                                        data?.brand?.[index]?.year
                                        ? `${data?.brand?.[index]?.month}-${data?.brand?.[index]?.year}`
                                        : ""
                                    : isView
                                      ? data?.brand?.[index]?.month &&
                                        data?.brand?.[index]?.year
                                        ? `${data?.brand?.[index]?.month}-${data?.brand?.[index]?.year}`
                                        : ""
                                      : formData?.brand?.[index]?.month &&
                                        formData?.brand?.[index]?.year
                                        ? `${formData?.brand?.[index]?.month}-${formData?.brand?.[index]?.year}`
                                        : ""
                                }
                                readonly
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                </CollapsePanel>
              ))}
            </Collapse>
          )}
        {!isBrand &&
  (((formData && formData.isSpecialVendor) ||
    (data && data.vendorCode === "3704453")) ||
    (formData?.brand?.some((b) => b.department === "102 CMD Office") ||
      data?.brand?.some((b) => b.department === "102 CMD Office"))) &&
  (() => {
    const isCmdOfficeSection =
      !(
        (formData && formData.isSpecialVendor) ||
        (data && data.vendorCode === "3704453")
      ) &&
      (formData?.brand?.some((b) => b.department === "102 CMD Office") ||
        data?.brand?.some((b) => b.department === "102 CMD Office"));

    return (
      <div className="model_form" style={{ marginTop: "20px" }}>
        <div className="model_body">
          <div className="model_input_field">
            <div
              className="d-flex ml-2 gap-5"
              style={{ alignItems: "center", flexWrap: "wrap" }}
            >
              {/* Pre-Approved */}
              <label className="d-flex align-center gap-2">
                <input
                  type="radio"
                  name="approvalType"
                  checked={
                    formData.approvalType === "Pre-Approved" ||
                    data?.approvalType === true
                  }
                  onClick={() => {
                    setFormData({
                      ...formData,
                      approvalType: "Pre-Approved",
                      businessApprover: "",
                    });
                    setErrors((prev) => {
                      const e = { ...prev };
                      delete e.approvalType;
                      delete e.businessApprover;
                      delete e.preApprovedFiles;
                      return e;
                    });
                  }}
                  disabled={isView && !isEdit}
                />
                Pre-Approved
              </label>

              {/* Non Pre-Approved */}
              <label className="d-flex align-center gap-2">
                <input
                  type="radio"
                  name="approvalType"
                  checked={
                    formData.approvalType === "Non Pre-Approved" ||
                    data?.approvalType === false
                  }
                  onClick={() => {
                    setFormData({
                      ...formData,
                      approvalType: "Non Pre-Approved",
                    });
                    setErrors((prev) => {
                      const e = { ...prev };
                      delete e.approvalType;
                      delete e.preApprovedFiles;
                      return e;
                    });
                  }}
                  disabled={isView && !isEdit}
                />
                Non Pre-Approved
              </label>

              {/* File Upload */}
              {(formData.approvalType === "Pre-Approved" ||
                data?.approvalType === true) && (
                <>
                  {!(isView && !isEdit) && (
                    <label
                      className="file_input_class"
                      style={{ height: "35px", padding: "6px 12px" }}
                    >
                      Choose File
                      <input
                        type="file"
                        accept={
                          isCmdOfficeSection
                            ? ".pdf,.xls,.xlsx"
                            : ".eml"
                        }
                        multiple
                        onChange={(e) =>
                          handlepreApprovedFilesUpload(
                            e,
                            isCmdOfficeSection
                          )
                        }
                        className="d-none"
                        disabled={isView && !isEdit}
                      />
                    </label>
                  )}

                  {/* File List */}
                  <div
                    className="file-list d-inline-block"
                    style={{
                      width: "180px",
                      maxHeight: "85px",
                      overflowY: "auto",
                    }}
                  >
                    {(() => {
                      let files = isEdit
                        ? [
                            ...(data.preApprovedFiles || []),
                            ...(formData.preApprovedFiles || []),
                          ]
                        : data.preApprovedFiles ||
                          formData.preApprovedFiles ||
                          [];

                      if (isEdit && formData.deletedPreApprovedFiles) {
                        files = files.filter(
                          (f) =>
                            !formData.deletedPreApprovedFiles.includes(f)
                        );
                      }

                      return files.length ? (
                        files.map((file, idx) => {
                          const fileName =
                            typeof file === "string"
                              ? file
                              : file.name;

                          const displayName =
                            fileName.length > 15
                              ? fileName.slice(0, 15) + "..."
                              : fileName;

                          const isFromDataFile =
                            data.preApprovedFiles?.some((f) =>
                              typeof f === "string"
                                ? f === file
                                : f.name === fileName
                            );

                          return (
                            <div key={idx} className="d-flex gap-1">
                              <Tooltip title={fileName}>
                                <span
                                  style={{
                                    cursor: isFromDataFile
                                      ? "pointer"
                                      : "default",
                                  }}
                                  onClick={() =>
                                    isFromDataFile &&
                                    Attachment(fileName)
                                  }
                                >
                                  {displayName}
                                </span>
                              </Tooltip>

                              {(isEdit || !isFromDataFile) && (
                                <CloseCircleOutlined
                                  onClick={() => {
                                    const dataCount =
                                      data.preApprovedFiles?.length || 0;

                                    if (idx < dataCount) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        deletedPreApprovedFiles: [
                                          ...(prev.deletedPreApprovedFiles ||
                                            []),
                                          file,
                                        ],
                                      }));
                                    } else {
                                      setFormData((prev) => {
                                        const arr = [
                                          ...(prev.preApprovedFiles || []),
                                        ];
                                        arr.splice(idx - dataCount, 1);
                                        return {
                                          ...prev,
                                          preApprovedFiles:
                                            arr.length ? arr : null,
                                        };
                                      });
                                    }
                                  }}
                                />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span>No file chosen</span>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>

            {error.approvalType && (
              <span className="error_msg_color">
                {error.approvalType}
              </span>
            )}
            {error.preApprovedFiles && (
              <span className="error_msg_color">
                {error.preApprovedFiles}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  })()}

        {/* form 2 end*/}
        {/* {(role === "Budget_Team" ||
          role === "Business_head" ||
          role === "Budget_release_team" ||
          (role === "Po_maker" && data.brandOrNonBrand === "Brand") ||
          (role === "Po_checker" && data.brandOrNonBrand === "Brand") ||
          (role === "Po_release" && data.brandOrNonBrand === "Brand") ||
          (role === "PO_Screening" &&
            tabData === "Completed" &&
            (data.budgetDetails === "Exceed" ||
              data.budgetDetails === "Not Exceed") &&
            data.stage !== "Budget_Team" &&
            data.stage !== "Business_Approver" &&
            data.stage !== "Requestor" &&
            (data.stage !== "PO_Screening" ||
              (data.stage === "PO_Screening" &&
                (prattach === "Po_maker" ||
                  prattach === "Budget_release_team")))) ||
          (role === "Business_Approver" &&
            tabData === "Completed" &&
            (data.budgetDetails === "Exceed" ||
              data.budgetDetails === "Not Exceed") &&
            data.stage !== "Budget_Team" &&
            data.stage !== "PO_Screening" &&
            data.stage !== "Business_Approver" &&
            data.stage !== "Requestor") ||
          (role === "Requestor" &&
            tabData === "Completed" &&
            data.brandOrNonBrand === "Brand" &&
            (data.budgetDetails === "Exceed" ||
              data.budgetDetails === "Not Exceed")) ||
          (role === "admin" &&
            tabData === "Completed" &&
            data.brandOrNonBrand === "Brand" &&
            (data.budgetDetails === "Exceed" ||
              data.budgetDetails === "Not Exceed"))) && (
          <div className="budget_container">
            <div>
              <h6 className="body_title">Budget Details</h6>
            </div>
            <div className="d-flex pos_padding gap-3 media_addon">
              <div className="radio_btn">
                <div className="radio_group d-flex nonex_Addon">
                  <label className="gap-2 d-flex align-center">
                    <input
                      type="radio"
                      className="radio_exceed Manrope_Bold"
                      name="radio1"
                      checked={formData.budgetExceed === "Exceed"}
                      {...(checkRes && data.stage !== "Budget_Team"
                        ? { checked: exceedNew }
                        : {})}
                      disabled={
                        isView && checkRes && data.stage !== "Budget_Team"
                      }
                      onClick={() => {
                        setExceed(true);
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          budgetExceed: "Exceed",
                        }));
                        setErrors({});
                      }}
                    />
                    Exceed
                  </label>
                  <label className="gap-2 d-flex align-center">
                    <input
                      type="radio"
                      className="radio_exceed Manrope_Bold"
                      name="radio1"
                      checked={formData.budgetExceed === "Not Exceed"}
                      {...(checkRes && data.stage !== "Budget_Team"
                        ? { checked: notExceedNew }
                        : {})}
                      disabled={
                        isView && checkRes && data.stage !== "Budget_Team"
                      }
                      onClick={() => {
                        setExceed(false);
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          budgetExceed: "Not Exceed",
                        }));
                        setErrors({});
                      }}
                    />
                    Not Exceed
                  </label>
                </div>
              </div>
              {(exceed ||
                (data.budgetDetails === "Exceed" &&
                  data.reason &&
                  (data.status !== "Reject" ||
                    (data.status === "Reject" &&
                      (prattach === "Budget_release_team" ||
                        prattach === "Po_maker"))))) && (
                <div className="d-flex ml-3 gap-2 exceed_Addon">
                  <label className="">If Exceed Budget*</label>
                  <div>
                    <div className="d-flex ml-2 gap-2 avail_addon">
                      <label className="d-flex align-center justify-content-center gap-2">
                        <input
                          type="radio"
                          className="radio_exceed Manrope_Bold d-flex"
                          name="radio2"
                          checked={
                            formData.budgetExceedAvailable === "Available"
                          }
                          {...(checkAvailable && data.stage !== "Budget_Team"
                            ? { checked: availableNew }
                            : {})}
                          disabled={
                            isView &&
                            checkAvailable &&
                            data.stage !== "Budget_Team"
                          }
                          onClick={() => {
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              budgetExceedAvailable: "Available",
                            }));
                            setErrors({});
                          }}
                        />
                        Available
                      </label>
                      <label className="d-flex align-center justify-content-center gap-2">
                        <input
                          type="radio"
                          value="Not Available"
                          className="radio_exceed Manrope_Bold d-flex"
                          name="radio2"
                          checked={
                            formData.budgetExceedAvailable === "Not Available"
                          }
                          {...(checkAvailable && data.stage !== "Budget_Team"
                            ? { checked: notAvailableNew }
                            : {})}
                          disabled={
                            isView &&
                            checkAvailable &&
                            data.stage !== "Budget_Team"
                          }
                          onClick={() => {
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              budgetExceedAvailable: "Not Available",
                            }));
                            setErrors({});
                          }}
                        />
                        Not Available
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )} */}
        {error.budgetDetails && (
          <span className="error_msg_color">{error.budgetDetails}</span>
        )}

        {((role === "Budget_Team" && tabData === "Pending") ||
          (role === "Po_maker" && data.docNum) ||
          (role === "Po_checker" && data.docNum) ||
          (role === "Po_release" && data.docNum) ||
          (role === "Business_head" &&
            tabData === "Completed" &&
            data.docNum) ||
          (role === "Budget_Team" && tabData === "Completed" && data.docNum) ||
          (role === "PO_Screening" && tabData === "Completed" && data.docNum) ||
          (role === "Business_Approver" &&
            tabData === "Completed" &&
            data.docNum) ||
          (role === "Requestor" &&
            tabData === "Completed" &&
            data.brandOrNonBrand === "Brand" &&
            data.docNum) ||
          (role === "Delivery_Planner" &&
            tabData === "Completed" &&
            data.brandOrNonBrand === "Brand" &&
            data.docNum) ||
          (role === "Internal_Audit" &&
            tabData === "Completed" &&
            data.docNum) ||
          (role === "admin" &&
            tabData === "Completed" &&
            data.brandOrNonBrand === "Brand" &&
            data.docNum)) && (
            <div className="input_conatiner">
              <div className="model_input_field p-16">
                <CustomInput
                  name="documentNumber"
                  placeholder="Enter Document Number"
                  control={control}
                  label={"Document Number"}
                  value={
                    isView && data.docNum
                      ? formData.documentNumber || data.docNum || ""
                      : formData.documentNumber || ""
                  }
                  type="number"
                  required={
                    !(formData.documentNumber || data.docNum) ? true : false
                  }
                  readonly={isView && data.docNum && data.stage !== "Budget_Team"}
                  onChange={(e) => {
                    setFormData({ ...formData, documentNumber: e.target.value });
                    setErrors({});
                  }}
                />
                {error.documentNumber && (
                  <span className="error_msg_color">{error.documentNumber}</span>
                )}
              </div>
            </div>
          )}
        {(role === "Po_maker" ||
          role === "Po_checker" ||
          role === "Po_release" ||
          role === "Budget_Team" ||
          (role === "Budget_release_team" &&
            tabData === "Completed" &&
            data.poNumber !== "null" &&
            data.poNumber !== null) ||
          (role === "Business_head" &&
            tabData === "Completed" &&
            data.poNumber !== "null" &&
            data.poNumber !== null) ||
          // (role === "Budget_Team" &&
          //   tabData === "Completed" &&
          //   data.poNumber !== "null" &&
          //   data.poNumber !== null) ||
          (role === "PO_Screening" &&
            tabData === "Completed" &&
            data.poNumber !== "null" &&
            data.poNumber !== null) ||
          (role === "Business_Approver" &&
            tabData === "Completed" &&
            ((data.poNumber !== "null" && data.poNumber !== null) ||
              data.budgetFile)) ||
          (role === "Requestor" &&
            tabData === "Completed" &&
            ((data.poNumber !== "null" && data.poNumber !== null) ||
              data.budgetFile)) ||
          (role === "Delivery_Planner" &&
            tabData === "Completed" &&
            data.poNumber !== "null" &&
            data.poNumber !== null) ||
          (role === "Internal_Audit" &&
            tabData === "Completed" &&
            data.poNumber !== "null" &&
            data.poNumber !== null) ||
          (role === "admin" &&
            tabData === "Completed" &&
            data.poNumber !== "null" &&
            data.poNumber !== null)) && (
            <>
              {data?.brandOrNonBrand === "NonBrand" &&
                data?.vendorCode !== "3704453" &&
                role === "Po_maker" && (
                  <div className="input_conatiner">
                    <div className="model_body">
                      <div className="model_input_field">
                        <CustomInput
                          name="Sap Value"
                          placeholder="Current Available Budget"
                          label="Current Available Budget"
                          required={!isView || isEdit}
                          readonly
                          control={control}
                          // disabled={
                          //   formData?.brand?.[index]?.brandOrNonBrand !==
                          //     "NonBrand" ||
                          //   !(
                          //     formData?.brand?.[index]?.fundCentre &&
                          //     formData?.brand?.[index]?.month &&
                          //     formData?.brand?.[index]?.year &&
                          //     formData?.brand?.[index]?.commitmentItem
                          //   )
                          // }
                          value={formData.sapValue}
                          icon={
                            isSapValueGenerated ? (
                              <IoCheckmark
                                className="valid_color"
                                onClick={() => setIsSapValueGenerated(false)}
                              />
                            ) : isSapValueLoading ? (
                              <IoReloadCircleOutline className="valid_orange" />
                            ) : (
                              <IoReloadCircleOutline
                                className="valid_orange"
                                onClick={() => generateSapValue()}
                              />
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              {data?.brandOrNonBrand === "NonBrand" && (
                <div className="input_conatiner">
                  <div className="model_body">
                    <div className="model_input_field">
                      <div
                        className="d-flex ml-2 avail_addon align-items-center flex-wrap"
                        style={{ gap: "20px" }}
                      >
                        <label className="d-flex align-center justify-content-center gap-2">
                          <input
                            type="radio"
                            className="radio_exceed Manrope_Bold d-flex"
                            name="radio2"
                            checked={
                              formData.budgetExceedAvailable === "Available" ||
                              (data?.budgetDetails?.toLowerCase().trim() ===
                                "yes" &&
                                !formData.budgetExceedAvailable)
                            }
                            // {...(checkAvailable && data.stage !== "Budget_Team"
                            //   ? { checked: availableNew }
                            //   : {})}
                            disabled={
                              isView &&
                              data?.budgetDetails !== null &&
                              (data.stage !== "Po_maker" ||
                                (data.stage === "Po_maker" &&
                                  !["Requestor", "Budget_Team"].includes(
                                    poattach
                                  ) &&
                                  !["Po_checker", "Po_release"].includes(
                                    praattach
                                  ) &&
                                  (mode?.toLowerCase() !== "maker" ||
                                    (mode?.toLowerCase() === "maker" &&
                                      poattach === "Po_release"))))
                            }
                            onClick={() => {
                              setFormData((prevFormData) => {
                                let isRelatedValue = prevFormData.isRelated;

                                if (
                                  data?.brandOrNonBrand === "NonBrand" &&
                                  data?.vendorCode !== "3704453"
                                ) {
                                  isRelatedValue = "NO";
                                  setIsBusinessApproverDisabled(false);
                                } else if (
                                  data?.brandOrNonBrand === "NonBrand" &&
                                  data?.vendorCode === "3704453"
                                ) {
                                  isRelatedValue = "YES";
                                  setIsBusinessApproverDisabled(true);
                                }

                                return {
                                  ...prevFormData,
                                  budgetExceedAvailable: "Available",
                                  budgetFile: null,
                                  isRelated: isRelatedValue,
                                };
                              });

                              setErrors({});
                            }}
                          />
                          Budget Available
                        </label>
                        <label className="d-flex align-center justify-content-center gap-2">
                          <input
                            type="radio"
                            value="Not Available"
                            className="radio_exceed Manrope_Bold d-flex"
                            name="radio2"
                            checked={
                              formData.budgetExceedAvailable ===
                              "Not Available" ||
                              (data?.budgetDetails?.toLowerCase().trim() ===
                                "no" &&
                                !formData.budgetExceedAvailable)
                            }
                            // {...(checkAvailable && data.stage !== "Budget_Team"
                            //   ? { checked: notAvailableNew }
                            //   : {})}
                            disabled={
                              isView &&
                              data?.budgetDetails !== null &&
                              (data.stage !== "Po_maker" ||
                                (data.stage === "Po_maker" &&
                                  !["Requestor", "Budget_Team"].includes(
                                    poattach
                                  ) &&
                                  !["Po_checker", "Po_release"].includes(
                                    praattach
                                  ) &&
                                  (mode?.toLowerCase() !== "maker" ||
                                    (mode?.toLowerCase() === "maker" &&
                                      poattach === "Po_release"))))
                            }
                            onClick={() => {
                              setFormData((prevFormData) => ({
                                ...prevFormData,
                                budgetExceedAvailable: "Not Available",
                                poNumber: "",
                                isRelated: "",
                                poApprover: "",
                              }));
                              setIsBusinessApproverDisabled(false);
                              setErrors({});
                            }}
                          />
                          Budget Not Available
                        </label>
                        {isBudgetNotAvailable && (
                          <>
                            <label className="file_input_class he-30 d-inline-block me-2">
                              Choose Excel
                              <input
                                type="file"
                                accept=".xls, .xlsx"
                                name="budgetFile"
                                // disabled={isView && !isEdit}
                                disabled={
                                  isView &&
                                  data?.budgetDetails !== null &&
                                  (data.stage !== "Po_maker" ||
                                    (data.stage === "Po_maker" &&
                                      !["Requestor", "Budget_Team"].includes(
                                        poattach
                                      ) &&
                                      !["Po_checker", "Po_release"].includes(
                                        praattach
                                      ) &&
                                      (mode?.toLowerCase() !== "maker" ||
                                        (mode?.toLowerCase() === "maker" &&
                                          poattach === "Po_release"))))
                                }
                                onChange={(event) => {
                                  const files = Array.from(event.target.files);
                                  setFormData((prevState) => {
                                    const existingFiles =
                                      prevState.budgetFile?.length > 0
                                        ? prevState.budgetFile
                                        : data.budgetFile || [];
                                    const updatedFiles = [
                                      ...existingFiles,
                                      ...files,
                                    ];
                                    return {
                                      ...prevState,
                                      budgetFile: updatedFiles,
                                    };
                                  });
                                  setErrors((prev) => ({
                                    ...prev,
                                    budgetFile: "",
                                  }));
                                  event.target.value = "";
                                }}
                                className="d-none"
                              />
                            </label>
                            <div
                              className="file-list he-40 ms-0 scroll_visible d-inline-block align-middle"
                              style={{
                                width: "180px",
                                maxHeight: "85px",
                                overflowY: "auto",
                              }}
                            >
                              {(formData.budgetFile?.length > 0
                                ? formData.budgetFile
                                : data.budgetFile || []
                              )?.map((file, index) => {
                                const fileName =
                                  typeof file === "string"
                                    ? file
                                    : file?.name || "Unnamed File";
                                const displayName =
                                  fileName.length > 12
                                    ? `${fileName.substring(0, 15)}...`
                                    : fileName;
                                const isFromDataFile = data.budgetFile?.some(
                                  (f) =>
                                    typeof f === "string"
                                      ? f === fileName
                                      : f?.name === fileName
                                );

                                return (
                                  <div key={index} className="file-item">
                                    <Tooltip title={fileName}>
                                      <span
                                        className="file-name"
                                        style={{
                                          cursor: "pointer",
                                          color: "blue",
                                        }}
                                        onClick={() => handleFilePreview(file)}
                                      >
                                        <FileExcelOutlined
                                          style={{
                                            color: "green",
                                            marginRight: "5px",
                                          }}
                                        />
                                        {displayName}
                                      </span>
                                    </Tooltip>
                                    {/* {(isEdit || !isView) && ( */}
                                    {isView &&
                                      data?.budgetDetails !== null &&
                                      (data.stage !== "Po_maker" ||
                                        (data.stage === "Po_maker" &&
                                          !["Requestor", "Budget_Team"].includes(
                                            poattach
                                          ) &&
                                          !["Po_checker", "Po_release"].includes(
                                            praattach
                                          ) &&
                                          (mode?.toLowerCase() !== "maker" ||
                                            (mode?.toLowerCase() === "maker" &&
                                              poattach === "Po_release")))) ? (
                                      ""
                                    ) : (
                                      <CloseCircleOutlined
                                        onClick={() => {
                                          setFormData((prevState) => {
                                            const currentFiles =
                                              prevState.budgetFile?.length > 0
                                                ? [...prevState.budgetFile]
                                                : data.budgetFile
                                                  ? [...data.budgetFile]
                                                  : [];
                                            const deletedFile =
                                              currentFiles[index];
                                            const deletedFileName =
                                              typeof deletedFile === "string"
                                                ? deletedFile
                                                : deletedFile?.name;
                                            currentFiles.splice(index, 1);
                                            return {
                                              ...prevState,
                                              budgetFile:
                                                currentFiles.length > 0
                                                  ? currentFiles
                                                  : null,
                                              deletedBudgetFiles: [
                                                ...(prevState.deletedBudgetFiles ||
                                                  []),
                                                deletedFileName,
                                              ],
                                            };
                                          });
                                        }}
                                        className="circle_outline"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                              {!(
                                formData.budgetFile?.length > 0 ||
                                data.budgetFile?.length > 0
                              ) && (
                                  <span className="file-chosen">
                                    No file chosen
                                  </span>
                                )}
                            </div>
                          </>
                        )}
                      </div>
                      {error.budgetExceedAvailable && (
                        <span
                          className="error_msg_color"
                          style={{ marginLeft: "10px" }}
                        >
                          {error.budgetExceedAvailable}
                        </span>
                      )}
                    </div>
                    {error.budgetFile && (
                      <span
                        className="error_msg_color"
                        style={{ marginLeft: "8px" }}
                      >
                        {error.budgetFile}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {((data?.brandOrNonBrand === "Brand" ||
                (data?.brandOrNonBrand === "NonBrand" && isBudgetAvailable)) &&
                (role !== "Budget_Team" || (role === "Budget_Team" && data.poNumber && data.isRelated !== undefined))) && (
                  <div className="input_conatiner">
                    <div className="model_body">
                      <div className="model_input_field">
                        <label className="model_label" style={{ padding: "0" }}>
                          Update PO Number{" "}
                          {["maker"].includes(mode?.toLowerCase()) && (
                            <span className="required-field">*</span>
                          )}
                        </label>

                        {(Array.isArray(formData.poNumber) &&
                          formData.poNumber.length > 0
                          ? formData.poNumber
                          : Array.isArray(data.poNumber) && data.poNumber.length > 0
                            ? data.poNumber
                            : [""]
                        ).map((po, index) => (
                          <div
                            key={index}
                            className="d-flex align-items-center gap-2 mb-2"
                          >
                            <div className="d-flex flex-column" style={{ flex: 1 }}>
                              <CustomInput
                                name={`poNumber-${index}`}
                                placeholder={`Enter PO Number ${index + 1}`}
                                control={control}
                                label={null}
                                type="number"
                                // required={
                                //   mode?.toLowerCase() === "retrieve"
                                //     ? false
                                //     : !((formData.poNumber && formData.poNumber.length > 0) ||
                                //         (data.poNumber && data.poNumber.length > 0))
                                // }
                                value={
                                  isView &&
                                    (data.stage !== "Po_maker" ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_release") ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_checker" &&
                                        praattach !== "Po_release") ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_maker" &&
                                        praattach !== "Po_checker" &&
                                        data.poNumber !== "null" &&
                                        data.poNumber !== null) ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "PO_Screening" &&
                                        data.poNumber !== "null" &&
                                        data.poNumber !== null))
                                    ? data.poNumber?.[index] ?? "" // pick index-wise if array
                                    : praattach === "Po_release" ||
                                      praattach === "Po_checker"
                                      ? formData.poNumber?.[index] ??
                                      data.poNumber?.[index] ??
                                      ""
                                      : formData.poNumber?.[index] ?? ""
                                }
                                onChange={(e) => {
                                  const newPoNumbers = [
                                    ...(formData.poNumber &&
                                      formData.poNumber.length > 0
                                      ? formData.poNumber
                                      : data.poNumber && data.poNumber.length > 0
                                        ? data.poNumber
                                        : [""]),
                                  ];
                                  newPoNumbers[index] = e.target.value;
                                  setFormData({
                                    ...formData,
                                    poNumber: newPoNumbers,
                                  });

                                  // clear only this index's error
                                  setErrors((prev = {}) => {
                                    const next = { ...prev };
                                    if (!next.poNumber) next.poNumber = [];
                                    next.poNumber = [...next.poNumber];
                                    next.poNumber[index] = "";
                                    return next;
                                  });
                                }}
                                readonly={
                                  isView &&
                                  data.poNumber !== "null" &&
                                  data.poNumber !== null &&
                                  (data.stage !== "Po_maker" ||
                                    (data.stage === "Po_maker" &&
                                      poattach === "Po_release") ||
                                    (data.stage === "Po_maker" &&
                                      poattach === "Po_checker" &&
                                      praattach !== "Po_release") ||
                                    (data.stage === "Po_maker" &&
                                      poattach === "Po_maker" &&
                                      praattach !== "Po_checker" &&
                                      praattach !== "Po_release" &&
                                      praattach !== "Budget_Team" &&
                                      data.poNumber) ||
                                    (data.stage === "Po_maker" &&
                                      poattach === "PO_Screening" &&
                                      data.poNumber))
                                }
                              />
                              {error?.poNumber && error.poNumber[index] && (
                                <span
                                  className="error_msg_color"
                                  style={{ marginTop: 4, marginLeft: 16 }}
                                >
                                  {error.poNumber[index]}
                                </span>
                              )}
                            </div>
                            {!(
                              isView &&
                              data.poNumber !== "null" &&
                              data.poNumber !== null &&
                              (data.stage !== "Po_maker" ||
                                (data.stage === "Po_maker" &&
                                  poattach === "Po_release") ||
                                (data.stage === "Po_maker" &&
                                  poattach === "Po_checker" &&
                                  praattach !== "Po_release") ||
                                (data.stage === "Po_maker" &&
                                  poattach === "Po_maker" &&
                                  praattach !== "Po_checker" &&
                                  praattach !== "Po_release" &&
                                  praattach !== "Budget_Team" &&
                                  data.poNumber) ||
                                (data.stage === "Po_maker" &&
                                  poattach === "PO_Screening" &&
                                  data.poNumber))
                            ) &&
                              formData.poNumber &&
                              formData.poNumber.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => {
                                    const newPoNumbers = [...formData.poNumber];
                                    newPoNumbers.splice(index, 1);
                                    setFormData({
                                      ...formData,
                                      poNumber: newPoNumbers,
                                    });
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                          </div>
                        ))}

                        {/* Add new field button (hide when readonly) */}
                        {!(
                          isView &&
                          data.poNumber !== "null" &&
                          data.poNumber !== null &&
                          (data.stage !== "Po_maker" ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_release") ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_checker" &&
                              praattach !== "Po_release") ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_maker" &&
                              praattach !== "Po_checker" &&
                              praattach !== "Po_release" &&
                              praattach !== "Budget_Team" &&
                              data.poNumber) ||
                            (data.stage === "Po_maker" &&
                              poattach === "PO_Screening" &&
                              data.poNumber))
                        ) && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm mt-2"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  poNumber: [...(formData.poNumber || []), ""],
                                });
                              }}
                            >
                              + Add PO Number
                            </button>
                          )}
                      </div>
                      {isRelatedDisable && (
                        <div className="model_input_field">
                          <label className="model_label">
                            Related to HEPL<span className="required-field">*</span>
                          </label>
                          <div>
                            <div className="radio_group2 d-flex gap-2 p-2">
                              <label>
                                <input
                                  type="radio"
                                  checked={isBrand || formData.isRelated === "YES"}
                                  disabled={isBrand || (isRelatedCheck === "YES" &&
                                    (data.stage !== "Po_maker" ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_release") ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_checker") ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_maker" && praattach !== "Po_checker") ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "PO_Screening"))
                                    ? { checked: yesCheck }
                                    : {})}
                                  className="radio_exceed Manrope_Bold"
                                  disabled={isBrand ||
                                    isMarketingSpecialVendor ||
                                    (isView &&
                                      isRelatedCheck &&
                                      (data.stage !== "Po_maker" ||
                                        (data.stage === "Po_maker" &&
                                          poattach === "Po_release") ||
                                        (data.stage === "Po_maker" &&
                                          poattach === "Po_checker") ||
                                        (data.stage === "Po_maker" &&
                                          poattach === "Po_maker" && praattach !== "Po_checker") ||
                                        (data.stage === "Po_maker" &&
                                          poattach === "PO_Screening"))) ||
                                    localStorage
                                      .getItem("selectedTicketTab")
                                      ?.toLowerCase()
                                      .trim() === "non brand"
                                  }
                                  onClick={(e) => {
                                    setIsBusinessApproverDisabled(true);
                                    setFormData({
                                      ...formData,
                                      isRelated: "YES",
                                    });
                                    setErrors({
                                      ...error,
                                      isRelated: "",
                                    });
                                  }}
                                />
                                YES
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  checked={formData.isRelated === "NO"}
                                  disabled={isBrand || (isRelatedCheck === "NO" &&
                                    (data.stage !== "Po_maker" ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_release") ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_checker") ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "Po_maker" && praattach !== "Po_checker") ||
                                      (data.stage === "Po_maker" &&
                                        poattach === "PO_Screening"))
                                    ? { checked: noCheck }
                                    : {})}
                                  className="radio_exceed Manrope_Bold"
                                  disabled={isBrand ||
                                    isMarketingSpecialVendor ||
                                    (isView &&
                                      isRelatedCheck &&
                                      (data.stage !== "Po_maker" ||
                                        (data.stage === "Po_maker" &&
                                          poattach === "Po_release") ||
                                        (data.stage === "Po_maker" &&
                                          poattach === "Po_checker") ||
                                        (data.stage === "Po_maker" &&
                                          poattach === "Po_maker" && praattach !== "Po_checker") ||
                                        (data.stage === "Po_maker" &&
                                          poattach === "PO_Screening"))) ||
                                    localStorage
                                      .getItem("selectedTicketTab")
                                      ?.toLowerCase()
                                      .trim() === "non brand"
                                  }
                                  onClick={(e) => {
                                    setIsBusinessApproverDisabled(false);
                                    setFormData({
                                      ...formData,
                                      isRelated: "NO",
                                      poApprover: "",
                                    });
                                    setErrors({
                                      ...error,
                                      isRelated: "",
                                    });
                                  }}
                                />
                                NO
                              </label>
                            </div>
                          </div>
                          {error.isRelated && (
                            <span className="required-field">
                              {error.isRelated}
                            </span>
                          )}
                        </div>
                      )}
                      {/* {!isRelatedDisable ? (
                <div className="model_input_field">
                  <CustomSelect
                    name="Business Approver"
                    placeholder="Choose PO Approver"
                    label="PO Approver"
                    options={options}
                    control={control}
                    required={
                      !(formData.poApprover || data.poApprover) ? true : false
                    }
                    disabled={
                      (data.poApprover && data.stage !== "Po_maker") ||
                      (data.stage === "Po_maker" &&
                        poattach === "Po_release") ||
                      (data.stage === "Po_maker" &&
                        poattach === "Po_checker" &&
                        praattach === "Po_release") ||
                      (data.stage === "Po_maker" &&
                        poattach === "PO_Screening" &&
                        data.poApprover)
                    }
                    value={
                      (isView && data.stage !== "Po_maker") ||
                      (data.stage === "Po_maker" &&
                        poattach === "Po_release") ||
                      (data.stage === "Po_maker" &&
                        poattach === "Po_checker" &&
                        praattach === "Po_release") ||
                      (data.stage === "Po_maker" && poattach === "PO_Screening")
                        ? data.poApprover
                        : formData.poApprover
                    }
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        poApprover: e,
                      });
                      setErrors({
                        ...error,
                        poApprover: "",
                      });
                    }}
                  />
                  {error.poApprover && (
                    <span className="error_msg_color">{error.poApprover}</span>
                  )}
                </div>
              ) : ( */}
                  { isBusinessApproverDisabled  && (
                    <>
                      <div className="model_input_field">
                        <CustomSelect
                          name="Business Approver"
                          placeholder="Choose PO Approver"
                          label="PO Approver"
                          options={options}
                          control={control}
                          required={
                            !(formData.poApprover || data.poApprover)
                              ? true
                              : false
                          }
                          disabled={
                            isBrand ||
                            (data.poApprover && data.stage !== "Po_maker") ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_release") ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_checker" &&
                              praattach === "Po_release") ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_maker" &&
                              praattach !== "Po_checker" &&
                              data.poApprover) ||
                            (data.stage === "Po_maker" &&
                              poattach === "PO_Screening" &&
                              data.poApprover)
                          }
                          value={
                            (isView && data.stage !== "Po_maker") ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_release") ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_checker" &&
                              praattach === "Po_release") ||
                            (data.stage === "Po_maker" &&
                              poattach === "Po_maker" &&
                              praattach !== "Po_checker") ||
                            (data.stage === "Po_maker" &&
                              poattach === "PO_Screening")
                              ? data.poApprover
                              : formData.poApprover || data.poApprover
                          }
                          onChange={(e) => {
                            const selectedApprover = options.find(opt => opt.value === e);
                            setFormData({
                              ...formData,
                              poApprover: e,
                              poApproverName: selectedApprover?.label || "",
                            });
                            setErrors({
                              ...error,
                              poApprover: "",
                            });
                          }}
                        />
                        {error.poApprover && (
                          <span className="error_msg_color">
                            {error.poApprover}
                          </span>
                        )}
                      </div>
                      {isApprove && isPoRole && !isBrand && (
                        <div className="model_input_field">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label className="model_label" style={{ marginBottom: 0 }}>PO Approver File{!(
    (Array.isArray(formData.poApproverFile) && formData.poApproverFile.length > 0) ||
    ((data.poApproverFile?.length > 0) && !(formData.deletedPoApproverFiles?.length >= data.poApproverFile?.length))
  ) && <span className="required-field">*</span>}</label>
                            { !(isView &&
                                  data?.budgetDetails !== null &&
                                  (data.stage !== "Po_maker" ||
                                    (data.stage === "Po_maker" &&
                                      !["Requestor", "Budget_Team"].includes(
                                        poattach
                                      ) &&
                                      !["Po_checker", "Po_release"].includes(
                                        praattach
                                      ) &&
                                      (mode?.toLowerCase() !== "maker" ||
                                        (mode?.toLowerCase() === "maker" &&
                                          poattach === "Po_release"))))) && (<Button
                              size="small"
                              type="primary"
                              icon={<DownloadOutlined />}
                              disabled={!formData.poNumber?.some(p => p && String(p).trim())}
                              loading={isPoFileFetching}
                              onClick={async () => {
                                try {
                                  setIsPoFileFetching(true);
                                  const poNums = (formData.poNumber || data.poNumber || [])
                                    .filter(p => p && String(p).trim())
                                    .map(p => `poNums=${encodeURIComponent(String(p).trim())}`)
                                    .join('&');
                                  const response = await axios.get(`${BaseUrl}api/sap/getPoFile/${data?.id}?${poNums}`, {
                                    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                                    responseType: 'blob',
                                  });
                                  const contentDisposition = response.headers['content-disposition'];
                                  const fileNameMatch = contentDisposition?.match(/filename[^;=\n]*=(['"]?)([^'"\n]*)\1/);
                                  const fileName = fileNameMatch?.[2] || 'po_file.xlsx';
                                  const file = new File([response.data], fileName, { type: response.data.type });
                                  setFormData(prev => {
                                    // Collect all currently visible server-side files (strings)
                                    // that need to be flagged for deletion on the backend.
                                    const prevFiles = Array.isArray(prev.poApproverFile)
                                      ? prev.poApproverFile
                                      : Array.isArray(data.poApproverFile)
                                      ? data.poApproverFile
                                      : [];
                                    const serverFilesToDelete = prevFiles.filter(f => typeof f === 'string');
                                    const alreadyDeleted = prev.deletedPoApproverFiles || [];
                                    const mergedDeleted = [
                                      ...alreadyDeleted,
                                      ...serverFilesToDelete.filter(f => !alreadyDeleted.includes(f)),
                                    ];
                                    return {
                                      ...prev,
                                      poApproverFile: [file],
                                      deletedPoApproverFiles: mergedDeleted,
                                    };
                                  });
                                  setErrors(prev => { const e = { ...prev }; delete e.poApproverFile; return e; });
                                  toast.success('File fetched and set as PO Approver File');
                                } catch (err) {
                                  toast.error('Failed to fetch PO file');
                                } finally {
                                  setIsPoFileFetching(false);
                                }
                              }}
                              style={{ borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                            >
                              Get File
                            </Button>)}
                          </div>
                          <div className="d-flex gap-3">
                            <label className="file_input_class he-50" style={{ cursor: 'pointer' }}>
                              Choose File
                              <input
                                type="file"
                                accept=".pdf, .xls, .xlsx"
                                name="poApproverFile"
                                multiple
                                disabled={
                                  isView &&
                                  data?.budgetDetails !== null &&
                                  (data.stage !== "Po_maker" ||
                                    (data.stage === "Po_maker" &&
                                      !["Requestor", "Budget_Team"].includes(
                                        poattach
                                      ) &&
                                      !["Po_checker", "Po_release"].includes(
                                        praattach
                                      ) &&
                                      (mode?.toLowerCase() !== "maker" ||
                                        (mode?.toLowerCase() === "maker" &&
                                          poattach === "Po_release"))))
                                }
                                onChange={(event) => {
                                  const selectedFiles = Array.from(event.target.files);
                                  setFormData((prevState) => {
                                    const deletedFiles = prevState.deletedPoApproverFiles || [];
                                    const existingFiles = Array.isArray(prevState.poApproverFile) ? prevState.poApproverFile : [];
                                    const hasServerFiles = existingFiles.some(f => typeof f === 'string');
                                    const serverFiles = !hasServerFiles && Array.isArray(data.poApproverFile)
                                      ? data.poApproverFile.filter(f => !deletedFiles.includes(f))
                                      : [];
                                    const updatedFiles = [
                                      ...existingFiles,
                                      ...serverFiles,
                                      ...selectedFiles,
                                    ];
                                    return {
                                      ...prevState,
                                      poApproverFile: updatedFiles,
                                    };
                                  });
                                  setErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors.poApproverFile;
                                    return newErrors;
                                  });
                                  event.target.value = "";
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <div className="file-list w-2 he-50 scroll_visible">
                              {((() => {
                                const deletedFiles = formData.deletedPoApproverFiles || [];
                                const files = Array.isArray(formData.poApproverFile)
                                  ? formData.poApproverFile
                                  : Array.isArray(data.poApproverFile)
                                  ? data.poApproverFile.filter(f => !deletedFiles.includes(f))
                                  : [];
                                return files.length > 0;
                              })()) ? (
                                (Array.isArray(formData.poApproverFile) && formData.poApproverFile.length > 0
                                  ? formData.poApproverFile
                                  : (data.poApproverFile || []).filter(f => !(formData.deletedPoApproverFiles || []).includes(f))
                                )?.map((file, index) => {
                                  const fileName = typeof file === 'string' ? file : file?.name || 'Unnamed File';
                                  const isFromDataFile = data.poApproverFile?.some(
                                    (f) => typeof f === 'string' ? f === fileName : f?.name === fileName
                                  );
                                  
                                  return (
                                    <div className="file-item" key={index} style={{ borderBottom: index < (formData.poApproverFile || data.poApproverFile).length - 1 ? '1px solid #ddd' : 'none', paddingBottom: '8px', marginBottom: '8px' }}>
                                      <Tooltip title={fileName}>
                                        <span
                                          className="file-name"
                                          style={{ cursor: 'pointer', color: 'blue' }}
                                          onClick={() => {
                                            if (isFromDataFile) {
                                              Attachment(fileName, 'view');
                                            } else {
                                              const fileExt = fileName.toLowerCase().split('.').pop();
                                              if (fileExt === 'pdf') {
                                                if (previewFile) URL.revokeObjectURL(previewFile);
                                                const newUrl = URL.createObjectURL(file);
                                                setPreviewFile(newUrl);
                                                setPreviewModalOpen(true);
                                              } else if (fileExt === 'xls' || fileExt === 'xlsx') {
                                                parseExcelFile(file);
                                              }
                                            }
                                          }}
                                        >
                                          {fileName}
                                        </span>
                                      </Tooltip>
                                      {!(
                                        isView &&
                                        data?.budgetDetails !== null &&
                                        (data.stage !== "Po_maker" ||
                                          (data.stage === "Po_maker" &&
                                            !["Requestor", "Budget_Team"].includes(
                                              poattach
                                            ) &&
                                            !["Po_checker", "Po_release"].includes(
                                              praattach
                                            ) &&
                                            (mode?.toLowerCase() !== "maker" ||
                                              (mode?.toLowerCase() === "maker" &&
                                                poattach === "Po_release"))))
                                      ) && (
                                        <CloseCircleOutlined
                                          onClick={() => {
                                            const fileToRemove = file;
                                            const isExistingFile = typeof fileToRemove === 'string';
                                            
                                            setFormData((prevState) => {
                                              const files = Array.isArray(prevState.poApproverFile)
                                                ? [...prevState.poApproverFile]
                                                : Array.isArray(data.poApproverFile)
                                                ? [...data.poApproverFile]
                                                : [];
                                              
                                              files.splice(index, 1);
                                              
                                              const deletedFiles = isExistingFile
                                                ? [...(prevState.deletedPoApproverFiles || []), fileToRemove]
                                                : prevState.deletedPoApproverFiles || [];
                                              
                                              return {
                                                ...prevState,
                                                poApproverFile: files.length > 0 ? files : [],
                                                deletedPoApproverFiles: deletedFiles,
                                              };
                                            });
                                          }}
                                          className="circle_outline"
                                        />
                                      )}                                
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="file-chosen">No file chosen</span>
                              )}
                            </div>
                          </div>
                          {error.poApproverFile && (
                                <span className="error_msg_color">{error.poApproverFile}</span>
                              )}
                        </div>
                      )}
                    </>
                  )}
                    </div>
                  </div>
                )}
            </>
          )}

        {/*attachment*/}
        {((data.stage === "Po_maker" &&
          poattach === "Po_release" &&
          role === "Po_maker") ||
          (data.stage === "Po_maker" &&
            poattach === "PO_Screening" &&
            data.poCopyAttachment &&
            role === "Po_maker") ||
          (data.stage === "Completed" && poattach === "Po_release") ||
          (data.stage === "Po_maker" &&
            poattach === "Po_checker" &&
            praattach !== "Po_release" &&
            role === "Po_maker") ||
          (data.stage === "Completed" && poattach === "Po_checker") ||
          data.stage === "Completed") && (
            <div className="input_conatiner pl-3">
              <div className="model_input_field">
                <label className="model_label">
                  PO Attachment
                  {!(isView
                    ? (Array.isArray(formData.poattachment) &&
                      formData.poattachment.length > 0) ||
                    (Array.isArray(data.poCopyAttachment) &&
                      data.poCopyAttachment.length > 0)
                    : Array.isArray(data.poCopyAttachment) &&
                    data.poCopyAttachment.length > 0) && (
                      <span className="required-field">*</span>
                    )}
                </label>
                <div className="d-flex gap-3">
                  <label className="file_input_class he-50">
                    Choose File
                    <input
                      type="file"
                      accept=".pdf, .xls, .xlsx"
                      name="poattachment"
                      multiple
                      disabled={
                        isView &&
                        Array.isArray(data.poCopyAttachment) &&
                        data.poCopyAttachment.length > 0
                      }
                      onChange={(event) => {
                        handleMultiPoFileSelectChange(event.target.files);
                        event.target.value = "";
                      }}
                      className="d-none"
                    />
                  </label>
                  <div className="file-list w-2 he-50 scroll_visible">
                    {(
                      isView
                        ? (Array.isArray(formData.poattachment) &&
                          formData.poattachment.length > 0) ||
                        (Array.isArray(data.poCopyAttachment) &&
                          data.poCopyAttachment.length > 0)
                        : Array.isArray(data.poCopyAttachment) &&
                        data.poCopyAttachment.length > 0
                    ) ? (
                      (isView
                        ? formData.poattachment || data.poCopyAttachment
                        : data.poCopyAttachment
                      )?.map((file, index) => {
                        const fileName =
                          typeof file === "string"
                            ? file
                            : file?.name || "Unnamed File";
                        const displayName =
                          fileName.length > 20
                            ? `${fileName.substring(0, 20)}...`
                            : fileName;

                        const isFromDataAttachment = data.poCopyAttachment?.some(
                          (f) =>
                            typeof f === "string"
                              ? f === file
                              : f?.name ===
                              (typeof file === "string" ? file : file?.name)
                        );

                        return (
                          <div key={index} className="file-item">
                            <Tooltip title={fileName}>
                              {isFromDataAttachment ? (
                                <span
                                  className="file-name"
                                  style={{
                                    cursor: "pointer",
                                    color: "blue",
                                  }}
                                  onClick={() => Attachment(fileName)}
                                >
                                  {fileName.endsWith(".pdf") ? (
                                    <FilePdfOutlined
                                      style={{ color: "red", marginRight: "5px" }}
                                    />
                                  ) : fileName.endsWith(".xls") ||
                                    fileName.endsWith(".xlsx") ? (
                                    <FileExcelOutlined
                                      style={{
                                        color: "green",
                                        marginRight: "5px",
                                      }}
                                    />
                                  ) : (
                                    <FileOutlined
                                      style={{
                                        color: "gray",
                                        marginRight: "5px",
                                      }}
                                    />
                                  )}
                                  {displayName}
                                </span>
                              ) : (
                                <>
                                  {fileName.endsWith(".pdf") ? (
                                    <FilePdfOutlined
                                      style={{ color: "red", marginRight: "5px" }}
                                    />
                                  ) : fileName.endsWith(".xls") ||
                                    fileName.endsWith(".xlsx") ? (
                                    <FileExcelOutlined
                                      style={{
                                        color: "green",
                                        marginRight: "5px",
                                      }}
                                    />
                                  ) : (
                                    <FileOutlined
                                      style={{
                                        color: "gray",
                                        marginRight: "5px",
                                      }}
                                    />
                                  )}
                                  {displayName}
                                </>
                              )}
                            </Tooltip>
                            {mode === "maker" && (
                              <CloseCircleOutlined
                                onClick={() => handleRemovePoFile(index)}
                                className="circle_outline"
                              />
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="file-chosen">No file chosen</span>
                    )}
                  </div>
                </div>
                {error.poattachment && (
                  <span className="error_msg_color">{error.poattachment}</span>
                )}
              </div>
            </div>
          )}

        {/* footer start */}
        <div
          className="model_footer"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          {!selfApproval &&
            formData.approvalType !== "Pre-Approved" &&
            !data?.approvalType && (
              <div className="model_input_field">
                <CustomSelect
                  className="bussiness_addon"
                  name="businessApprover"
                  placeholder="Choose Business Approver"
                  label="Business Approver"
                  required={!isView || isEdit}
                  options={
                    isSpecialVendor
                      ? (Array.isArray(carbonCopyUsers)
                        ? carbonCopyUsers
                        : []
                      ).map((user) => ({
                        value: user.id,
                        label: user.username,
                      }))
                      : (Array.isArray(approvers) ? approvers : []).map(
                        (approver) => ({
                          value: approver.id,
                          label: approver.userName,
                        })
                      )
                  }
                  value={
                    // isView
                    isEdit
                      ? formData?.businessApprover || data?.businessApprover
                      : isView
                        ? data?.businessApprover
                        : formData?.businessApprover
                  }
                  control={control}
                  onChange={(value) =>
                    handleMultiSelectChange(value, "businessApprover")
                  }
                  disabled={isView && !isEdit}
                />
                {error.businessApprover && (
                  <span className="error_msg_color">
                    {error.businessApprover}
                  </span>
                )}
              </div>
            )}
          <div className="model_input_field">
            <CustomMultiSelect
              className="bussiness_addon"
              name="carbonCopy"
              placeholder="Choose Carbon Copy"
              label="Carbon Copy"
              options={(Array.isArray(carbonCopyUsers)
                ? carbonCopyUsers
                : []
              ).map((user) => ({
                value: user.id,
                label: user.username,
              }))}
              value={
                isEdit
                  ? formData?.carbonCopy ||
                  (Array.isArray(data?.copyMailIds)
                    ? data.copyMailIds.map((user) => user.id)
                    : [])
                  : isView
                    ? Array.isArray(data?.copyMailIds)
                      ? data.copyMailIds.map((user) => user.id)
                      : []
                    : formData?.carbonCopy
              }
              control={control}
              onChange={(value) => handleMultiSelectChange(value, "carbonCopy")}
              disabled={isView && !isEdit}
            />
            {error.carbonCopy && (
              <span className="error_msg_color">{error.carbonCopy}</span>
            )}
          </div>
          {role === "PO_Screening" && canShowResubmit && (
            <div className="model_input_field">
              <CustomSelect
                className="bussiness_addon"
                name="reSubmitUser"
                placeholder="Choose Approved to"
                label="Approved to"
                required={canShowResubmit}
                options={(Array.isArray(userData) ? userData : []).map(
                  (user) => ({
                    value: user.id,
                    label: user.username,
                  })
                )}
                control={control}
                onChange={(value) =>
                  handleMultiSelectChange(value, "reSubmitUser")
                }
              />
              {error.reSubmitUser && (
                <span className="error_msg_color">{error.reSubmitUser}</span>
              )}
            </div>
          )}
          {role === "Po_maker" && canShowReject && (
            <div className="model_input_field">
              <CustomSelect
                className="bussiness_addon"
                name="rejectUser"
                placeholder="Choose Rejected to"
                label="Rejected to"
                required={canShowReject}
                options={(Array.isArray(rejectedUser) ? rejectedUser : []).map(
                  (user) => ({
                    value: user.id,
                    label: user.username,
                  })
                )}
                control={control}
                onChange={(value) =>
                  handleMultiSelectChange(value, "rejectUser")
                }
              />
              {error.rejectUser && (
                <span className="error_msg_color">{error.rejectUser}</span>
              )}
            </div>
          )}
          {role === "Po_maker" &&
            canShowPoReSubmit &&
            isBusinessApproverDisabled &&
            data?.brandOrNonBrand === "Brand" && (
              <div className="model_input_field">
                <CustomSelect
                  className="bussiness_addon"
                  name="poReSubmitUser"
                  placeholder="Choose Approved to"
                  label="Approved to"
                  required={canShowPoReSubmit}
                  options={(Array.isArray(filteredApprovedUsers)
                    ? filteredApprovedUsers
                    : []
                  ).map((user) => ({
                    value: user.id,
                    label: user.username,
                  }))}
                  control={control}
                  onChange={(value) =>
                    handleMultiSelectChange(value, "poReSubmitUser")
                  }
                />
                {error.poReSubmitUser && (
                  <span className="error_msg_color">
                    {error.poReSubmitUser}
                  </span>
                )}
              </div>
            )}
        </div>
        {/* footer end */}
      </Modal>

      <Modal
        open={remarkModal}
        onCancel={handleRCancel}
        backdrop="static"
        className="modal_outremark"
      >
        <div className="mt-2">Do you want to Reject this?</div>
        <div
          closeButton
          className="modal-close-outremark modal-close-out d-block"
        ></div>
        <div>
          <Form.Group controlId="formRemarks">
            <label className="mt-3">
              Remarks<span className="required-class">*</span>
            </label>
            <Form.Group controlId="formRemarks">
              <Form.Control
                as="textarea"
                placeholder="Enter remarks"
                value={formData.remarks || ""}
                onChange={(e) => {
                  const { value } = e.target;

                  setFormData((prev) => ({
                    ...prev,
                    remarks: value,
                  }));

                  setErrors({});
                }}
                className={`mt-1 remarks ${error.remarks ? "is-invalid" : ""}`}
              />
              {error.remarks && (
                <span className="error_msg_color">{error.remarks}</span>
              )}
            </Form.Group>

            {/* Display error message */}
          </Form.Group>
        </div>
        <div className="btn_container">
          <Button onClick={handleRCancel} className="cancel_btn mx-2">
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleRemarksSubmit}
            className="submit_btn ml-2"
          >
            Reject
          </Button>
        </div>
      </Modal>
      {/* </Modal> */}
      <Modal
        open={showConfirm}
        backdrop="static"
        className="modal_outremark confirmation-modal"
        onCancel={handleCCancel}
        centered
      >
        <div className="confirmation-content">
          <div className="confirmation-icon">
            {formData?.isRelated === "NO" ? (
              <ExclamationCircleOutlined
                className="animated-warning"
                style={{ fontSize: "48px", color: "#faad14" }}
              />
            ) : (
              <CheckCircleOutlined
                style={{ fontSize: "48px", color: "#52c41a" }}
              />
            )}
          </div>
          <div className="confirmation-title">
            {formData?.isRelated === "NO"
              ? "Confirm Action"
              : "Confirm Approval"}
          </div>
          <div className="confirmation-message">
            {formData?.isRelated === "NO"
              ? "You have selected NO, which means this record will not be editable. Do you want to proceed?"
              : "Do you want to approve this request?"}
          </div>
        </div>
        <div className="confirmation-actions">
          <Button onClick={handleCCancel} className="cancel-btn" size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setApproveModal(true);
              setShowConfirm(false);
            }}
            className="proceed-btn"
            size="large"
          >
            Proceed
          </Button>
        </div>
      </Modal>
      <Modal
        open={approveModal}
        backdrop="static"
        className="modal_outremark"
        onCancel={() => {
          handleACancel();
        }}
      >
        <div className="mt-2">Do you want to Approve this?</div>

        <div>
          <Form.Group controlId="formRemarks">
            <label className="mt-3">Remarks </label>
            <Form.Control
              as="textarea"
              placeholder="Enter remarks"
              value={formData.remarks || ""}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              className="mt-1"
            />
            {/* Display error message */}
          </Form.Group>
        </div>

        <div className="btn_container">
          <Button onClick={handleACancel} className="cancel_btn mx-2">
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleApprove}
            className="approve_btn ml-2"
          >
            Approve
          </Button>
        </div>
      </Modal>
      <Modal
        open={holdModal}
        backdrop="static"
        className="modal_outremark"
        onCancel={() => {
          handleHCancel();
        }}
      >
        <div className="mt-2">Do you want to Hold this?</div>

        <div>
          <Form.Group controlId="formRemarks">
            <label className="mt-3">Remarks </label>
            <Form.Control
              as="textarea"
              placeholder="Enter remarks"
              value={formData.remarks || ""}
              onChange={(e) => {
                setFormData({ ...formData, remarks: e.target.value });
                setErrors({});
              }}
              className="mt-1"
            />
            {error.remarks && (
              <span className="error_msg_color">{error.remarks}</span>
            )}
          </Form.Group>
        </div>

        <div className="btn_container">
          <Button onClick={handleHCancel} className="cancel_btn mx-2">
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleHold}
            className="approve_btn ml-2"
          >
            Hold
          </Button>
        </div>
      </Modal>

      <Modal
        open={previewModalOpen}
        onCancel={() => {
          setPreviewModalOpen(false);
          setPreviewLoading(false);
          if (previewFile) {
            URL.revokeObjectURL(previewFile);
            setPreviewFile(null);
          }
        }}
        width="80%"
        footer={null}
        title="File Preview"
      >
        {previewLoading
          ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #EB043C', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <span style={{ color: '#666' }}>Loading preview...</span>
              </div>
            </div>
          : previewIsImage
            ? <img src={previewFile} alt="Preview" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            : <iframe src={previewFile} style={{ width: '100%', height: '70vh', border: 'none' }} title="File Preview" />
        }
      </Modal>

      <Modal
        open={excelModalOpen}
        onCancel={() => {
          setExcelData(null);
          setExcelModalOpen(false);
          setCurrentFileName(null);
        }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Excel File Preview</span>
            <div className="download-section" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={() => {
                if (currentFileName) {
                  Attachment(currentFileName, "download");
                }
              }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Download</span>
              <DownloadOutlined
                style={{ fontSize: '20px', }}

              />
            </div>
          </div>
        }
        width="90%"
        footer={null}
      >
        {excelData && excelData.length > 0 && (
          <div style={{ maxHeight: "70vh", overflow: "auto" }}>
            <Table
              dataSource={excelData.slice(1).map((row, index) => ({
                key: index,
                ...row.reduce((acc, cell, cellIndex) => {
                  acc[`col${cellIndex}`] = cell;
                  return acc;
                }, {}),
              }))}
              columns={excelData[0]?.map((header, index) => ({
                title: header || `Column ${index + 1}`,
                dataIndex: `col${index}`,
                key: `col${index}`,
                width: 150,
              }))}
              pagination={{ pageSize: 50 }}
              scroll={{ x: "max-content" }}
              bordered
              size="small"
            />
          </div>
        )}
      </Modal>
      <Modal
        open={!!notifModal}
        onCancel={() => setNotifModal("")}
        footer={null}
        closable={false}
        centered
        width={420}
        className="vendor-alert-modal"
      >
        <div className="vendor-alert-banner">
          <div className="vendor-alert-icon-ring">
            <ExclamationCircleOutlined className="vendor-alert-icon" />
          </div>
        </div>
        <div className="vendor-alert-body">
          <h3 className="vendor-alert-title">Action Required</h3>
          {(() => {
            const urlMatch = notifModal.match(/(https?:\/\/\S+)/);
            if (urlMatch) {
              const textPart = notifModal.replace(urlMatch[0], "").replace(/-\s*$/, "").trim();
              return (
                <>
                  <p className="vendor-alert-msg">{textPart}</p>
                  <p className="vendor-alert-msg">
                    <a href={urlMatch[0]} target="_blank" rel="noopener noreferrer" className="vendor-alert-link">
                      {urlMatch[0]}
                    </a>
                  </p>
                </>
              );
            }
            return <p className="vendor-alert-msg">{notifModal}</p>;
          })()}
          <Button className="vendor-alert-btn" onClick={() => setNotifModal("")}>
            OK, Got it
          </Button>
        </div>
      </Modal>
      <Modal
        open={notInSapModal}
        onCancel={() => { setNotInSapModal(false); clearVendorFields(); }}
        footer={null}
        closable={false}
        centered
        width={420}
        className="vendor-alert-modal"
      >
        <div className="vendor-alert-banner">
          <div className="vendor-alert-icon-ring">
            <ExclamationCircleOutlined className="vendor-alert-icon" />
          </div>
        </div>
        <div className="vendor-alert-body">
          <h3 className="vendor-alert-title">Vendor Not in SAP</h3>
          <p className="vendor-alert-msg">This vendor doesn't exist in SAP.</p>
          <p className="vendor-alert-sub">
            Kindly reach out to{" "}
            <a href="mailto:vendormaster@cavinkare.com">vendormaster@cavinkare.com</a>
          </p>
          <Button className="vendor-alert-btn" onClick={() => { setNotInSapModal(false); clearVendorFields(); }}>
            OK, Got it
          </Button>
        </div>
      </Modal>
      <Modal
        open={blockedVendorModal}
        onCancel={() => { setBlockedVendorModal(false); clearVendorFields(); }}
        footer={null}
        closable={false}
        centered
        width={420}
        className="vendor-alert-modal"
      >
        <div className="vendor-alert-banner">
          <div className="vendor-alert-icon-ring">
            <ExclamationCircleOutlined className="vendor-alert-icon" />
          </div>
        </div>
        <div className="vendor-alert-body">
          <h3 className="vendor-alert-title">Vendor Blocked</h3>
          <p className="vendor-alert-msg">This vendor is currently blocked.</p>
          <p className="vendor-alert-sub">
            Kindly reach out to{" "}
            <a href="mailto:vendormaster@cavinkare.com">vendormaster@cavinkare.com</a>
          </p>
          <Button className="vendor-alert-btn" onClick={() => { setBlockedVendorModal(false); clearVendorFields(); }}>
            OK, Got it
          </Button>
        </div>
      </Modal>
    </>
  );
};
export default CustomModal;
