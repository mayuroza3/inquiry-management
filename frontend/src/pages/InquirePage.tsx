import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import * as yup from 'yup';
import { api } from '../api/client';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';
import { FormInput } from '../components/FormInput';
import { Select } from '../components/Select';
import type { LeadSource } from '../types';

const ATTACHMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif', 'tif', 'tiff'];
const ATTACHMENT_HINT = 'PDF, Word, Excel, or an image. Up to 10 MB.';

function attachmentError(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ATTACHMENT_EXTENSIONS.includes(extension)) {
    return 'Attach a PDF, Word document, Excel file, or image.';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'The attachment must be 10 MB or smaller.';
  }
  return '';
}

const schema = yup.object({
  contact_name: yup
    .string()
    .trim()
    .required('Name is required.')
    .max(255, 'Name must be 255 characters or fewer.')
    .matches(/^[\p{L}][\p{L}\p{M} .'-]*$/u, 'Name can use letters, spaces, apostrophes, hyphens, and periods only.'),
  email: yup
    .string()
    .trim()
    .required('Email is required.')
    .max(255)
    .email('Enter a valid email.')
    .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, 'Enter a valid email.'),
  phone: yup
    .string()
    .trim()
    .max(50, 'Phone must be 50 characters or fewer.')
    .test('phone', 'Enter a valid phone number.', (value) => {
      if (!value) return true;
      if (!/^[0-9+\-().\s]+$/.test(value)) return false;
      const digits = value.replace(/\D/g, '').length;
      return digits >= 7 && digits <= 15;
    })
    .default(''),
  company: yup
    .string()
    .trim()
    .max(255, 'Company must be 255 characters or fewer.')
    .matches(/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .,&'()-]*$/u, {
      message: 'Company can use letters, numbers, and basic punctuation only.',
      excludeEmptyString: true,
    })
    .default(''),
  message: yup
    .string()
    .trim()
    .required('Message is required.')
    .max(5000, 'Message must be 5000 characters or fewer.')
    .matches(new RegExp("^[\\p{L}\\p{M}\\p{N}\\s.,;:!?'\"()&+@#%/-]*$", 'u'), 'Remove unsupported characters from the message.'),
  lead_source_id: yup.string().default(''),
});

type FormValues = yup.InferType<typeof schema>;

export function InquirePage() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState, reset, setError: setFieldError } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: { phone: '', company: '', lead_source_id: '' },
  });

  useEffect(() => {
    api.get<{ data: LeadSource[] }>('/api/lead-sources').then((response) => setSources(response.data.data)).catch(() => setSources([]));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff8f8', display: 'grid', placeItems: 'center', px: 2, py: 4 }}>
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 720 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box component="img" src="/savit-logo.svg" alt="Savit" sx={{ height: 68, width: 'auto' }} />
        </Box>
        <Typography variant="h4">Contact us</Typography>
        <Typography color="text.secondary">Tell us what you need. A member of the team will follow up.</Typography>
        <Card>
          {done && <Alert severity="success">Thanks. Your inquiry was submitted.</Alert>}
          {error && <Alert>{error}</Alert>}
          <form
            onSubmit={handleSubmit(async (values) => {
              setError('');
              if (file) {
                const problem = attachmentError(file);
                if (problem) {
                  setFileError(problem);
                  return;
                }
              }

              const body = new FormData();
              body.append('contact_name', values.contact_name);
              body.append('email', values.email);
              body.append('message', values.message);
              if (values.phone) body.append('phone', values.phone);
              if (values.company) body.append('company', values.company);
              if (values.lead_source_id) body.append('lead_source_id', values.lead_source_id);
              if (file) body.append('attachment', file);

              try {
                await api.post('/api/inquiries', body);
                setDone(true);
                setFile(null);
                setFileError('');
                reset();
              } catch (caught) {
                if (axios.isAxiosError(caught) && caught.response?.status === 422) {
                  const errors = (caught.response.data?.errors ?? {}) as Record<string, string[]>;
                  (Object.keys(errors) as Array<keyof FormValues | 'attachment'>).forEach((field) => {
                    const message = errors[field]?.[0];
                    if (!message) return;
                    if (field === 'attachment') {
                      setFileError(message);
                      return;
                    }
                    setFieldError(field, { message });
                  });
                  setError('Check the highlighted fields and try again.');
                  return;
                }
                setError('We could not submit that inquiry. Check the form and try again.');
              }
            })}
          >
            <FormInput label="Name" errorText={formState.errors.contact_name?.message} {...register('contact_name')} />
            <FormInput label="Email" type="email" errorText={formState.errors.email?.message} {...register('email')} />
            <FormInput label="Phone" errorText={formState.errors.phone?.message} {...register('phone')} />
            <FormInput label="Company" errorText={formState.errors.company?.message} {...register('company')} />
            <Select
              label="How did you hear about us?"
              allowEmpty
              emptyLabel="Select a source"
              options={sources.map((source) => ({ value: source.id, label: source.name }))}
              errorText={formState.errors.lead_source_id?.message}
              {...register('lead_source_id')}
            />
            <FormInput label="Message" multiline minRows={4} errorText={formState.errors.message?.message} {...register('message')} />
            <Button variant="outlined" component="label" sx={{ mt: 1 }} color={fileError ? 'error' : 'primary'}>
              {file ? file.name : 'Attach a file'}
              <input
                hidden
                type="file"
                accept={ATTACHMENT_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  setFile(next);
                  setFileError(next ? attachmentError(next) : '');
                  event.target.value = '';
                }}
              />
            </Button>
            <FormHelperText error={Boolean(fileError)} sx={{ mx: 0 }}>{fileError || ATTACHMENT_HINT}</FormHelperText>
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={formState.isSubmitting}>
              Submit inquiry
            </Button>
          </form>
        </Card>
        <Link component={RouterLink} to="/login">
          Staff sign in
        </Link>
      </Stack>
    </Box>
  );
}
