import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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
import { KeyOutlined as KeyIcon } from '@mui/icons-material';
import { resetPassword } from '../api/auth';
import { FormInput } from '../components/FormInput';

const schema = yup.object({
  email: yup.string().required('Email is required').email('Enter a valid email address'),
  token: yup.string().required('Token is required'),
  password: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .matches(/[a-z]/, 'Must contain at least 1 lowercase letter')
    .matches(/[0-9]/, 'Must contain at least 1 number')
    .matches(/[^A-Za-z0-9]/, 'Must contain at least 1 special character'),
  password_confirmation: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

type FormData = yup.InferType<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token') || '';
  const urlEmail = searchParams.get('email') || '';

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: urlEmail,
      token: urlToken,
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const result = await resetPassword(data);
      navigate('/login', {
        replace: true,
        state: { successMessage: result.message },
      });
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to reset password. Link may have expired.');
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
              <KeyIcon fontSize="medium" />
            </Box>
            <Typography component="h1" variant="h5" fontWeight={700}>
              Set New Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter your email and new password below
            </Typography>
          </Box>

          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {serverError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <FormInput
                label="Email Address"
                type="email"
                errorText={errors.email?.message}
                {...register('email')}
              />

              <input type="hidden" {...register('token')} />

              <FormInput
                label="New Password"
                type="password"
                placeholder="At least 8 chars, 1 uppercase, 1 number, 1 symbol"
                errorText={errors.password?.message}
                {...register('password')}
                autoFocus
              />

              <FormInput
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                errorText={errors.password_confirmation?.message}
                {...register('password_confirmation')}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ py: 1.2, fontWeight: 600, mt: 1 }}
              >
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
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
