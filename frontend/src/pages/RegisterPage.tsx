import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { PersonAddOutlined as PersonAddIcon } from '@mui/icons-material';
import { register as registerUser } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { FormInput } from '../components/FormInput';

const schema = yup.object({
  name: yup.string().required('Full name is required').max(100, 'Name cannot exceed 100 characters'),
  email: yup.string().required('Email is required').email('Enter a valid email address'),
  role: yup.string().required('Role is required').oneOf(['sales', 'sales_manager'], 'Select a valid role'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .matches(/[a-z]/, 'Must contain at least 1 lowercase letter')
    .matches(/[0-9]/, 'Must contain at least 1 number')
    .matches(/[^A-Za-z0-9]/, 'Must contain at least 1 special character'),
  password_confirmation: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

type FormData = yup.InferType<typeof schema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      role: 'sales',
      password: '',
      password_confirmation: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    setServerError(null);
    try {
      const result = await registerUser(data);
      setUser(result.user);
      navigate('/admin/dashboard', {
        replace: true,
        state: {
          infoMessage:
            'Account created successfully! Your account is pending administrator approval before you can access inquiries.',
        },
      });
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const firstMsg = Object.values(err.response.data.errors).flat()[0];
        if (typeof firstMsg === 'string') {
          setServerError(firstMsg);
          return;
        }
      }
      const msg = err.response?.data?.message || 'Failed to create account. Please check your details.';
      setServerError(msg);
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
              <PersonAddIcon fontSize="medium" />
            </Box>
            <Typography component="h1" variant="h5" fontWeight={700}>
              Create an Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Join the Inquiry Management Portal
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
                label="Full Name"
                placeholder="John Doe"
                errorText={errors.name?.message}
                {...register('name')}
                autoFocus
              />

              <FormInput
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                errorText={errors.email?.message}
                {...register('email')}
              />

              <FormControl fullWidth margin="normal" error={!!errors.role}>
                <InputLabel id="role-select-label">Account Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  label="Account Role"
                  value={selectedRole || 'sales'}
                  onChange={(e) => setValue('role', e.target.value as any, { shouldValidate: true })}
                >
                  <MenuItem value="sales">Sales Representative</MenuItem>
                  <MenuItem value="sales_manager">Sales Manager</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
              </FormControl>

              <FormInput
                label="Password"
                type="password"
                placeholder="At least 8 chars, 1 uppercase, 1 number, 1 symbol"
                errorText={errors.password?.message}
                {...register('password')}
              />

              <FormInput
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
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
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2" fontWeight={600} underline="hover">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
