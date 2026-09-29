import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { withAccess } from '../access';
import { api } from '../api/client';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { FormInput } from '../components/FormInput';
import { PageHeader } from '../components/PageHeader';
import { Select } from '../components/Select';
import { STATUS_LABELS, STATUSES, formatWhen, type Activity, type Inquiry, type User } from '../types';

const prosePattern = new RegExp("^[\\p{L}\\p{M}\\p{N}\\s.,;:!?'\"()&+@#%/-]*$", 'u');

function validationMessage(caught: unknown, fallback: string): string {
  if (axios.isAxiosError(caught) && caught.response?.status === 422) {
    const errors = (caught.response.data?.errors ?? {}) as Record<string, string[]>;
    const first = Object.values(errors).flat()[0];
    if (typeof first === 'string') return first;
  }
  return fallback;
}

export function InquiryDetailPage() {
  const { id } = useParams();
  const { hash } = useLocation();
  const [params] = useSearchParams();
  const expires = params.get('expires');
  const signature = params.get('signature');
  const access = expires && signature ? { expires: Number(expires), signature } : null;
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [team, setTeam] = useState<User[]>([]);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [comment, setComment] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [remindAt, setRemindAt] = useState('');

  async function load() {
    if (!access) {
      throw new Error('missing signature');
    }
    const [inquiryResponse, teamResponse] = await Promise.all([
      api.get<{ data: Inquiry }>(withAccess(`/api/inquiries/${id}`, access)),
      api.get<{ data: User[] }>('/api/team'),
    ]);
    setInquiry(inquiryResponse.data.data);
    setTeam(teamResponse.data.data);
  }

  useEffect(() => {
    load().catch(() => setLoadError('This link is invalid or has expired.'));
  }, [id, expires, signature]);

  useEffect(() => {
    if (!inquiry || !hash) {
      return;
    }
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [inquiry, hash]);

  async function patch(payload: { status?: string; assigned_to?: number | null }) {
    await api.patch(withAccess(`/api/inquiries/${id}`, access), payload);
    await load();
  }

  if (loadError) {
    return <Alert>{loadError}</Alert>;
  }

  if (!inquiry) {
    return <Typography>Loading…</Typography>;
  }

  return (
    <Stack spacing={2.5}>
      {error && <Alert>{error}</Alert>}
      <PageHeader
        title={inquiry.contact_name}
        subtitle={`${inquiry.company || 'No company'} · ${inquiry.email}`}
        actions={<Badge status={inquiry.status} />}
      />
      <Link component={RouterLink} to="/admin/inquiries" underline="hover" sx={{ fontWeight: 600, width: 'fit-content' }}>
        Back to inquiries
      </Link>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Stack sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
        <Card title="Contact" icon={<VisibilityOutlinedIcon fontSize="small" />}>
          <Typography>{inquiry.email}</Typography>
          <Typography color="text.secondary">{inquiry.phone || 'No phone'}</Typography>
          <Typography sx={{ mt: 1 }}>{inquiry.company || 'No company'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {inquiry.lead_source?.name || 'No lead source'} · {formatWhen(inquiry.created_at)}
          </Typography>
          <Typography sx={{ mt: 2 }}>{inquiry.message}</Typography>
          <Select
            label="Status"
            value={inquiry.status}
            options={STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))}
            onChange={(event) => patch({ status: String(event.target.value) }).catch(() => setError('Could not update status.'))}
          />
          <Select
            label="Assignee"
            value={inquiry.assigned_to ?? ''}
            allowEmpty
            emptyLabel="Unassigned"
            options={team.map((member) => ({ value: member.id, label: member.name }))}
            onChange={(event) => {
              const value = event.target.value;
              patch({ assigned_to: value === '' ? null : Number(value) }).catch(() => setError('Could not reassign this inquiry.'));
            }}
          />
        </Card>
        </Stack>
        <Stack spacing={2} sx={{ flex: 1, width: { xs: '100%', lg: 'auto' }, minWidth: 0 }}>
          <Box id="notes" sx={{ scrollMarginTop: 24, borderRadius: '20px', outline: hash === '#notes' ? '2px solid #f1414f' : 'none', outlineOffset: 6 }}>
          <Card title="Follow-up notes" icon={<StickyNote2OutlinedIcon fontSize="small" />}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              What happened with this lead.
            </Typography>
            <EntryList items={inquiry.notes ?? []} empty="No notes yet." />
            <FormInput label="Add a note" multiline minRows={2} value={note} onChange={(event) => setNote(event.target.value)} />
            <Button
              variant="contained"
              disabled={!note.trim()}
              onClick={async () => {
                if (!prosePattern.test(note.trim())) {
                  setError('Remove unsupported characters.');
                  return;
                }
                try {
                  await api.post(withAccess(`/api/inquiries/${id}/notes`, access), { body: note });
                  setNote('');
                  setError('');
                  await load();
                } catch (caught) {
                  setError(validationMessage(caught, 'Could not save that note.'));
                }
              }}
            >
              Save note
            </Button>
          </Card>
          </Box>
          <Card title="Internal comments" icon={<ChatOutlinedIcon fontSize="small" />}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Staff only. These do not belong in the customer record.
            </Typography>
            <EntryList items={inquiry.comments ?? []} empty="No internal comments yet." />
            <FormInput label="Add an internal comment" multiline minRows={2} value={comment} onChange={(event) => setComment(event.target.value)} />
            <Button
              variant="outlined"
              disabled={!comment.trim()}
              onClick={async () => {
                if (!prosePattern.test(comment.trim())) {
                  setError('Remove unsupported characters.');
                  return;
                }
                try {
                  await api.post(withAccess(`/api/inquiries/${id}/comments`, access), { body: comment });
                  setComment('');
                  setError('');
                  await load();
                } catch (caught) {
                  setError(validationMessage(caught, 'Could not save that comment.'));
                }
              }}
            >
              Save comment
            </Button>
          </Card>
          <Card title="Activity" icon={<HistoryOutlinedIcon fontSize="small" />}>
            <Stack spacing={1.25}>
              {(inquiry.activities ?? []).map((item) => (
                <ActivityLine key={item.id} item={item} />
              ))}
              {(inquiry.activities ?? []).length === 0 && <Typography color="text.secondary">No activity yet.</Typography>}
            </Stack>
          </Card>
          <Box id="reminders" sx={{ scrollMarginTop: 24, borderRadius: '20px', outline: hash === '#reminders' ? '2px solid #f1414f' : 'none', outlineOffset: 6 }}>
          <Card title="Reminders" icon={<NotificationsOutlinedIcon fontSize="small" />}>
            <Stack spacing={1}>
              {(inquiry.reminders ?? []).map((item) => (
                <FormControlLabel
                  key={item.id}
                  control={
                    <Checkbox
                      checked={item.is_completed}
                      onChange={async (event) => {
                        await api.patch(withAccess(`/api/reminders/${item.id}`, item.access), { is_completed: event.target.checked });
                        await load();
                      }}
                    />
                  }
                  label={`${item.message} · ${formatWhen(item.remind_at)}`}
                />
              ))}
              {(inquiry.reminders ?? []).length === 0 && <Typography color="text.secondary">No reminders yet.</Typography>}
            </Stack>
            <FormInput label="Reminder" value={reminderMessage} onChange={(event) => setReminderMessage(event.target.value)} />
            <FormInput label="When" type="datetime-local" value={remindAt} onChange={(event) => setRemindAt(event.target.value)} InputLabelProps={{ shrink: true }} />
            <Button
              variant="outlined"
              disabled={!reminderMessage.trim() || !remindAt}
              onClick={async () => {
                if (!prosePattern.test(reminderMessage.trim())) {
                  setError('Remove unsupported characters.');
                  return;
                }
                try {
                  await api.post(withAccess(`/api/inquiries/${id}/reminders`, access), { message: reminderMessage, remind_at: remindAt });
                  setReminderMessage('');
                  setRemindAt('');
                  setError('');
                  await load();
                } catch (caught) {
                  setError(validationMessage(caught, 'Could not save that reminder.'));
                }
              }}
            >
              Add reminder
            </Button>
          </Card>
          </Box>
          <Card title="Attachments" icon={<AttachFileOutlinedIcon fontSize="small" />}>
            {(inquiry.attachments ?? []).length === 0 && <Typography color="text.secondary">No files.</Typography>}
            {(inquiry.attachments ?? []).map((file) => (
              <div key={file.id}>
                <Link
                  component="button"
                  onClick={async () => {
                    const response = await api.get(withAccess(`/api/inquiries/${id}/attachments/${file.id}`, file.access), { responseType: 'blob' });
                    const url = URL.createObjectURL(response.data);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.original_name;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  {file.original_name}
                </Link>
              </div>
            ))}
          </Card>
        </Stack>
      </Stack>
    </Stack>
  );
}

function EntryList({ items, empty }: { items: { id: number; body: string; created_at: string; user?: { name: string } | null }[]; empty: string }) {
  if (items.length === 0) {
    return <Typography color="text.secondary" sx={{ mb: 1.5 }}>{empty}</Typography>;
  }

  return (
    <Stack spacing={1.25} sx={{ mb: 1.5 }}>
      {items.map((item) => (
        <div key={item.id}>
          <Typography variant="body2" color="text.secondary">
            {item.user?.name || 'Someone'} · {formatWhen(item.created_at)}
          </Typography>
          <Typography>{item.body}</Typography>
        </div>
      ))}
    </Stack>
  );
}

function ActivityLine({ item }: { item: Activity }) {
  return (
    <div>
      <Typography variant="body2" color="text.secondary">
        {item.user?.name || 'System'} · {formatWhen(item.created_at)}
      </Typography>
      <Typography>{item.summary}</Typography>
    </div>
  );
}
