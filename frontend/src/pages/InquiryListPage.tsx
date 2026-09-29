import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { inquiryHref, withAccess } from '../access';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { Initials } from '../components/Initials';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../components/Table';
import { STATUS_LABELS, STATUSES, formatWhen, type Inquiry, type PageMeta, type User } from '../types';

export function InquiryListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const assignee = params.get('assigned_to') ?? '';
  const page = Number(params.get('page') || 1);
  const sortParam = params.get('sort') ?? 'received';
  const sort = sortParam === 'name' || sortParam === 'assignee' || sortParam === 'received' ? sortParam : 'received';
  const directionParam = params.get('direction');
  const direction: 'asc' | 'desc' = directionParam === 'asc' || directionParam === 'desc'
    ? directionParam
    : (sort === 'received' ? 'desc' : 'asc');
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [team, setTeam] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setFilter(next: Record<string, string>) {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        merged.set(key, value);
      } else {
        merged.delete(key);
      }
    });
    if (!('page' in next)) {
      merged.delete('page');
    }
    setParams(merged);
  }

  function toggleSort(column: 'name' | 'assignee' | 'received') {
    const nextDirection = sort === column
      ? (direction === 'asc' ? 'desc' : 'asc')
      : (column === 'received' ? 'desc' : 'asc');
    setFilter({ sort: column, direction: nextDirection, page: '' });
  }

  useEffect(() => {
    api.get<{ data: User[] }>('/api/team').then((response) => setTeam(response.data.data)).catch(() => setTeam([]));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setLoading(true);
      api
        .get<{ data: Inquiry[]; meta: PageMeta }>('/api/inquiries', {
          params: {
            page,
            search: search || undefined,
            status: status || undefined,
            assigned_to: assignee || undefined,
            sort,
            direction,
          },
        })
        .then((response) => {
          setRows(response.data.data);
          setMeta(response.data.meta);
          setError('');
        })
        .catch(() => setError('Could not load inquiries.'))
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [page, search, status, assignee, sort, direction]);

  async function updateStatus(inquiry: Inquiry, next: string) {
    const response = await api.patch<{ data: Inquiry }>(withAccess(`/api/inquiries/${inquiry.id}`, inquiry.access), { status: next });
    setRows((current) => current.map((row) => (row.id === inquiry.id ? { ...row, ...response.data.data } : row)));
  }

  async function exportCsv() {
    const response = await api.get('/api/inquiries/export', {
      params: { search: search || undefined, status: status || undefined, assigned_to: assignee || undefined },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inquiries.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const canExport = user?.role === 'admin' || user?.role === 'sales_manager';

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Inquiries"
        subtitle={`${meta.total} visible ${meta.total === 1 ? 'record' : 'records'}. Filter the queue, then open a lead.`}
        actions={canExport ? (
          <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv}>
            Export CSV
          </Button>
        ) : undefined}
      />
      {error && <Alert>{error}</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        <TextField
          label="Search"
          value={search}
          onChange={(event) => setFilter({ search: event.target.value })}
          size="small"
          fullWidth
          sx={{ flex: 1 }}
        />
        <Select
          label="Status"
          value={status}
          size="small"
          allowEmpty
          emptyLabel="All statuses"
          margin="none"
          sx={{ flex: 1 }}
          options={STATUSES.map((item) => ({ value: item, label: STATUS_LABELS[item] }))}
          onChange={(event) => setFilter({ status: String(event.target.value) })}
        />
        <Select
          label="Assignee"
          value={assignee}
          size="small"
          allowEmpty
          emptyLabel="Anyone"
          margin="none"
          sx={{ flex: 1 }}
          options={team.map((member) => ({ value: member.id, label: member.name }))}
          onChange={(event) => setFilter({ assigned_to: String(event.target.value) })}
        />
      </Stack>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sortDirection={sort === 'name' ? direction : false}>
              <TableSortLabel active={sort === 'name'} direction={sort === 'name' ? direction : 'asc'} onClick={() => toggleSort('name')}>
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Status</TableCell>
            <TableCell sortDirection={sort === 'assignee' ? direction : false}>
              <TableSortLabel active={sort === 'assignee'} direction={sort === 'assignee' ? direction : 'asc'} onClick={() => toggleSort('assignee')}>
                Assignee
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sort === 'received' ? direction : false}>
              <TableSortLabel active={sort === 'received'} direction={sort === 'received' ? direction : 'desc'} onClick={() => toggleSort('received')}>
                Received
              </TableSortLabel>
            </TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((inquiry) => (
            <TableRow key={inquiry.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Initials name={inquiry.contact_name} size={36} />
                  <Box>
                    <Button component={RouterLink} to={inquiryHref(inquiry)} sx={{ px: 0, minWidth: 0, fontWeight: 700, color: 'text.primary' }}>
                      {inquiry.contact_name}
                    </Button>
                    <Typography variant="body2" color="text.secondary">{inquiry.email}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{inquiry.company || '—'}</TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={inquiry.status}
                  onChange={(event) => updateStatus(inquiry, event.target.value).catch(() => setError('Could not update that status.'))}
                  sx={{ minWidth: 140 }}
                >
                  {STATUSES.map((item) => (
                    <MenuItem key={item} value={item}>{STATUS_LABELS[item]}</MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>{inquiry.assignee?.name || 'Unassigned'}</TableCell>
              <TableCell>{formatWhen(inquiry.created_at)}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  <Button component={RouterLink} to={inquiryHref(inquiry)} size="small" startIcon={<VisibilityOutlinedIcon fontSize="small" />}>View</Button>
                  <Button component={RouterLink} to={inquiryHref(inquiry, '#notes')} size="small" startIcon={<StickyNote2OutlinedIcon fontSize="small" />}>Notes</Button>
                  <Button component={RouterLink} to={inquiryHref(inquiry, '#reminders')} size="small" startIcon={<NotificationsOutlinedIcon fontSize="small" />}>Reminder</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>No inquiries match these filters.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={meta.current_page} count={meta.last_page} onChange={(next) => setFilter({ page: String(next), search, status, assigned_to: assignee })} />
    </Stack>
  );
}
