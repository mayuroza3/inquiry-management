import MenuItem from '@mui/material/MenuItem';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

type SelectProps = Omit<TextFieldProps, 'select' | 'inputRef'> & {
  options: SelectOption[];
  errorText?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export const Select = forwardRef<HTMLInputElement, SelectProps>(function Select(
  { options, errorText, allowEmpty, emptyLabel = 'None', ...props },
  ref,
) {
  return (
    <TextField
      select
      fullWidth
      margin="normal"
      {...props}
      inputRef={ref}
      error={Boolean(errorText) || Boolean(props.error)}
      helperText={errorText ?? props.helperText}
    >
      {allowEmpty && <MenuItem value="">{emptyLabel}</MenuItem>}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
});
