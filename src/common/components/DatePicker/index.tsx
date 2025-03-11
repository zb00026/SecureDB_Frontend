import { Input, InputGroup, InputRightElement, Box } from "@chakra-ui/react";
import { CalendarIcon } from "@chakra-ui/icons";
import { DatePicker as AntDatePicker } from "antd";
import styled from "@emotion/styled";
import { forwardRef, useState } from "react";
import dayjs from "dayjs";

// Styled wrapper to customize the antd datepicker
const StyledDatePickerWrapper = styled(Box)`
  .ant-picker {
    display: none;
  }

  // Use Chakra UI's theme tokens for consistent styling
  .ant-picker-dropdown {
    .ant-picker-panel-container {
      background: var(--chakra-colors-white);
      border-radius: var(--chakra-radii-md);
      box-shadow: var(--chakra-shadows-lg);
      border: 1px solid var(--chakra-colors-gray-200);
    }

    .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
      background: var(--chakra-colors-blue-500);
    }

    .ant-picker-time-panel-column > li.ant-picker-time-panel-cell-selected 
    .ant-picker-time-panel-cell-inner {
      background: var(--chakra-colors-blue-50);
    }
  }
`;

interface DatePickerProps {
  value?: string | null;
  onChange?: (date: string | null) => void;
  placeholder?: string;
  showTimeSelect?: boolean;
  dateFormat?: string;
  width?: string;
  minDate?: string;
  maxDate?: string;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(({
  value,
  onChange,
  placeholder = "Select date",
  showTimeSelect = false,
  dateFormat = "YYYY-MM-DD HH:mm",
  width = "100%",
  minDate,
  maxDate,
  ...props
}, ref) => {
  const [antPickerOpen, setAntPickerOpen] = useState(false);

  const handleInputClick = () => {
    setAntPickerOpen(true);
  };

  const handleChange = (date: dayjs.Dayjs | null) => {
    setAntPickerOpen(false);
    if (onChange) {
      onChange(date ? date.format(dateFormat) : null);
    }
  };

  return (
    <StyledDatePickerWrapper ref={ref} width={width} position="relative">
      <InputGroup onClick={handleInputClick} cursor="pointer">
        <Input
          value={value ? dayjs(value).format(dateFormat) : ""}
          placeholder={placeholder}
          readOnly
          width={width}
          {...props}
        />
        <InputRightElement pointerEvents="none">
          <CalendarIcon color="gray.500" />
        </InputRightElement>
      </InputGroup>

      <AntDatePicker
        open={antPickerOpen}
        showTime={showTimeSelect}
        format={dateFormat}
        value={value ? dayjs(value) : null}
        onChange={handleChange}
        onOpenChange={setAntPickerOpen}
        minDate={minDate ? dayjs(minDate) : undefined}
        maxDate={maxDate ? dayjs(maxDate) : undefined}
        popupClassName="ant-picker-dropdown"
        allowClear
      />
    </StyledDatePickerWrapper>
  );
});

DatePicker.displayName = 'DatePicker'; 