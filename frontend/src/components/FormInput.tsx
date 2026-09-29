import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { forwardRef } from 'react';

type FormInputProps = Omit<TextFieldProps, 'inputRef'> & {
  errorText?: string;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  { errorText, ...props },
  ref,
) {
  return (
    <TextField
      fullWidth
      margin="normal"
      {...props}
      inputRef={ref}
      error={Boolean(errorText) || Boolean(props.error)}
      helperText={errorText ?? props.helperText}
    />
  );
});
