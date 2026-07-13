import React from "react";
import { Select, Tooltip, Spin } from "antd";
import { Controller } from "react-hook-form";

const CustomMultiSelect = ({
  name,
  placeholder,
  label,
  options,
  tooltip,
  required = false,
  value,
  readonly = false,
  disabled = false,
  onChange,
  style,
  control,
  error,
  loading = false,
  showSelectAll = false,
}) => {
  // Create options with "Select All" option if enabled (only when not loading)
  const selectAllOption = { value: "SELECT_ALL", label: "All Districts" };
  const allOptions = loading
    ? []
    : showSelectAll
    ? [selectAllOption, ...options]
    : options;

  // Get all option values (excluding SELECT_ALL)
  const allOptionValues = options?.map((option) => option.value) || [];

  const handleSelectChange = (selectedValues, field) => {
    let newValues = [...selectedValues];

    if (selectedValues.includes("SELECT_ALL")) {
      // If "Select All" is selected
      if (value && value.length === allOptionValues.length) {
        // If all options were already selected, deselect all
        newValues = [];
      } else {
        // Select all options (excluding SELECT_ALL from the actual values)
        newValues = [...allOptionValues];
      }
    } else {
      // Normal selection handling - remove SELECT_ALL if it exists
      newValues = selectedValues.filter((val) => val !== "SELECT_ALL");
    }

    field.onChange(newValues);
    if (onChange) onChange(newValues);
  };

  // Determine display value - always show actual selected values, not SELECT_ALL
  const getDisplayValue = () => {
    if (!value || value.length === 0) return undefined;
    return value;
  };

  return (
    <div className="">
      <label className="model_label d-block">
        <span className="span_addon">
          {label}
          {required && <span className="required-field">*</span>}
        </span>
      </label>
      <Tooltip title={tooltip}>
        <div className="pos_relative">
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Select
                className="model_input_select select_custom multi-select-custom"
                {...field}
                mode="multiple"
                placeholder={loading ? "Loading districts..." : placeholder}
                value={getDisplayValue()}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
                readOnly={readonly}
                disabled={disabled}
                onChange={(selectedValues) =>
                  handleSelectChange(selectedValues, field)
                }
                notFoundContent={loading ? <Spin size="small" /> : null}
                maxTagCount={Infinity} // Show all selected tags
                maxTagTextLength={15}
                allowClear
                dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
                style={style}
              >
                {allOptions?.map((option) => (
                  <Select.Option value={option.value} key={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        </div>
      </Tooltip>
      {/* Error message handling */}
      {error && <span className="error_msg_color">{error.message}</span>}
    </div>
  );
};

export default CustomMultiSelect;
