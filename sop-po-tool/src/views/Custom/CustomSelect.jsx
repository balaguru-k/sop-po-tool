import React from "react";
import { Select, Tooltip, Spin } from "antd";
import { Controller } from "react-hook-form";

const CustomSelect = ({
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
  labelStyle, // Add labelStyle prop
}) => {
  return (
    <div className="">
      <label className="model_label d-block" style={labelStyle}>
        {" "}
        {/* Apply labelStyle */}
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
                className="model_input_select select_custom"
                placeholder={placeholder}
                {...field}
                value={value !== undefined && value !== null && value !== "" ? value : field.value || undefined}
                showSearch
                optionFilterProp="children" // search against label text
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
                readOnly={readonly}
                disabled={disabled}
                onChange={(e) => {
                  field.onChange(e);
                  if (onChange) onChange(e);
                }}
                notFoundContent={loading ? <Spin size="small" /> : null}
                dropdownMatchSelectWidth={false}
                popupMatchSelectWidth={false}
              >
                {options?.map((option) => (
                  <Select.Option value={option.value} key={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        </div>
      </Tooltip>
      {error && <span className="error_msg_color">{error.message}</span>}
    </div>
  );
};

export default CustomSelect;