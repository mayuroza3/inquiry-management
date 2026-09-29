import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Link,
  Stack,
} from '@mui/material';
import { LockResetOutlined as LockResetIcon } from '@mui/icons-material';
import { forgotPassword } from '../api/auth';
import { FormInput } from '../components/FormInput';

const schema = yup.object({
  email: yup.string().required('Email is required').email('Enter a valid email address'),
});

type FormData = yup.InferType<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setResetUrl(null);
    try {
      const result = await forgotPassword(data.email);
      setSuccessMessage(result.message);
      if (result.reset_url) {
        setResetUrl(result.reset_url);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to request password reset.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#fff8f8',
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#fff1f2',
                color: '#f1414f',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <LockResetIcon fontSize="medium" />
            </Box>
            <Typography component="h1" variant="h5" fontWeight={700}>
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter your email address to receive a password reset link
            </Typography>
          </Box>

          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {serverError}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
              {resetUrl && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed rgba(0, 0, 0, 0.15)' }}>
                  <Typography variant="caption" display="block" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                    Local Reset Link (Email Unconfigured / Dev Mode):
                  </Typography>
                  <Link
                    href={resetUrl}
                    variant="caption"
                    underline="always"
                    sx={{ wordBreak: 'break-all', fontWeight: 700, color: '#f1414f' }}
                  >
                    Click here to reset password directly
                  </Link>
                </Box>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <FormInput
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                errorText={errors.email?.message}
                {...register('email')}
                autoFocus
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ py: 1.2, fontWeight: 600, mt: 1 }}
              >
                {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Remembered your password?{' '}
              <Link component={RouterLink} to="/login" variant="body2" fontWeight={600} underline="hover">
                Back to Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
