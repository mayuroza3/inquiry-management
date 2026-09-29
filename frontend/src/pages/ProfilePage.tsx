import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { api } from '../api/client';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';
import { FormInput } from '../components/FormInput';
import { Initials } from '../components/Initials';
import { PageHeader } from '../components/PageHeader';
import { ROLE_LABELS, formatWhen, type User } from '../types';

const schema = yup.object({
  current_password: yup.string().required('Current password is required'),
  password: yup.string().min(8, 'Use at least 8 characters').required('New password is required'),
  password_confirmation: yup.string().oneOf([yup.ref('password')], 'Passwords do not match').required('Confirm the new password'),
});

type FormValues = yup.InferType<typeof schema>;

export function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const { register, handleSubmit, reset, formState, setError: setFieldError } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    api.get<{ user: User }>('/api/me').then((response) => setProfile(response.data.user)).catch(() => setError('Could not load your profile.'));
  }, []);

  const fields = profile
    ? [
        ['Name', profile.name],
        ['Email', profile.email],
        ['Role', ROLE_LABELS[profile.role]],
        ['Manager', profile.manager?.name || '—'],
        ['Member since', formatWhen(profile.created_at)],
      ]
    : [];

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Profile" subtitle="Your account details are managed by an administrator. You can change your password." />
      {error && <Alert>{error}</Alert>}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
        <Card title="Account">
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
            <Initials name={profile?.name || 'User'} size={52} />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{profile?.name || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
            </Box>
          </Stack>
          <Stack spacing={1.5}>
            {fields.map(([label, value]) => (
              <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{value}</Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
        <Card title="Password">
          {saved && <Alert severity="success">{saved}</Alert>}
          <form
            onSubmit={handleSubmit(async (values) => {
              setSaved('');
              setError('');
              try {
                await api.patch('/api/profile/password', values);
                setSaved('Password updated.');
                reset();
              } catch (caught) {
                const message = (caught as { response?: { data?: { errors?: { current_password?: string[] }; message?: string } } }).response?.data;
                const current = message?.errors?.current_password?.[0];
                if (current) {
                  setFieldError('current_password', { message: current });
                  return;
                }
                setError(message?.message || 'Could not update the password.');
              }
            })}
          >
            <FormInput label="Current password" type="password" errorText={formState.errors.current_password?.message} {...register('current_password')} />
            <FormInput label="New password" type="password" errorText={formState.errors.password?.message} {...register('password')} />
            <FormInput label="Confirm new password" type="password" errorText={formState.errors.password_confirmation?.message} {...register('password_confirmation')} />
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={formState.isSubmitting}>
              Update password
            </Button>
          </form>
        </Card>
      </Box>
    </Stack>
  );
}
