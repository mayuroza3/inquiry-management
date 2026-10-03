import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import * as yup from 'yup';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';
import { FormInput } from '../components/FormInput';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type FormValues = yup.InferType<typeof schema>;

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const stateMessage = (location.state as any)?.successMessage || (location.state as any)?.infoMessage;

  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: yupResolver(schema) });

  if (!loading && user) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff8f8', display: 'grid', placeItems: 'center', p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 980,
          minHeight: 560,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
          bgcolor: '#fff',
          borderRadius: { xs: 3, md: '28px' },
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(16, 24, 40, 0.08)',
        }}
      >
        <Stack
          sx={{
            background: '#f1414f',
            color: '#fff',
            p: { xs: 4, md: 6 },
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: 13 }}>INQUIRY PORTAL</Typography>
          <Box>
            <Typography variant="h3" sx={{ color: '#fff', maxWidth: 380 }}>
              Follow every inquiry through to a decision.
            </Typography>
            <Typography sx={{ mt: 2, maxWidth: 380, color: 'rgba(255,255,255,0.82)' }}>
              Capture public leads, assign them through the team, and watch open, pending, and closed work move.
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Staff workspace</Typography>
        </Stack>
        <Stack sx={{ p: { xs: 3, md: 6 }, justifyContent: 'center' }}>
          <Box component="img" src="/logo.svg" alt="Inquiry Portal" sx={{ height: 44, width: 'auto', mb: 3 }} />
          <Typography variant="h4">Sign in</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Use your portal account to review inquiries.</Typography>
          
          {stateMessage && (
            <Alert sx={{ mb: 2 }}>
              {stateMessage}
            </Alert>
          )}

          <Card>
            {error && <Alert>{error}</Alert>}
            <form
              onSubmit={handleSubmit(async (values) => {
                setError('');
                try {
                  await login(values.email, values.password);
                } catch {
                  setError('Invalid email or password.');
                }
              })}
            >
              <FormInput label="Email" type="email" errorText={formState.errors.email?.message} {...register('email')} />
              <FormInput label="Password" type="password" errorText={formState.errors.password?.message} {...register('password')} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
                <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
                  Forgot password?
                </Link>
              </Box>

              <Button type="submit" variant="contained" fullWidth disabled={formState.isSubmitting}>
                Sign in
              </Button>
            </form>
          </Card>

          <Stack spacing={1} sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" fontWeight={600} underline="hover">
                Create an account
              </Link>
            </Typography>
            <Link component={RouterLink} to="/inquire" sx={{ fontWeight: 600 }}>
              Submit an inquiry without an account
            </Link>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
