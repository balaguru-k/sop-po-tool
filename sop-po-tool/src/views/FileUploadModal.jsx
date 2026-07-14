import React, { useEffect, useState } from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import { Upload, Button as AntButton, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { BaseUrl } from "../App";
import axios from "axios";
import CustomSelect from "./Custom/CustomSelect";
import CustomInput from "./Custom/CustomInput";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import CustomMultiSelect from "./Custom/CustomMultiSelect";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const FileUploadModal = ({
  show,
  onHide,
  onUpload,
  onUpdate,
  onHold,
  onDraft,
  initialData,
  approveReject,
  poApprover,
  activeTab,
  buttonDisable,
}) => {
  const role = localStorage.getItem("role");
  const [businessApprover, setBusinessApprover] = useState([]);
  const [mttpBusinessApprover, setMttpBusinessApprover] = useState([]);
  const [poFile, setPoFile] = useState([]);
  const [pomakerFile, setPoMakerFile] = useState([]);
  const [mailAttachment, setMailAttachment] = useState([]);
  const [otherFiles, setOtherFiles] = useState([]);
  const [poAttachment, setPoAttachment] = useState([]);
  const [removedPoFiles, setRemovedPoFiles] = useState([]);
  const [removedPoMakerFiles, setRemovedPoMakerFiles] = useState([]);
  const [removedMailFiles, setRemovedMailFiles] = useState([]);
  const [removedOtherFiles, setRemovedOtherFiles] = useState([]);
  const [removedPoAttachment, setRemovedPoAttachment] = useState([]);
  const [errors, setErrors] = useState({});
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksAction, setRemarksAction] = useState("");
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [storedInitialData, setStoredInitialData] = useState(null);
  const [showPoApprover, setShowPoApprover] = useState(false);
  const [carbonCopyValues, setCarbonCopyValues] = useState([]);
  const [poApprovers, setPoApprovers] = useState([]);
  const [formData, setFormData] = useState({});
  const [roiDescription, setRoiDescription] = useState("");

  const options = poApprovers?.map((item) => ({
    value: item.id,
    label: item.userName,
  }));
  const lastHistory =
    initialData?.historyList?.[initialData.historyList.length - 1];
  const isFinalApproved =
    lastHistory?.status === "Approved" || lastHistory?.status === "Completed";
  const isPoCheckerApproved = initialData?.historyList?.some(
    (history) => history.name === "Po_checker" && history.status === "Approved"
  );

  const isFieldLocked =
    Boolean(
      initialData?.poNumber ||
      initialData?.isRelated !== null ||
      initialData?.poApprover
    ) && isFinalApproved;

  const isRejectedByBusinessOrPoScreening =
    initialData?.status === "Reject" &&
    lastHistory?.status === "Reject" &&
    (lastHistory?.name === "Business_Approver" ||
      lastHistory?.name === "PO_Screening");

  const isPomakerTwoReject =
    initialData?.status === "Reject" && lastHistory?.name === "Po_maker";
  const isPomakerReject =
    initialData?.status === "Reject" && lastHistory?.name === "Po_maker";
  const isDraft = initialData?.status === "Draft";

  const isEditable =
    (!initialData ||
      isDraft ||
      (isRejectedByBusinessOrPoScreening && !buttonDisable)) &&
    !approveReject;

  const { control, handleSubmit, setValue, reset, getValues, watch } = useForm({
    defaultValues: {
      businessApprover: "",
      carbonCopyMailIds: [],
      documentNumber: "",
      updatePoNumber: [],
      relatedToHepl: "",
      poApprover: "",
    },
  });

  const fetchCarbonCopyUsers = async () => {
    try {
      const response = await axios.get(`${BaseUrl}api/auth/all-ba-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setBusinessApprover(response.data);
    } catch (error) {
      console.error("Error fetching carbon copy users:", error);
    }
  };
  const fetchMttpBusinessApprover = async () => {
    try {
      const response = await axios.get(`${BaseUrl}api/auth/all-mttp-ba`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setMttpBusinessApprover(response.data);
    } catch (error) {
      console.error("Error fetching carbon copy users:", error);
    }
  };
  const fetchNewPoApprovers = async () => {
    try {
      const response = await fetch(`${BaseUrl}budget/all-po-approvers`);

      const data = await response.json();
      if (response.status === 200) {
        setPoApprovers(data[0]?.users);
      } else {
        console.error(
          "Error fetching user data:",
          data.message || "Invalid response"
        );
        setPoApprovers([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setPoApprovers([]);
    }
  };

  useEffect(() => {
    fetchCarbonCopyUsers();
    fetchMttpBusinessApprover();
    fetchNewPoApprovers();
  }, []);

  useEffect(() => {
    if (
      show &&
      initialData &&
      businessApprover.length > 0 &&
      poApprovers?.length > 0
    ) {
      const poNumbers =
        Array.isArray(initialData?.poNumber) && initialData?.poNumber.length > 0
          ? initialData?.poNumber
          : [];
      setTimeout(() => {
        setValue("businessApprover", initialData.businessApproverId);
        setValue("documentNumber", initialData.docNum || "");
        setValue("updatePoNumber", poNumbers || []);
        setFormData((prev) => ({
          ...prev,
          updatePoNumber:
            Array.isArray(initialData?.poNumber) &&
              initialData?.poNumber.length > 0
              ? [...initialData?.poNumber]
              : [""],
        }));
        setValue(
          "relatedToHepl",
          initialData.isRelated
            ? "Yes"
            : initialData.isRelated === false
              ? "No"
              : ""
        );
        if (initialData.isRelated) {
          setShowPoApprover(true);
        } else {
          setShowPoApprover(false);
        }
        setValue("poApprover", initialData.poApproverId || "");
        const carbonIds =
          initialData.carbonCopyMailIds?.map((user) => user.id) || [];
        setCarbonCopyValues(carbonIds);
        setValue("carbonCopyMailIds", carbonIds);
        setRoiDescription(initialData.roiDescription || "");
      }, 100);
    }
  }, [show, initialData, setValue, businessApprover, poApprovers]);
  useEffect(() => {
    if (!show) {
      reset({
        businessApprover: "",
        carbonCopyMailIds: [],
        documentNumber: "",
        updateponumber: "",
        relatedToHepl: "",
        poApprover: "",
      });
      setPoFile([]);
      setMailAttachment([]);
      setOtherFiles([]);
      setPoAttachment([]);
      setRemovedPoFiles([]);
      setRemovedPoMakerFiles([]);
      setPoMakerFile([]);
      setRemovedMailFiles([]);
      setRemovedOtherFiles([]);
      setRemovedPoAttachment([]);
      setCarbonCopyValues([]);
      setRoiDescription("");
      setErrors({});
      setShowPoApprover(false);
    }
  }, [show, reset]);

  const handlePoFileChange = (info) => {
    // const invalidFiles = info.fileList.filter(file =>
    //   file.originFileObj && !file.name.toLowerCase().endsWith('.eml')
    // );

    // if (invalidFiles.length > 0) {
    //   setErrors((prev) => ({ ...prev, poFile: "Only .eml files are allowed" }));
    //   return;
    // }
    const invalidFiles = info.fileList.filter(
      (file) =>
        file.originFileObj &&
        !(
          file.name.toLowerCase().endsWith(".xls") ||
          file.name.toLowerCase().endsWith(".xlsx")
        )
    );

    if (invalidFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        poFile: "Only Excel files (.xls, .xlsx) are allowed",
      }));
      return;
    }
    const newFiles = info.fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj);

    const removedExisting = (initialData?.poFile || []).filter(
      (fileName) =>
        !info.fileList.some(
          (file) => file.uid === `existing-po-${fileName}`
        )
    );

    setPoFile(newFiles);
    setRemovedPoFiles(removedExisting);

    // Clear error when files are changed
    if (errors.poFile) {
      setErrors((prev) => ({ ...prev, poFile: undefined }));
    }
  };

  const handleMailFileChange = (info) => {
    const invalidFiles = info.fileList.filter(
      (file) => file.originFileObj && !file.name.toLowerCase().endsWith(".eml")
    );

    if (invalidFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        mailAttachment: "Only .eml files are allowed",
      }));
      return;
    }

    const newFiles = info.fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj);
    const removedExisting = (initialData?.mailAttachment || []).filter(
      (fileName) =>
        !info.fileList.some(
          (file) => file.uid === `existing-mail-${fileName}`
        )
    );

    setMailAttachment(newFiles);
    setRemovedMailFiles(removedExisting);

    if (errors.mailAttachment) {
      setErrors((prev) => ({ ...prev, mailAttachment: undefined }));
    }
  };

  const handleOtherFileChange = (info) => {
    const invalidFiles = info.fileList.filter(
      (file) =>
        file.originFileObj &&
        !(
          file.name.toLowerCase().endsWith(".xls") ||
          file.name.toLowerCase().endsWith(".xlsx")
        )
    );

    if (invalidFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        otherFiles: "Only Excel files (.xls, .xlsx) are allowed",
      }));
      return;
    }

    const sourceFiles =
      role === "PO_Screening"
        ? initialData?.poScreeningFile || []
        : role === "Po_maker"
          ? initialData?.poMakerFile || []
          : initialData?.otherFiles || [];

    const keptExisting = info.fileList
      .filter((file) => !file.originFileObj)
      .map((file) => file.name);

    const removedExisting = sourceFiles.filter(
      (fileName) => !keptExisting.includes(fileName)
    );

    const newFiles = info.fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj);

    setOtherFiles(newFiles);
    setRemovedOtherFiles(removedExisting);

    if (errors.otherFiles) {
      setErrors((prev) => ({ ...prev, otherFiles: undefined }));
    }
  };

  const handlePoMakerFileChange = (info) => {
    const invalidFiles = info.fileList.filter(
      (file) =>
        file.originFileObj &&
        !(
          file.name.toLowerCase().endsWith(".xls") ||
          file.name.toLowerCase().endsWith(".xlsx")
        )
    );

    if (invalidFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        poMakerFile: "Only Excel files (.xls, .xlsx) are allowed",
      }));
      return;
    }

    const newFiles = info.fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj);

    const sourceFiles = initialData?.poMakerFile || [];

    // Get existing file UIDs that are still present
    const existingFileUids = info.fileList
      .filter((file) => file.uid.startsWith("existing-pomaker-"))
      .map((file) => file.uid);

    // Find removed files by checking which original files don't have corresponding UIDs
    const removedExisting = sourceFiles.filter(
      (fileName) => !existingFileUids.includes(`existing-pomaker-${fileName}`)
    );

    setPoMakerFile(newFiles);
    setRemovedPoMakerFiles(removedExisting);
    if (errors.poMakerFile) {
      setErrors((prev) => ({ ...prev, poMakerFile: undefined }));
    }
  };

  const handlePoAttachmentChange = (info) => {
    const newFiles = info.fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj);
    const removedExisting = (initialData?.poCopy || []).filter(
      (fileName) =>
        !info.fileList.some(
          (file) =>
            file.uid ===
            `existing-poattachment-${(initialData?.poCopy || []).indexOf(
              fileName
            )}`
        )
    );

    setPoAttachment(newFiles);
    setRemovedPoAttachment(removedExisting);

    if (errors.poAttachment) {
      setErrors((prev) => ({ ...prev, poAttachment: undefined }));
    }
  };

  const validateForm = (formData, isDraft = false) => {
    const newErrors = {};

    if (!isDraft) {
      if (!formData.businessApprover) {
        newErrors.businessApprover = "Business Approver is required";
      }

      if (!roiDescription || !roiDescription.trim()) {
        newErrors.roiDescription = "ROI Description is required";
      }

      const totalPoFiles =
        (initialData?.poFile || []).filter((f) => !removedPoFiles.includes(f))
          .length + poFile.length;
      if (totalPoFiles === 0) {
        newErrors.poFile = "At least one PO file is required";
      }

      const totalMailFiles =
        (initialData?.mailAttachment || []).filter(
          (f) => !removedMailFiles.includes(f)
        ).length + mailAttachment.length;
      if (totalMailFiles === 0) {
        newErrors.mailAttachment = "At least one mail attachment is required";
      }
      // if (!formData.documentNumber || formData.documentNumber.trim() === "") {
      //   newErrors.documentNumber = "Document Number is required";
      // }
      // if (!formData.updateponumber || formData.updateponumber.trim() === "") {
      //   newErrors.updateponumber = "Update PO Number is required";
      // }
    } else {
      const hasBusinessApprover = !!formData.businessApprover;
      const hasCarbonCopy = !!(
        formData.carbonCopyMailIds && formData.carbonCopyMailIds.length > 0
      );
      const totalPoFiles =
        (initialData?.poFile || []).filter((f) => !removedPoFiles.includes(f))
          .length + poFile.length;
      const totalMailFiles =
        (initialData?.mailAttachment || []).filter(
          (f) => !removedMailFiles.includes(f)
        ).length + mailAttachment.length;

      if (
        !hasBusinessApprover &&
        !hasCarbonCopy &&
        totalPoFiles === 0 &&
        totalMailFiles === 0
      ) {
        toast.error("At least one field must be filled to save as draft");
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (formData) => {
    if (!validateForm(formData)) return;

    const submitData = {
      businessApprover: formData.businessApprover,
      poFile,
      mailAttachment,
      removedPoFiles,
      removedMailFiles,
      carbonCopyMailIds: formData.carbonCopyMailIds,
      roiDescription,
    };

    if (initialData && onUpdate) {
      onUpdate(submitData);
    } else {
      onUpload(submitData);
    }
  };

  const handleDraftSubmit = (formData) => {
    if (!validateForm(formData, true)) return;

    const submitData = {
      businessApprover: formData.businessApprover,
      poFile,
      mailAttachment,
      removedPoFiles,
      removedMailFiles,
      carbonCopyMailIds: formData.carbonCopyMailIds,
      roiDescription,
    };

    if (onDraft) {
      onDraft(submitData);
    }
  };

  const handleApproveReject = (action) => {
    if (
      role === "Po_maker" &&
      isFieldLocked &&
      action?.toLowerCase() === "approve"
    ) {
      const totalPoAttachments =
        (initialData?.poCopy || []).filter(
          (fileName) => !removedPoAttachment.includes(fileName)
        ).length + poAttachment.length;

      if (totalPoAttachments === 0) {
        setErrors((prev) => ({
          ...prev,
          poAttachment: "PO Attachment is required",
        }));
        return;
      }
    }

    setRemarksAction(action);
    const currentFormValues = getValues();


    // Only validate PO numbers for Po_maker role
    if (role === "Po_maker" && action?.toLowerCase() === "approve") {
      const errors = validatePoNumbers();
      if (errors.poNumber.length > 0) {
        setErrors(errors);
        return;
      }
    }

    if (
      !currentFormValues.relatedToHepl &&
      role === "Po_maker" &&
      action?.toLowerCase() === "approve" &&
      !initialData?.isRelated
    ) {
      setErrors((prev) => ({
        ...prev,
        relatedToHepl: "Related to HEPL is required",
      }));
    } else if (!currentFormValues.poApprover && !initialData?.poApprover
      && currentFormValues.relatedToHepl?.toLowerCase() === "yes"
      && action?.toLowerCase() === "approve" && role === "Po_maker"
    ) {
      setErrors((prev) => ({
        ...prev,
        poApprover: "PO Approver is required",
      }))
    }
    // Store both initial data and current file states
    // Role-specific file validation before approving
    if (action?.toLowerCase() === "approve") {
      // For PO Screening role
      if (
        role === "PO_Screening" &&
        otherFiles.length === 0 &&
        !(initialData?.poScreeningFile?.length > 0)
      ) {
        setErrors((prev) => ({
          ...prev,
          otherFiles:
            "At least one PO Screening file is required before approval",
        }));
        return;
      }

      // For PO Maker role
      if (role === "Po_maker") {
        // setErrors((prev) => ({
        //   ...prev,
        //   pomakerFile: "At least one PO Maker file is required before approval",
        // }));
        // return;
        const totalPoMakerFiles =
          (initialData?.poMakerFile || []).filter(
            (fileName) => !removedPoMakerFiles.includes(fileName)
          ).length + pomakerFile.length;

        if (totalPoMakerFiles === 0) {
          setErrors((prev) => ({
            ...prev,
            poMakerFile: "PO Maker File is required",
          }));
          return;
        }
      }
    }

    if (
      !currentFormValues.documentNumber.trim() &&
      (role === "Budget_Team" || initialData?.docNum !== null) &&
      action?.toLowerCase() === "approve"
    ) {
      setErrors((prev) => ({
        ...prev,
        documentNumber: "Document Number is required",
      }));
      return;
    }
    setStoredInitialData({
      ...initialData,
      currentOtherFiles: role === "Po_maker" ? pomakerFile : otherFiles,
      currentPoAttachment: poAttachment,
      documentNumber: currentFormValues.documentNumber,
      updateponumber: currentFormValues.updatePoNumber,
      relatedToHepl: currentFormValues.relatedToHepl,
      poApprover: currentFormValues.poApprover,
      isFieldLocked: isFieldLocked,
      deletedFile:
        role === "Po_maker" ? removedPoMakerFiles : removedOtherFiles,
    });
    onHide();
    setTimeout(() => {
      setShowRemarksModal(true);
    }, 150);
  };

  const handleRemarksSubmit = () => {
    if (
      (remarksAction === "Reject" || remarksAction?.toLowerCase() === "hold") &&
      !remarks.trim()
    ) {
      setRemarksError("Remarks are required");
      return;
    }

    if (remarksAction === "Hold" && onHold && storedInitialData) {
      const formData = {
        id: storedInitialData.id,
        approveStatus: "Hold",
        remarks: remarks.trim(),
      };
      onHold(formData);
    } else if (onUpdate && storedInitialData) {
      const updateData = {
        id: storedInitialData.id,
        approveStatus: remarksAction === "Approve" ? "Approved" : "Reject",
        remarks: remarks.trim(),
        files: storedInitialData.currentOtherFiles || [],
        docNum: storedInitialData.documentNumber || storedInitialData.docNum,
        updateponumber: storedInitialData.updateponumber,
        relatedToHepl: storedInitialData.relatedToHepl === "Yes",
        poApprover: storedInitialData.poApprover,
        poCopy: storedInitialData.currentPoAttachment || [],
        poBoolean: storedInitialData.isFieldLocked,
        deletedFile: storedInitialData.deletedFile || [],
      };
      onUpdate(updateData);
    }

    setShowRemarksModal(false);
    setRemarks("");
    setRemarksAction("");
    setRemarksError("");
    setStoredInitialData(null);
  };

  const handleRetrieve = () => {
    const formData = {
      id: initialData.id,
      approveStatus: "Retrieve",
    };
    onHold(formData);
    setShowRemarksModal(false);
    setRemarks("");
    setRemarksAction("");
    setRemarksError("");
    setStoredInitialData(null);
  };
  const handleRemarksClose = () => {
    setShowRemarksModal(false);
    setRemarks("");
    setRemarksAction("");
    setRemarksError("");
    setStoredInitialData(null);
  };

  const handleFileDownload = async (fileName) => {
    try {
      const response = await axios.get(
        `${BaseUrl}api/ticket/file-download/${fileName}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const validatePoNumbers = () => {
    const errors = { poNumber: [] };
    const poSource =
      formData.updatePoNumber && formData.updatePoNumber.length > 0
        ? formData.updatePoNumber
        : initialData?.poNumber && initialData?.poNumber.length > 0
          ? initialData?.poNumber
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
  const poApproverValue = watch("poApprover");


  return (
    <>
      <style>
        {`
          .file-upload-modal .modal-dialog { max-width: 580px !important; }
          .file-clickable .ant-upload-list-item-name { cursor: pointer !important; }
          .fu-section {
            background: #fff;
            border-radius: 10px;
            border: 1px solid #edf0f4;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
          .fu-section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #eb043c;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .fu-section-title::before {
            content: '';
            display: inline-block;
            width: 3px;
            height: 14px;
            background: #eb043c;
            border-radius: 2px;
          }
          .fu-upload-box {
            border: 1.5px dashed #dde1e7;
            border-radius: 8px;
            padding: 10px 12px;
            background: #fafbfc;
            transition: border-color 0.2s;
          }
          .fu-upload-box:hover { border-color: #eb043c; }
          .fu-label {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
            display: block;
          }
          .fu-label .req { color: #eb043c; margin-left: 2px; }
        `}
      </style>
      <Modal className="file-upload-modal" size="m" show={show} onHide={onHide}>
        <Modal.Header closeButton className="modal-close-out d-block">
          <Modal.Title style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
            File Upload
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "16px", background: "#f4f6f9" }}>
          <div className="po-update-form">
            <div className="fu-section">
              <div className="fu-section-title">File Attachments</div>

              <Row>
                <Col xl={6} lg={6} md={12} sm={12} className="mb-3">
                  <div className="fu-upload-box">
                    <label className="fu-label">PO File Upload <span className="req">*</span></label>
                  <Upload
                    multiple
                    beforeUpload={() => false}
                    onChange={isEditable ? handlePoFileChange : undefined}
                    disabled={!isEditable}
                    onPreview={(file) => {
                      if (!isEditable && file.name) {
                        handleFileDownload(file.name);
                      }
                    }}

                    style={{ width: "100%" }}
                    className={!isEditable ? "file-clickable" : ""}
                    accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    fileList={[
                      ...(initialData?.poFile || [])
                        .filter(
                          (fileName) => !removedPoFiles.includes(fileName)
                        )
                        .map((fileName) => ({
                          uid: `existing-po-${fileName}`,
                          name: fileName,
                          status: "done",
                        })),
                      ...poFile.map((file, index) => ({
                        uid: `po-${index}-${file.name}`,
                        name: file.name,
                        status: "done",
                        originFileObj: file,
                      })),
                    ]}
                  >
                    {isEditable && (
                      <AntButton icon={<UploadOutlined />} style={{ borderRadius: "6px", width: "100%" }}>
                        Upload Files
                      </AntButton>
                    )}
                  </Upload>
                  {errors.poFile && (
                    <span className="error_msg_color">{errors.poFile}</span>
                  )}
                  </div>
                </Col>

                {
                  <Col xl={6} lg={6} md={12} sm={12} className="mb-3">
                    <div className="fu-upload-box">
                    <label className="fu-label">Mail Attachment <span className="req">*</span></label>
                    <Upload
                      multiple
                      beforeUpload={() => false}
                      onChange={isEditable ? handleMailFileChange : undefined}
                      disabled={!isEditable}
                      style={{ width: "100%" }}
                      className={!isEditable ? "file-clickable" : ""}
                      onPreview={(file) => {
                        if (!isEditable && file.name) {
                          handleFileDownload(file.name);
                        }
                      }}
                      accept=".eml"
                      fileList={[
                        ...(initialData?.mailAttachment || [])
                          .filter(
                            (fileName) => !removedMailFiles.includes(fileName)
                          )
                          .map((fileName) => ({
                            uid: `existing-mail-${fileName}`,
                            name: fileName,
                            status: "done",
                          })),
                        ...mailAttachment.map((file, index) => ({
                          uid: `mail-${index}-${file.name}`,
                          name: file.name,
                          status: "done",
                          originFileObj: file,
                        })),
                      ]}
                    >
                      {isEditable && (
                        <AntButton icon={<UploadOutlined />} style={{ borderRadius: "6px", width: "100%" }}>
                          Upload Attachment
                        </AntButton>
                      )}
                    </Upload>
                    {errors.mailAttachment && (
                      <span className="error_msg_color">{errors.mailAttachment}</span>
                    )}
                    </div>
                  </Col>
                }
                <Col xl={12} lg={12} md={12} sm={12} className="mb-3">
                  <CustomInput
                    name="roidescription"
                    placeholder="ROI Description"
                    label="ROI Description"
                    required={true}
                    control={control}
                    value={roiDescription}
                    onChange={(e) => {
                      setRoiDescription(e.target.value);
                      if (errors.roiDescription)
                        setErrors((prev) => ({ ...prev, roiDescription: undefined }));
                    }}
                    type="alphanumeric"
                    readonly={!isEditable}
                  />
                  {errors.roiDescription && (
                    <span className="error_msg_color">{errors.roiDescription}</span>
                  )}
                </Col>
                {(initialData?.poScreeningFile || role === "PO_Screening") && (
                  <Col xl={6} lg={6} md={12} sm={12} className="mb-3">
                    <div className="fu-upload-box">
                    <label className="fu-label">Files</label>

                    <Upload
                      multiple
                      beforeUpload={() => false}
                      onChange={
                        isEditable ||
                          (role === "PO_Screening" && !buttonDisable) ||
                          !isPomakerReject
                          ? handleOtherFileChange
                          : undefined
                      }
                      disabled={
                        (!isEditable && role !== "PO_Screening") ||
                        buttonDisable ||
                        isPomakerReject
                      }
                      itemRender={(originNode, file) => (
                        <div
                          style={{
                            cursor: !isEditable ? "pointer" : "default",
                          }}
                          title={!isEditable ? "Click to download" : ""}
                          onClick={(e) => {
                            const target = e.target;
                            if (
                              target.closest(".anticon-delete") ||
                              target.closest(".ant-upload-list-item-action")
                            ) {
                              return;
                            }

                            if (!isEditable && file.name) {
                              handleFileDownload(file.name);
                            }
                          }}
                        >
                          {originNode}
                        </div>
                      )}
                      style={{ width: "100%" }}
                      fileList={[
                        ...(initialData?.poScreeningFile || [])
                          .filter(
                            (fileName) => !removedOtherFiles.includes(fileName)
                          )
                          .map((fileName) => ({
                            uid: `existing-${fileName}`,
                            name: fileName,
                            status: "done",
                          })),
                        ...otherFiles.map((file) => ({
                          uid: `new-${file.name}`,
                          name: file.name,
                          status: "done",
                          originFileObj: file,
                        })),
                      ]}
                    >
                      {(isEditable ||
                        (role === "PO_Screening" &&
                          !buttonDisable &&
                          !isPomakerReject)) && (
                          <AntButton
                            icon={<UploadOutlined />}
                            style={{ borderRadius: "6px" }}
                          >
                            Upload Files
                          </AntButton>
                        )}
                    </Upload>

                    {errors.otherFiles && !initialData.poScreeningFile && (
                      <span className="error_msg_color">{errors.otherFiles}</span>
                    )}
                    </div>
                  </Col>
                )}
              </Row>
            </div>
            {((initialData && initialData.docNum !== null) ||
              role === "Budget_Team") && (
                <div className="fu-section">
                  <div className="fu-section-title">Document Details</div>
                  <Row className="mb-2">
                    <Col
                      xl={6}
                      lg={6}
                      md={12}
                      sm={12}
                      className="form_margin validation-error"
                    >
                      <CustomInput
                        name="documentNumber"
                        label="Document Number"
                        placeholder="Enter Document Number"
                        type="number"
                        required={true}
                        control={control}
                        readonly={
                          (!isEditable && role !== "Budget_Team") || buttonDisable
                        }
                        onChange={() => {
                          if (errors.documentNumber) {
                            setErrors((prev) => ({
                              ...prev,
                              documentNumber: undefined,
                            }));
                          }
                        }}
                      />
                      {errors.documentNumber && (
                        <span className="error_msg_color">
                          {errors.documentNumber}
                        </span>
                      )}
                    </Col>
                  </Row>
                </div>
              )}
            {((initialData &&
              initialData.poNumber !== null &&
              initialData.isRelated !== null) ||
              role === "Po_maker") && (
                <div className="fu-section">
                  <div className="fu-section-title">PO Details</div>
                  <Row className="mb-2">
                    <Col
                      xl={6}
                      lg={6}
                      md={12}
                      sm={12}
                      className="form_margin validation-error"
                    >
                      {(Array.isArray(formData.updatePoNumber) &&
                        formData.updatePoNumber.length > 0
                        ? formData.updatePoNumber
                        : Array.isArray(initialData?.poNumber) &&
                          initialData?.poNumber.length > 0
                          ? initialData?.poNumber
                          : [""]
                      ).map((po, index) => (
                        <div
                          key={index}
                          className="d-flex align-items-center gap-2 mb-2"
                        >
                          <div className="d-flex flex-column" style={{ flex: 1 }}>
                            <CustomInput
                              name={`updatePoNumber.${index}`}
                              label={index === 0 ? "Update PO Number" : ""}
                              placeholder={`Enter PO Number ${index + 1}`}
                              type="number"
                              required={index === 0}
                              control={control}
                              value={formData.updatePoNumber?.[index] ?? ""}
                              readonly={
                                isFieldLocked ||
                                (!isEditable && role !== "Po_maker") ||
                                buttonDisable
                              }
                              onChange={(e) => {
                                const newUpdatePoNumbers = [
                                  ...(formData.updatePoNumber &&
                                    formData.updatePoNumber.length > 0
                                    ? formData.updatePoNumber
                                    : initialData.poNumber &&
                                      initialData.poNumber.length > 0
                                      ? initialData.poNumber
                                      : []),
                                ];
                                newUpdatePoNumbers[index] = e.target.value;
                                setFormData({
                                  ...formData,
                                  updatePoNumber: newUpdatePoNumbers,
                                });
                                setValue("updatePoNumber", newUpdatePoNumbers);
                                // Clear only this index’s error
                                if (errors.poNumber && errors.poNumber[index]) {
                                  setErrors((prev = {}) => {
                                    const next = { ...prev };
                                    if (!next.poNumber) next.poNumber = [];
                                    next.poNumber[index] = "";
                                    return next;
                                  });
                                }
                              }}
                            />
                            {errors?.poNumber && errors.poNumber[index] && (
                              <span
                                className="error_msg_color"
                                style={{ marginTop: 4, marginLeft: 16 }}
                              >
                                {errors.poNumber[index]}
                              </span>
                            )}
                          </div>

                          {/* Remove button */}
                          {activeTab === "sixth" &&
                            !isFieldLocked &&
                            formData.updatePoNumber &&
                            formData.updatePoNumber.length > 1 && (
                              <IconButton
                                size="small"
                                style={{ marginTop: "20px", color: "#eb043c" }}
                                onClick={() => {
                                  const newUpdatePoNumbers = [
                                    ...formData.updatePoNumber,
                                  ];
                                  newUpdatePoNumbers.splice(index, 1);
                                  setFormData({
                                    ...formData,
                                    updatePoNumber: newUpdatePoNumbers,
                                  });
                                  setValue("updatePoNumber", newUpdatePoNumbers);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                        </div>
                      ))}

                      {/* Add new Update PO Number field */}
                      {activeTab === "sixth" && !isFieldLocked && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm mt-2"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              updatePoNumber: [
                                ...(formData.updatePoNumber || []),
                                "",
                              ],
                            });
                          }}
                        >
                          + Add Update PO Number
                        </button>
                      )}
                    </Col>
                    <Col
                      xl={6}
                      lg={6}
                      md={12}
                      sm={12}
                      className="form_margin validation-error"
                    >
                      <Form.Label
                        className="txt_lable form-label"
                        style={{ fontWeight: 500, color: "#495057" }}
                      >
                        Related to HEPL <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="d-flex align-items-center gap-0">
                        <Form.Check
                          inline
                          type="radio"
                          name="relatedToHepl"
                          label="YES"
                          value="Yes"
                          checked={getValues("relatedToHepl") === "Yes"}
                          disabled={
                            isFieldLocked ||
                            (!isEditable && role !== "Po_maker") ||
                            buttonDisable
                          }
                          onChange={(e) => {
                            setValue("relatedToHepl", e.target.value);
                            // if (
                            //   e.target.value?.toLowerCase() === "yes" &&
                            //   !initialData.poApprover
                            // ) {
                            //   setErrors((prev) => ({
                            //     ...prev,
                            //     poApprover: "Po Approver is required",
                            //   }));
                            // }
                            setShowPoApprover(true);
                            if (errors.relatedToHepl)
                              setErrors((prev) => ({
                                ...prev,
                                relatedToHepl: undefined,
                              }));
                          }}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          name="relatedToHepl"
                          label="NO"
                          value="No"
                          checked={getValues("relatedToHepl") === "No"}
                          disabled={
                            isFieldLocked ||
                            (!isEditable && role !== "Po_maker") ||
                            buttonDisable
                          }
                          onChange={(e) => {
                            setValue("relatedToHepl", e.target.value);
                            setShowPoApprover(false);
                            if (errors.relatedToHepl)
                              setErrors((prev) => ({
                                ...prev,
                                relatedToHepl: undefined,
                              }));
                          }}
                        />
                      </div>
                      {errors.relatedToHepl && (
                        <span className="error_msg_color">
                          {errors.relatedToHepl}
                        </span>
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-2">
                    {showPoApprover && (
                      <Col
                        xl={6}
                        lg={6}
                        md={12}
                        sm={12}
                        className="form_margin validation-error"
                      >
                        <CustomSelect
                          placeholder="Choose PO Approver"
                          name="poApprover"
                          label="PO Approver"
                          style={{ width: "100%" }}
                          required={true}
                          control={control}
                          disabled={
                            isFieldLocked ||
                            (!isEditable && role !== "Po_maker") ||
                            buttonDisable
                          }
                          value={watch("poApprover")}
                          onChange={() => {
                            if (errors.poApprover) {
                              setErrors((prev) => ({
                                ...prev,
                                poApprover: undefined,
                              }));
                            }
                          }}
                          options={options}
                        />
                        {errors.poApprover && (
                          <span className="error_msg_color">
                            {errors.poApprover}
                          </span>
                        )}
                      </Col>
                    )}
                    <Col
                      xl={6}
                      lg={6}
                      md={12}
                      sm={12}
                      className="form_margin validation-error"
                    >
                      <Form.Label
                        className="txt_lable form-label"
                        style={{ fontWeight: 500, color: "#495057" }}
                      >
                        Files
                      </Form.Label>
                      <Upload
                        multiple
                        beforeUpload={() => false}
                        onChange={
                          isEditable || role === "Po_maker"
                            ? handlePoMakerFileChange
                            : undefined
                        }
                        disabled={
                          isFieldLocked ||
                          (!isEditable && role !== "Po_maker") ||
                          buttonDisable
                        }
                        style={{ width: "100%" }}
                        fileList={[
                          ...(initialData?.poMakerFile || [])
                            .filter(
                              (fileName) =>
                                !removedPoMakerFiles.includes(fileName)
                            )
                            .map((fileName) => ({
                              uid: `existing-pomaker-${fileName}`,
                              name: fileName,
                              status: "done",
                            })),
                          ...pomakerFile.map((file, index) => ({
                            uid: `other-${index}-${file.name}`,
                            name: file.name,
                            status: "done",
                            originFileObj: file,
                          })),
                        ]}
                        itemRender={(originNode, file) => (
                          <div
                            style={{
                              cursor: !isEditable ? "pointer" : "default",
                            }}
                            onClick={(e) => {
                              const target = e.target;
                              if (
                                target.closest(".anticon-delete") ||
                                target.closest(".ant-upload-list-item-action")
                              ) {
                                return;
                              }
                              if (!isEditable && file.name) {
                                handleFileDownload(file.name);
                              }
                            }}
                          >
                            {originNode}
                          </div>
                        )}
                      >
                        {(isEditable || role === "Po_maker") &&
                          activeTab === "sixth" && (
                            <AntButton
                              icon={<UploadOutlined />}
                              style={{ borderRadius: "6px" }}
                            >
                              Upload Files
                            </AntButton>
                          )}
                      </Upload>
                      {errors.poMakerFile && (
                        <span className="error_msg_color">
                          {errors.poMakerFile}
                        </span>
                      )}
                    </Col>
                  </Row>
                </div>
              )}
            {((initialData &&
              initialData.poCopy &&
              initialData.poCopy.length > 0) ||
              (role === "Po_maker" &&
                isFieldLocked &&
                isPoCheckerApproved &&
                !isPomakerTwoReject)) && (
                <div className="fu-section">
                  <div className="fu-section-title">PO Attachment</div>
                  <Row className="mb-2">
                    <Col xl={6} lg={6} md={12} sm={12} className="mb-2">
                      <div className="fu-upload-box">
                      <Upload
                        multiple
                        beforeUpload={() => false}
                        onChange={
                          isEditable || (role === "Po_maker" && !buttonDisable)
                            ? handlePoAttachmentChange
                            : undefined
                        }
                        disabled={
                          (!isEditable && role !== "Po_maker") || buttonDisable
                        }
                        style={{ width: "100%" }}
                        fileList={[
                          ...(initialData?.poCopy || [])
                            .filter(
                              (fileName) =>
                                !removedPoAttachment.includes(fileName)
                            )
                            .map((fileName, index) => ({
                              uid: `existing-po-attachment-${index}`,
                              name: fileName,
                              status: "done",
                            })),
                          ...poAttachment.map((file, index) => ({
                            uid: `po-attachment-${index}-${file.name}`,
                            name: file.name,
                            status: "done",
                            originFileObj: file,
                          })),
                        ]}
                        itemRender={(originNode, file) => (
                          <div
                            style={{
                              cursor: !isEditable ? "pointer" : "default",
                            }}
                            onClick={() => {
                              if (!isEditable && file.name) {
                                handleFileDownload(file.name);
                              }
                            }}
                          >
                            {originNode}
                          </div>
                        )}
                      >
                        {(isEditable ||
                          (role === "Po_maker" && !buttonDisable)) && (
                            <AntButton
                              icon={<UploadOutlined />}
                              style={{ borderRadius: "6px" }}
                            >
                              Upload PO Attachment
                            </AntButton>
                          )}
                      </Upload>

                      {errors.poAttachment && (
                        <span className="error_msg_color">{errors.poAttachment}</span>
                      )}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            <div className="fu-section" style={{ marginBottom: 0 }}>
              <div className="fu-section-title">Approver & CC</div>
              <Row className="mb-2">
                <Col xl={6} lg={6} md={12} sm={12} className="mb-3">
                  <CustomSelect
                    placeholder="Choose Business Approver"
                    name="businessApprover"
                    label="Business Approver"
                    style={{ width: "100%" }}
                    required={true}
                    control={control}
                    disabled={!isEditable}
                    value={watch("businessApprover")}
                    onChange={() => {
                      if (errors.businessApprover) {
                        setErrors((prev) => ({
                          ...prev,
                          businessApprover: undefined,
                        }));
                      }
                    }}
                    options={(Array.isArray(mttpBusinessApprover)
                      ? mttpBusinessApprover
                      : []
                    ).map((user) => ({
                      value: user.id,
                      label: user.username,
                    }))}
                  />
                  {errors.businessApprover && (
                    <span className="error_msg_color">{errors.businessApprover}</span>
                  )}
                </Col>
                <Col xl={6} lg={6} md={12} sm={12} className="mb-3">
                  <CustomMultiSelect
                    placeholder="Choose Carbon Copy"
                    name="carbonCopyMailIds"
                    label="Carbon Copy"
                    required={false}
                    control={control}
                    disabled={!isEditable}
                    value={carbonCopyValues}
                    onChange={(values) => {
                      setCarbonCopyValues(values);
                      setValue("carbonCopyMailIds", values);
                      if (errors.carbonCopyMailIds) {
                        setErrors((prev) => ({
                          ...prev,
                          carbonCopyMailIds: undefined,
                        }));
                      }
                    }}
                    options={(Array.isArray(businessApprover)
                      ? businessApprover
                      : []
                    ).map((user) => ({
                      value: user.id,
                      label: user.username,
                    }))}
                  />
                </Col>
              </Row>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 d-flex justify-content-end">
          {approveReject ? (
            <>
              {/* <Button className="btn_cancel mx-2 px-3" onClick={onHide}>
              Close
            </Button> */}
              {!(
                activeTab === "seventh" &&
                (role === "Po_maker" || role === "Budget_Team")
              ) ? (
                <Button
                  className="btn_cancel mx-2"
                  onClick={() => handleApproveReject("Reject")}
                >
                  Reject
                </Button>
              ) : (
                <Button className="btn_cancel mx-2 px-3" onClick={onHide}>
                  Close
                </Button>
              )}
              {(role === "Po_maker" || role === "Budget_Team") && (
                <>
                  {activeTab === "sixth" && (
                    <Button
                      key="hold"
                      className="hold_btn footer_btn"
                      onClick={() => handleApproveReject("Hold")}
                    >
                      Hold
                    </Button>
                  )}
                  {activeTab === "seventh" && (
                    <Button
                      key="hold"
                      className="btn_sub mx-2"
                      onClick={() => handleRetrieve()}
                    >
                      Retrieve
                    </Button>
                  )}{" "}
                </>
              )}
              {!(
                activeTab === "seventh" &&
                (role === "Po_maker" || role === "Budget_Team")
              ) && (
                  <Button
                    className="btn_sub mx-2"
                    onClick={() => handleApproveReject("Approve")}
                  >
                    Approve
                  </Button>
                )}
            </>
          ) : (
            <>
              <Button className="btn_cancel mx-2 px-3" onClick={onHide}>
                {isEditable ? "Cancel" : "Close"}
              </Button>
              {isEditable && !initialData && onDraft && (
                <Button
                  className="btn_sub mx-2"
                  onClick={handleSubmit(handleDraftSubmit)}
                >
                  Draft
                </Button>
              )}
              {isEditable && (
                <Button
                  className="btn_sub mx-2"
                  onClick={handleSubmit(handleFormSubmit)}
                >
                  {initialData ? "Update" : "Upload"}
                </Button>
              )}
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Remarks Modal */}
      <Modal size="m" show={showRemarksModal} onHide={handleRemarksClose}>
        <Modal.Header closeButton className="modal-close-out d-block">
          <Modal.Title style={{ fontSize: 20 }}>
            {remarksAction} Ticket
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="vendor_details_part">
            <Row>
              <Col
                xl={12}
                lg={12}
                md={12}
                sm={12}
                className="form_margin validation-error"
              >
                <Form.Label className="txt_lable form-label">
                  Remarks
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    if (remarksError) setRemarksError("");
                  }}
                  placeholder="Enter your remarks..."
                  className="form-control"
                  style={{ resize: "vertical", minHeight: "100px" }}
                />
                {remarksError && (
                  <span className="error_msg_color">{remarksError}</span>
                )}
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex justify-content-end">
          <Button className="btn_cancel mx-2 px-3" onClick={handleRemarksClose}>
            Close
          </Button>
          <Button className="btn_sub mx-2" onClick={handleRemarksSubmit}>
            {remarksAction}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FileUploadModal;
