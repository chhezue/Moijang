import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";

interface Option {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  options: Option[];
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  onChange,
  options,
}) => {
  return (
    <FormControl size="small" fullWidth sx={{ minWidth: 50 }}>
      <InputLabel
        sx={{
          fontSize: "14px",
          color: "text.secondary",
          "&.Mui-focused": { color: "primary.main" },
        }}
      >
        {label}
      </InputLabel>
      <Select
        value={value}
        label={label}
        onChange={onChange}
        sx={{
          fontSize: "14px",
          borderRadius: "20px",
          "& .MuiSelect-select": {
            fontSize: "14px",
            fontWeight: 500,
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "divider",
            borderRadius: "20px",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.main",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.main",
            borderWidth: "2px",
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{ fontSize: "14px" }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default FilterDropdown;
