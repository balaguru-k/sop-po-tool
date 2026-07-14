export const validationRules = {
  vendorName: "Vendor Name is required.",
  vendorLocation: "Vendor Location is required.",
  vendorMailId: "Vendor Mail ID is required.",
  vendorCode: "Vendor Code is required.",
  gstNo: "GST Number is required.",
  businessApprover: "Business Approver is required.",
  payment: "Payment Terms is required.",
  gstType: "GST Type is required.",
  poType: "PO Type is required.",
};
// Validate form fields dynamically
export const validateForm = (formData) => {
  const errors = {};

  Object.keys(validationRules).forEach((field) => {
    if (!formData[field] || formData[field].trim() === "") {
      errors[field] = validationRules[field];
    }
  });

  return errors;
};
// Handle dynamic error clearing
export const clearFieldError = (field, formData, formErrors) => {
  if (formData[field]?.trim()) {
    const updatedErrors = { ...formErrors };
    delete updatedErrors[field];
    return updatedErrors;
  }
  return formErrors;
};
export const applySearch = (data, query) => {
  if (!Array.isArray(data)) return [];

  const q = query.toLowerCase();

  return data.filter((item) => {
    const reqNo = item.reqNo?.toLowerCase().includes(q);
    const createdDate = item.createdDate?.toLowerCase().includes(q);
    const username = item.username?.toLowerCase().includes(q);
    const vendorName = item.vendorName?.toLowerCase().includes(q);
    const vendorCode = item.vendorCode?.toLowerCase().includes(q);
    const totalBaseValue = (item.totalBaseValue + "").toLowerCase().includes(q);
    const status = item.status?.toLowerCase().includes(q);
    const stage = item.stage?.toLowerCase().includes(q);
    const poNumberMatch = Array.isArray(item.poNumber)
      ? item.poNumber.some((p) => (p + "").toLowerCase().includes(q))
      : (item.poNumber + "").toLowerCase().includes(q);

    // 🔥 Unified brand + description search
    const brandMatch = item.brand?.some((b) => {
      const brand = (b.detailsBrand || "").toLowerCase();
      const desc = (b.poDescription || "").toLowerCase();
      const combo = `${brand} ${desc}`;
      return brand.includes(q) || desc.includes(q) || combo.includes(q);
    });

    return (
      reqNo ||
      createdDate ||
      username ||
      vendorName ||
      vendorCode ||
      totalBaseValue ||
      status ||
      stage ||
      poNumberMatch ||
      brandMatch
    );
  });
};
