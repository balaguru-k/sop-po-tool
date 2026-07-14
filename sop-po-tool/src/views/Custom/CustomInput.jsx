import React from "react";
import { Input, Tooltip } from "antd";
import { Controller } from "react-hook-form";

const CustomInput = ({
  name,
  placeholder,
  label,
  type = "text",
  icon,
  error,
  tooltip,
  required = false,
  value,
  readonly = false,
  disabled = false,
  onChange,
  control,
  labelStyle,
  inputStyle,
}) => {
  const handleChange = (e) => {
    let newValue = e.target.value;
    if (type === "number") {
      newValue = newValue.replace(/[^0-9]/g, "");
      if (newValue === "0") {
        newValue = "";
      }
    }
    if (type === "text") {
      newValue = newValue.replace(/[^a-zA-Z ]/g, "");
      if (newValue.trim() === "") {
        newValue = "";
      }
    }
    if (type === "alphanumeric") {
      newValue = newValue; 
    }
    if (type === "email") {
      newValue = newValue.replace(/[^a-zA-Z0-9@._-]/g, "");
    }
    if (onChange) onChange({ target: { name, value: newValue } });
  };

  const getInputType = () => {
    switch (type) {
      case "alphanumeric":
      case "text":
        return "text";
      case "number":
        return "text"; 
      case "email":
        return "email";
      case "password":
        return "password";
      default:
        return "text";
    }
  };
  return (
    <div>
      <label className="model_label d-block" style={labelStyle}>
        <span className="form_block">
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
              <Input
                {...field}
                placeholder={placeholder}
                type={getInputType()}
                value={value !== undefined ? value : field.value}
                readOnly={readonly}
                disabled={disabled}
                autoComplete="off"
                // onChange={(e) => {
                //   field.onChange(e);
                //   handleChange(e);
                // }}
                 onChange={(e) => {
                  let filteredValue = e.target.value;
                  if (type === "number") {
                    filteredValue = e.target.value.replace(/[^0-9]/g, "");
                  }
                  const filteredEvent = {
                    ...e,
                    target: {
                      ...e.target,
                      value: filteredValue
                    }
                  };
                  field.onChange(filteredEvent);
                  if (onChange) handleChange(filteredEvent);
                }}
 
                onWheel={(e) => e.target.blur()}
                onKeyDown={(e) => {
                  if (
                    type === "number" &&
                    ["e", "E", "+", "-"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                suffix={icon && <div className="pos_padding">{icon}</div>}
                className="input_custom"
                style={inputStyle}
              />
            )}
          />
        </div>
      </Tooltip>
      {/* Error message handling */}
      {error && <span className="error_msg_color">{error.message}</span>}
    </div>
  );
};

export default CustomInput;
